"""
features.py
-----------
Feature engineering pipeline for fraud detection.

Transforms raw transaction data into a model-ready feature matrix by:
  1. Encoding categorical variables
  2. Engineering time-based features
  3. Computing risk score aggregations
  4. Building transaction velocity / pattern features
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# Column references (kept in sync with data_processing.py)
# ---------------------------------------------------------------------------
CATEGORICAL_COLS = ["merchant_category", "device_type"]
NUMERIC_COLS = [
    "transaction_amount",
    "time_of_day",
    "day_of_week",
    "user_age",
    "account_tenure_days",
    "previous_fraud_flag",
    "location_mismatch",
    "velocity_last_24h",
]


# ---------------------------------------------------------------------------
# 1. Time-based features
# ---------------------------------------------------------------------------

def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Derive additional time signals from existing columns.

    New columns added
    -----------------
    is_weekend       : 1 if day_of_week >= 5
    is_night         : 1 if time_of_day in [22, 23, 0, 1, 2, 3, 4, 5]
    is_business_hours: 1 if time_of_day in [9, 17]
    hour_sin / hour_cos : Cyclic encoding of time_of_day
    """
    df = df.copy()

    df["is_weekend"]        = (df["day_of_week"] >= 5).astype(int)
    df["is_night"]          = df["time_of_day"].isin(list(range(22, 24)) + list(range(0, 6))).astype(int)
    df["is_business_hours"] = df["time_of_day"].between(9, 17).astype(int)

    # Cyclic encoding so 23:00 and 00:00 are numerically close
    df["hour_sin"] = np.sin(2 * np.pi * df["time_of_day"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["time_of_day"] / 24)

    # Day-of-week cyclic encoding
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)

    return df


# ---------------------------------------------------------------------------
# 2. Amount-based features
# ---------------------------------------------------------------------------

def add_amount_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features capturing the magnitude and pattern of transaction amounts.

    New columns added
    -----------------
    log_amount          : log(1 + transaction_amount) to reduce skew
    amount_bucket       : Ordinal bucket [0-4] based on quintile thresholds
    is_round_amount     : 1 if amount has no cents (e.g., $100.00)
    amount_velocity_ratio: transaction_amount / (velocity_last_24h + 1)
    """
    df = df.copy()

    df["log_amount"] = np.log1p(df["transaction_amount"])

    # Quintile-based amount bucket
    labels = [0, 1, 2, 3, 4]
    df["amount_bucket"] = pd.qcut(
        df["transaction_amount"], q=5, labels=labels, duplicates="drop"
    ).astype(int)

    # Round amounts can signal card-testing fraud
    df["is_round_amount"] = (df["transaction_amount"] % 1 == 0).astype(int)

    # Large amount per velocity unit — unusual spending spree signal
    df["amount_velocity_ratio"] = df["transaction_amount"] / (df["velocity_last_24h"] + 1)

    return df


# ---------------------------------------------------------------------------
# 3. Risk aggregation features
# ---------------------------------------------------------------------------

def add_risk_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Combine multiple risk signals into composite risk indicators.

    New columns added
    -----------------
    risk_signal_count   : Number of individual risk flags set (0–4)
    high_risk_merchant  : 1 if merchant_category in {travel, electronics}
    tenure_risk         : 1 if account_tenure_days < 90 (new account)
    age_velocity_risk   : 1 if user_age < 25 AND velocity_last_24h > 5
    """
    df = df.copy()

    df["high_risk_merchant"] = df["merchant_category"].isin(
        ["travel", "electronics"]
    ).astype(int)

    df["tenure_risk"] = (df["account_tenure_days"] < 90).astype(int)

    df["age_velocity_risk"] = (
        (df["user_age"] < 25) & (df["velocity_last_24h"] > 5)
    ).astype(int)

    # Composite risk signal count
    df["risk_signal_count"] = (
        df["location_mismatch"]
        + df["previous_fraud_flag"]
        + df["high_risk_merchant"]
        + df["tenure_risk"]
    )

    return df


# ---------------------------------------------------------------------------
# 4. Categorical encoding
# ---------------------------------------------------------------------------

def encode_categoricals(df: pd.DataFrame) -> pd.DataFrame:
    """
    One-hot encode categorical columns, dropping the first level to avoid
    multicollinearity.

    Parameters
    ----------
    df : pd.DataFrame — must contain merchant_category and device_type

    Returns
    -------
    pd.DataFrame with original categorical columns replaced by dummies
    """
    df = pd.get_dummies(
        df,
        columns=CATEGORICAL_COLS,
        drop_first=True,
        dtype=int,
    )
    return df


# ---------------------------------------------------------------------------
# 5. Full feature pipeline (functional API)
# ---------------------------------------------------------------------------

def build_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply the complete feature engineering pipeline in order.

    Steps
    -----
    1. Time features
    2. Amount features
    3. Risk aggregation features
    4. Categorical encoding

    Parameters
    ----------
    df : pd.DataFrame — cleaned raw data (from data_processing.py)

    Returns
    -------
    pd.DataFrame  with all engineered features; original columns preserved
    """
    df = add_time_features(df)
    df = add_amount_features(df)
    df = add_risk_features(df)
    df = encode_categoricals(df)
    return df


# ---------------------------------------------------------------------------
# 6. Scikit-learn compatible transformer (for pipelines)
# ---------------------------------------------------------------------------

class FraudFeatureTransformer(BaseEstimator, TransformerMixin):
    """
    Sklearn-compatible transformer wrapping the feature engineering pipeline.

    Intended for use inside a sklearn Pipeline object:

        pipe = Pipeline([
            ("features", FraudFeatureTransformer()),
            ("scaler",   StandardScaler()),
            ("model",    LogisticRegression()),
        ])
    """

    def __init__(self, scale_numerics: bool = True):
        self.scale_numerics = scale_numerics
        self._scaler = StandardScaler()
        self._feature_names: list[str] = []

    def fit(self, X: pd.DataFrame, y=None):
        X_eng = build_feature_matrix(X.copy())
        X_eng = self._drop_non_features(X_eng)
        self._feature_names = list(X_eng.columns)
        if self.scale_numerics:
            self._scaler.fit(X_eng)
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        X_eng = build_feature_matrix(X.copy())
        X_eng = self._drop_non_features(X_eng)
        # Align columns to training schema
        X_eng = X_eng.reindex(columns=self._feature_names, fill_value=0)
        if self.scale_numerics:
            return self._scaler.transform(X_eng)
        return X_eng.values

    def get_feature_names_out(self) -> list[str]:
        return self._feature_names

    @staticmethod
    def _drop_non_features(df: pd.DataFrame) -> pd.DataFrame:
        """Remove ID, timestamp, and target columns if present."""
        drop_cols = [c for c in ["transaction_id", "timestamp", "is_fraud"] if c in df.columns]
        return df.drop(columns=drop_cols)
