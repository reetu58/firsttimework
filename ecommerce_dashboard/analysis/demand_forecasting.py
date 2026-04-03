"""
Demand Forecasting Module
==========================
Category-level demand forecasting using weekly order volumes.

Models:
- Linear Regression (baseline)
- Random Forest Regressor (primary)

Generates 4-week rolling forecasts per category with confidence intervals.

Usage: python analysis/demand_forecasting.py
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
import os
import warnings

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
FORECAST_DIR = os.path.join(BASE_DIR, "data", "exports", "forecasts")

sns.set_theme(style="whitegrid")


def load_and_prepare_data():
    """Load transactions and prepare weekly aggregates by category."""
    print("Loading and preparing weekly data...")

    txn = pd.read_csv(os.path.join(RAW_DIR, "transactions.csv"), parse_dates=["transaction_date"])
    orders = txn[txn["order_status"].isin(["Delivered", "Returned", "Cancelled"])].copy()

    # Create weekly aggregates per category
    orders["week_start"] = orders["transaction_date"].dt.to_period("W").apply(lambda r: r.start_time)

    weekly = orders.groupby(["category", "week_start"]).agg(
        order_count=("transaction_id", "count"),
        gmv=("total_amount", "sum"),
        avg_order_value=("total_amount", "mean"),
        unique_customers=("customer_id", "nunique"),
        unique_sellers=("seller_id", "nunique"),
        avg_discount=("discount_pct", "mean"),
    ).reset_index()

    weekly = weekly.sort_values(["category", "week_start"]).reset_index(drop=True)
    print(f"  Weekly data: {len(weekly)} rows across {weekly['category'].nunique()} categories")

    return weekly


def create_features(df):
    """Engineer time-series features for forecasting."""
    df = df.copy()
    df["week_num"] = range(len(df))
    df["month"] = df["week_start"].dt.month
    df["quarter"] = df["week_start"].dt.quarter

    # Lag features
    for lag in [1, 2, 3, 4]:
        df[f"lag_{lag}"] = df["order_count"].shift(lag)

    # Rolling features
    df["rolling_mean_4w"] = df["order_count"].rolling(4, min_periods=1).mean()
    df["rolling_std_4w"] = df["order_count"].rolling(4, min_periods=1).std().fillna(0)
    df["rolling_mean_8w"] = df["order_count"].rolling(8, min_periods=1).mean()

    # Growth rate
    df["growth_rate"] = df["order_count"].pct_change().fillna(0).clip(-2, 2)

    # Festive season indicator
    df["is_festive"] = df["month"].isin([10, 11, 1, 8]).astype(int)

    df = df.dropna().reset_index(drop=True)
    return df


def train_and_forecast(category_name, df):
    """Train models and generate 4-week forecast for a category."""
    feature_cols = [
        "week_num", "month", "quarter", "lag_1", "lag_2", "lag_3", "lag_4",
        "rolling_mean_4w", "rolling_std_4w", "rolling_mean_8w", "growth_rate", "is_festive"
    ]

    # Train/test split (last 8 weeks for testing)
    train = df.iloc[:-8]
    test = df.iloc[-8:]

    if len(train) < 10:
        return None

    X_train, y_train = train[feature_cols], train["order_count"]
    X_test, y_test = test[feature_cols], test["order_count"]

    # Model 1: Linear Regression
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)
    lr_mae = mean_absolute_error(y_test, lr_pred)

    # Model 2: Random Forest
    rf = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_mae = mean_absolute_error(y_test, rf_pred)
    rf_r2 = r2_score(y_test, rf_pred)

    # Generate 4-week future forecast using RF (better model)
    last_row = df.iloc[-1]
    future_forecasts = []
    current_lags = [last_row["order_count"]] + [last_row.get(f"lag_{i}", last_row["order_count"]) for i in range(1, 4)]

    for week_ahead in range(1, 5):
        future_week = last_row["week_start"] + pd.Timedelta(weeks=week_ahead)
        future_features = {
            "week_num": last_row["week_num"] + week_ahead,
            "month": future_week.month,
            "quarter": (future_week.month - 1) // 3 + 1,
            "lag_1": current_lags[0],
            "lag_2": current_lags[1] if len(current_lags) > 1 else current_lags[0],
            "lag_3": current_lags[2] if len(current_lags) > 2 else current_lags[0],
            "lag_4": current_lags[3] if len(current_lags) > 3 else current_lags[0],
            "rolling_mean_4w": np.mean(current_lags[:4]),
            "rolling_std_4w": np.std(current_lags[:4]),
            "rolling_mean_8w": last_row["rolling_mean_8w"],
            "growth_rate": (current_lags[0] - current_lags[1]) / current_lags[1] if current_lags[1] > 0 else 0,
            "is_festive": 1 if future_week.month in [10, 11, 1, 8] else 0,
        }

        X_future = pd.DataFrame([future_features])[feature_cols]
        forecast_val = max(0, rf.predict(X_future)[0])
        future_forecasts.append({
            "week_start": future_week,
            "forecasted_orders": round(forecast_val),
        })

        # Update lags
        current_lags = [forecast_val] + current_lags[:3]

    results = {
        "category": category_name,
        "lr_mae": round(lr_mae, 1),
        "rf_mae": round(rf_mae, 1),
        "rf_r2": round(rf_r2, 3),
        "test_actual": y_test.values,
        "test_predicted": rf_pred,
        "test_dates": test["week_start"].values,
        "forecast": future_forecasts,
        "historical": df[["week_start", "order_count"]],
    }

    return results


def plot_forecasts(all_results):
    """Generate forecast visualization for all categories."""
    n_cats = len(all_results)
    fig, axes = plt.subplots(
        (n_cats + 1) // 2, 2, figsize=(16, 4 * ((n_cats + 1) // 2))
    )
    axes = axes.flatten()

    for idx, result in enumerate(all_results):
        ax = axes[idx]
        hist = result["historical"]

        # Historical
        ax.plot(hist["week_start"], hist["order_count"], color="#2196F3",
                linewidth=1.5, label="Historical", alpha=0.8)

        # Test predictions
        ax.plot(result["test_dates"], result["test_predicted"], color="#FF9800",
                linewidth=2, linestyle="--", label="Predicted (test)")

        # Future forecast
        forecast_dates = [f["week_start"] for f in result["forecast"]]
        forecast_vals = [f["forecasted_orders"] for f in result["forecast"]]
        ax.plot(forecast_dates, forecast_vals, color="#F44336",
                linewidth=2, marker="o", label="4-Week Forecast")

        # Confidence band (simple +-MAE)
        mae = result["rf_mae"]
        ax.fill_between(forecast_dates,
                        [max(0, v - mae * 1.5) for v in forecast_vals],
                        [v + mae * 1.5 for v in forecast_vals],
                        alpha=0.15, color="#F44336")

        ax.set_title(f"{result['category']} (R²={result['rf_r2']:.2f})",
                     fontsize=11, fontweight="bold")
        ax.set_ylabel("Orders/Week")
        ax.tick_params(axis="x", rotation=45)
        if idx == 0:
            ax.legend(fontsize=8)

    # Remove empty subplots
    for idx in range(len(all_results), len(axes)):
        fig.delaxes(axes[idx])

    plt.suptitle("Category Demand Forecasts (4-Week Ahead)", fontsize=14, fontweight="bold", y=1.01)
    plt.tight_layout()
    plt.savefig(os.path.join(FORECAST_DIR, "demand_forecasts.png"), bbox_inches="tight")
    plt.close()
    print("  Chart: Category Demand Forecasts saved")


def main():
    os.makedirs(FORECAST_DIR, exist_ok=True)

    print("=" * 60)
    print("DEMAND FORECASTING MODULE")
    print("=" * 60)

    weekly = load_and_prepare_data()

    all_results = []
    forecast_summary = []

    for category in sorted(weekly["category"].unique()):
        cat_data = weekly[weekly["category"] == category].copy().reset_index(drop=True)
        cat_features = create_features(cat_data)

        result = train_and_forecast(category, cat_features)
        if result:
            all_results.append(result)

            # Summary row
            total_forecast = sum(f["forecasted_orders"] for f in result["forecast"])
            forecast_summary.append({
                "Category": category,
                "LR_MAE": result["lr_mae"],
                "RF_MAE": result["rf_mae"],
                "RF_R2": result["rf_r2"],
                "Forecast_Week_1": result["forecast"][0]["forecasted_orders"],
                "Forecast_Week_2": result["forecast"][1]["forecasted_orders"],
                "Forecast_Week_3": result["forecast"][2]["forecasted_orders"],
                "Forecast_Week_4": result["forecast"][3]["forecasted_orders"],
                "Total_4W_Forecast": total_forecast,
            })
            print(f"  {category}: RF MAE={result['rf_mae']:.1f}, R²={result['rf_r2']:.3f}, "
                  f"4W Forecast={total_forecast:,} orders")

    # Save summary
    summary_df = pd.DataFrame(forecast_summary)
    summary_df.to_csv(os.path.join(FORECAST_DIR, "forecast_summary.csv"), index=False)

    # Plot
    print("\nGenerating forecast visualizations...")
    plot_forecasts(all_results)

    print("\n" + "=" * 60)
    print("FORECASTING COMPLETE")
    print(f"Outputs saved to: {FORECAST_DIR}")
    print("=" * 60)
    print("\n  Model Performance Summary:")
    print(summary_df[["Category", "RF_MAE", "RF_R2", "Total_4W_Forecast"]].to_string(index=False))


if __name__ == "__main__":
    main()
