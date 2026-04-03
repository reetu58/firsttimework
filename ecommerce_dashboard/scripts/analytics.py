"""
Analytics & Visualization Module
=================================
Computes KPIs from transaction data and generates matplotlib/seaborn
visualizations + Tableau-ready CSV exports.

Usage: python scripts/analytics.py
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import os
import warnings

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
EXPORT_DIR = os.path.join(BASE_DIR, "data", "exports")
CHARTS_DIR = os.path.join(BASE_DIR, "data", "exports", "charts")

# Style
sns.set_theme(style="whitegrid", palette="husl")
plt.rcParams["figure.figsize"] = (12, 6)
plt.rcParams["figure.dpi"] = 150


def load_data():
    """Load raw transaction data."""
    print("Loading data...")
    txn = pd.read_csv(os.path.join(RAW_DIR, "transactions.csv"), parse_dates=["transaction_date"])
    sellers = pd.read_csv(os.path.join(RAW_DIR, "sellers.csv"))
    products = pd.read_csv(os.path.join(RAW_DIR, "products.csv"))
    print(f"  Transactions: {len(txn):,} | Sellers: {len(sellers):,} | Products: {len(products):,}")
    return txn, sellers, products


def compute_kpis(txn):
    """Compute key performance indicators."""
    print("\nComputing KPIs...")

    orders = txn[txn["order_status"].isin(["Delivered", "Returned", "Cancelled"])]
    delivered = txn[txn["order_status"] == "Delivered"]
    cart_abandoned = txn[txn["order_status"] == "Cart Abandoned"]
    cart_adds = txn[txn["order_status"] != "Viewed Only"]

    kpis = {
        "Total Transactions": len(txn),
        "Total Orders": len(orders),
        "Delivered Orders": len(delivered),
        "Total GMV (INR)": delivered["total_amount"].sum(),
        "Average Order Value (INR)": round(delivered["total_amount"].mean(), 2),
        "Overall Conversion Rate (%)": round(len(orders) / len(txn) * 100, 2),
        "Cart Abandonment Rate (%)": round(len(cart_abandoned) / len(cart_adds) * 100, 2),
        "Return Rate (%)": round(
            len(txn[txn["order_status"] == "Returned"]) /
            len(txn[txn["order_status"].isin(["Delivered", "Returned"])]) * 100, 2
        ),
        "Unique Customers": txn["customer_id"].nunique(),
        "Unique Sellers": txn["seller_id"].nunique(),
        "Active SKUs": txn["sku_id"].nunique(),
    }

    print("\n  === KEY PERFORMANCE INDICATORS ===")
    for k, v in kpis.items():
        if isinstance(v, float) and v > 1000:
            print(f"  {k}: {v:,.2f}")
        else:
            print(f"  {k}: {v:,}")

    return kpis


def chart_gmv_by_category(txn):
    """Bar chart: GMV by product category."""
    delivered = txn[txn["order_status"] == "Delivered"]
    cat_gmv = delivered.groupby("category")["total_amount"].sum().sort_values(ascending=True)

    fig, ax = plt.subplots(figsize=(12, 7))
    bars = ax.barh(cat_gmv.index, cat_gmv.values / 1e6, color=sns.color_palette("viridis", len(cat_gmv)))
    ax.set_xlabel("GMV (INR Millions)", fontsize=12)
    ax.set_title("GMV by Product Category", fontsize=14, fontweight="bold")
    ax.bar_label(bars, fmt="%.1fM", padding=5)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "01_gmv_by_category.png"))
    plt.close()
    print("  Chart: GMV by Category")


def chart_monthly_gmv_trend(txn):
    """Line chart: Monthly GMV trend."""
    delivered = txn[txn["order_status"] == "Delivered"].copy()
    delivered["year_month"] = delivered["transaction_date"].dt.to_period("M").astype(str)
    monthly = delivered.groupby("year_month")["total_amount"].sum().reset_index()

    fig, ax = plt.subplots(figsize=(14, 6))
    ax.plot(monthly["year_month"], monthly["total_amount"] / 1e6, marker="o",
            linewidth=2, color="#2196F3", markersize=8)
    ax.fill_between(range(len(monthly)), monthly["total_amount"].values / 1e6,
                    alpha=0.15, color="#2196F3")
    ax.set_xlabel("Month", fontsize=12)
    ax.set_ylabel("GMV (INR Millions)", fontsize=12)
    ax.set_title("Monthly GMV Trend (2024)", fontsize=14, fontweight="bold")
    ax.set_xticks(range(len(monthly)))
    ax.set_xticklabels(monthly["year_month"], rotation=45, ha="right")

    # Annotate Diwali spike
    diwali_months = monthly[monthly["year_month"].isin(["2024-10", "2024-11"])]
    for _, row in diwali_months.iterrows():
        idx = monthly[monthly["year_month"] == row["year_month"]].index[0]
        ax.annotate("Diwali Season", xy=(idx, row["total_amount"] / 1e6),
                    fontsize=9, color="red", fontweight="bold",
                    xytext=(10, 10), textcoords="offset points")
        break

    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "02_monthly_gmv_trend.png"))
    plt.close()
    print("  Chart: Monthly GMV Trend")


def chart_conversion_by_tier(txn):
    """Grouped bar chart: Conversion & abandonment by city tier."""
    tier_data = []
    for tier in ["Tier-1", "Tier-2", "Tier-3"]:
        tier_txn = txn[txn["customer_tier"] == tier]
        orders = tier_txn[tier_txn["order_status"].isin(["Delivered", "Returned", "Cancelled"])]
        cart_adds = tier_txn[tier_txn["order_status"] != "Viewed Only"]
        cart_abandoned = tier_txn[tier_txn["order_status"] == "Cart Abandoned"]

        tier_data.append({
            "Tier": tier,
            "Conversion Rate (%)": round(len(orders) / len(tier_txn) * 100, 2),
            "Cart Abandonment Rate (%)": round(len(cart_abandoned) / len(cart_adds) * 100, 2) if len(cart_adds) > 0 else 0,
        })

    df = pd.DataFrame(tier_data)

    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(df))
    w = 0.35
    bars1 = ax.bar(x - w / 2, df["Conversion Rate (%)"], w, label="Conversion Rate", color="#4CAF50")
    bars2 = ax.bar(x + w / 2, df["Cart Abandonment Rate (%)"], w, label="Cart Abandonment Rate", color="#F44336")
    ax.set_xticks(x)
    ax.set_xticklabels(df["Tier"], fontsize=12)
    ax.set_ylabel("Percentage (%)", fontsize=12)
    ax.set_title("Conversion & Cart Abandonment by City Tier", fontsize=14, fontweight="bold")
    ax.legend(fontsize=11)
    ax.bar_label(bars1, fmt="%.1f%%", padding=3)
    ax.bar_label(bars2, fmt="%.1f%%", padding=3)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "03_conversion_by_tier.png"))
    plt.close()
    print("  Chart: Conversion by City Tier")


def chart_payment_methods(txn):
    """Pie chart: Payment method distribution."""
    orders = txn[txn["payment_method"].notna()]
    payment_dist = orders["payment_method"].value_counts()

    fig, ax = plt.subplots(figsize=(9, 9))
    colors = sns.color_palette("Set2", len(payment_dist))
    wedges, texts, autotexts = ax.pie(
        payment_dist.values, labels=payment_dist.index, autopct="%1.1f%%",
        colors=colors, startangle=90, textprops={"fontsize": 11}
    )
    ax.set_title("Payment Method Distribution (India)", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "04_payment_methods.png"))
    plt.close()
    print("  Chart: Payment Methods")


def chart_category_conversion_heatmap(txn):
    """Heatmap: Conversion rate by category and tier."""
    pivot_data = []
    for category in txn["category"].unique():
        for tier in ["Tier-1", "Tier-2", "Tier-3"]:
            subset = txn[(txn["category"] == category) & (txn["customer_tier"] == tier)]
            orders = subset[subset["order_status"].isin(["Delivered", "Returned", "Cancelled"])]
            conv = round(len(orders) / len(subset) * 100, 2) if len(subset) > 0 else 0
            pivot_data.append({"Category": category, "Tier": tier, "Conversion Rate (%)": conv})

    df = pd.DataFrame(pivot_data)
    pivot = df.pivot(index="Category", columns="Tier", values="Conversion Rate (%)")

    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(pivot, annot=True, fmt=".1f", cmap="YlGn", linewidths=0.5, ax=ax)
    ax.set_title("Conversion Rate (%) by Category & City Tier", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "05_conversion_heatmap.png"))
    plt.close()
    print("  Chart: Conversion Heatmap")


def chart_weekly_kpi_trend(txn):
    """Dual-axis line chart: Weekly GMV and conversion rate."""
    txn_copy = txn.copy()
    txn_copy["year_week"] = txn_copy["transaction_date"].dt.isocalendar().week

    weekly = txn_copy.groupby("year_week").agg(
        total_events=("transaction_id", "count"),
        orders=("order_status", lambda x: (x.isin(["Delivered", "Returned", "Cancelled"])).sum()),
        gmv=("total_amount", lambda x: x[txn_copy.loc[x.index, "order_status"] == "Delivered"].sum()),
    ).reset_index()
    weekly["conversion_rate"] = round(weekly["orders"] / weekly["total_events"] * 100, 2)

    fig, ax1 = plt.subplots(figsize=(14, 6))
    ax1.bar(weekly["year_week"], weekly["gmv"] / 1e6, alpha=0.6, color="#2196F3", label="Weekly GMV")
    ax1.set_xlabel("Week of Year", fontsize=12)
    ax1.set_ylabel("GMV (INR Millions)", fontsize=12, color="#2196F3")
    ax1.tick_params(axis="y", labelcolor="#2196F3")

    ax2 = ax1.twinx()
    ax2.plot(weekly["year_week"], weekly["conversion_rate"], color="#F44336",
             linewidth=2, marker=".", label="Conversion Rate")
    ax2.set_ylabel("Conversion Rate (%)", fontsize=12, color="#F44336")
    ax2.tick_params(axis="y", labelcolor="#F44336")

    ax1.set_title("Weekly GMV & Conversion Rate", fontsize=14, fontweight="bold")
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left")
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "06_weekly_kpi_trend.png"))
    plt.close()
    print("  Chart: Weekly KPI Trend")


def chart_discount_vs_conversion(txn):
    """Bar chart: Discount bands vs conversion rate."""
    txn_copy = txn.copy()
    txn_copy["discount_band"] = pd.cut(
        txn_copy["discount_pct"],
        bins=[-1, 0, 10, 20, 30, 100],
        labels=["No Discount", "1-10%", "11-20%", "21-30%", "30%+"]
    )

    disc_data = txn_copy.groupby("discount_band", observed=True).agg(
        total=("transaction_id", "count"),
        orders=("order_status", lambda x: (x.isin(["Delivered", "Returned", "Cancelled"])).sum()),
    ).reset_index()
    disc_data["conversion_rate"] = round(disc_data["orders"] / disc_data["total"] * 100, 2)

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(disc_data["discount_band"].astype(str), disc_data["conversion_rate"],
                  color=sns.color_palette("coolwarm", len(disc_data)))
    ax.set_xlabel("Discount Band", fontsize=12)
    ax.set_ylabel("Conversion Rate (%)", fontsize=12)
    ax.set_title("Impact of Discount on Conversion Rate", fontsize=14, fontweight="bold")
    ax.bar_label(bars, fmt="%.1f%%", padding=3)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "07_discount_vs_conversion.png"))
    plt.close()
    print("  Chart: Discount vs Conversion")


def chart_top_cities_gmv(txn):
    """Horizontal bar: Top 15 cities by GMV."""
    delivered = txn[txn["order_status"] == "Delivered"]
    customers = pd.read_csv(os.path.join(RAW_DIR, "customers.csv"))
    merged = delivered.merge(customers[["customer_id", "customer_city"]], on="customer_id")
    city_gmv = merged.groupby("customer_city")["total_amount"].sum().nlargest(15).sort_values()

    fig, ax = plt.subplots(figsize=(12, 8))
    bars = ax.barh(city_gmv.index, city_gmv.values / 1e6, color=sns.color_palette("rocket", len(city_gmv)))
    ax.set_xlabel("GMV (INR Millions)", fontsize=12)
    ax.set_title("Top 15 Indian Cities by GMV", fontsize=14, fontweight="bold")
    ax.bar_label(bars, fmt="%.1fM", padding=5)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "08_top_cities_gmv.png"))
    plt.close()
    print("  Chart: Top Cities by GMV")


def export_tableau_data(txn, sellers):
    """Export Tableau-ready CSV files."""
    print("\nExporting Tableau-ready data...")

    delivered = txn[txn["order_status"] == "Delivered"].copy()
    delivered["year_month"] = delivered["transaction_date"].dt.to_period("M").astype(str)

    # Category-month summary
    cat_month = delivered.groupby(["category", "year_month"]).agg(
        gmv=("total_amount", "sum"),
        orders=("transaction_id", "count"),
        aov=("total_amount", "mean"),
        avg_discount=("discount_pct", "mean"),
        unique_customers=("customer_id", "nunique"),
        unique_sellers=("seller_id", "nunique"),
    ).reset_index()
    cat_month.to_csv(os.path.join(EXPORT_DIR, "tableau_category_monthly.csv"), index=False)

    # Tier-category summary
    tier_cat = delivered.groupby(["customer_tier", "category"]).agg(
        gmv=("total_amount", "sum"),
        orders=("transaction_id", "count"),
        aov=("total_amount", "mean"),
    ).reset_index()
    tier_cat.to_csv(os.path.join(EXPORT_DIR, "tableau_tier_category.csv"), index=False)

    # Full funnel data
    funnel = txn.groupby(["category", "customer_tier", "order_status"]).size().reset_index(name="count")
    funnel.to_csv(os.path.join(EXPORT_DIR, "tableau_funnel_data.csv"), index=False)

    # Seller health summary
    seller_summary = sellers.copy()
    seller_orders = txn[txn["order_status"].isin(["Delivered", "Returned", "Cancelled"])].groupby("seller_id").agg(
        total_orders=("transaction_id", "count"),
        total_gmv=("total_amount", "sum"),
    ).reset_index()
    seller_summary = seller_summary.merge(seller_orders, on="seller_id", how="left").fillna(0)
    seller_summary.to_csv(os.path.join(EXPORT_DIR, "tableau_seller_health.csv"), index=False)

    print(f"  Exported 4 Tableau CSV files to {EXPORT_DIR}/")


def main():
    os.makedirs(CHARTS_DIR, exist_ok=True)
    os.makedirs(EXPORT_DIR, exist_ok=True)

    print("=" * 60)
    print("E-COMMERCE ANALYTICS & VISUALIZATION")
    print("=" * 60)

    txn, sellers, products = load_data()
    kpis = compute_kpis(txn)

    print("\nGenerating visualizations...")
    chart_gmv_by_category(txn)
    chart_monthly_gmv_trend(txn)
    chart_conversion_by_tier(txn)
    chart_payment_methods(txn)
    chart_category_conversion_heatmap(txn)
    chart_weekly_kpi_trend(txn)
    chart_discount_vs_conversion(txn)
    chart_top_cities_gmv(txn)

    export_tableau_data(txn, sellers)

    # Save KPIs as CSV
    kpi_df = pd.DataFrame([kpis]).T.reset_index()
    kpi_df.columns = ["Metric", "Value"]
    kpi_df.to_csv(os.path.join(EXPORT_DIR, "kpi_summary.csv"), index=False)

    print("\n" + "=" * 60)
    print("ANALYTICS COMPLETE")
    print(f"Charts saved to: {CHARTS_DIR}")
    print(f"Exports saved to: {EXPORT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
