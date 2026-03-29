"""
generate_data.py
----------------
Generates a synthetic fraud transaction dataset of 100,000 records.

Features:
    - transaction_amount     : Dollar amount of the transaction
    - merchant_category      : MCC-like category code (e.g., grocery, travel)
    - time_of_day            : Hour of transaction (0-23)
    - day_of_week            : 0=Monday … 6=Sunday
    - user_age               : Customer age in years
    - account_tenure_days    : Days since account opening
    - previous_fraud_flag    : 1 if customer had a prior fraud incident
    - device_type            : desktop / mobile / tablet
    - location_mismatch      : 1 if transaction location differs from usual
    - velocity_last_24h      : Number of transactions in preceding 24 hours
    - is_fraud               : Target label (~2% fraud rate)

Usage:
    python data/generate_data.py
    → writes data/transactions.csv
"""

import numpy as np
import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
SEED = 42
RNG = np.random.default_rng(SEED)
N = 100_000

# ---------------------------------------------------------------------------
# Helper distributions
# ---------------------------------------------------------------------------

MERCHANT_CATEGORIES = [
    "grocery", "restaurant", "travel", "electronics",
    "gas_station", "online_retail", "entertainment", "healthcare",
]

DEVICE_TYPES = ["mobile", "desktop", "tablet"]


def _sample_transaction_amount(size: int, fraud_mask: np.ndarray) -> np.ndarray:
    """
    Legitimate transactions follow a log-normal distribution centred around
    small-to-medium amounts.  Fraudulent transactions tend to cluster at
    atypically large or round-number amounts.
    """
    amounts = np.exp(RNG.normal(loc=4.0, scale=1.2, size=size))          # ~$55 median
    # Fraudsters skew higher
    fraud_idx = np.where(fraud_mask)[0]
    amounts[fraud_idx] = np.exp(RNG.normal(loc=5.5, scale=1.0, size=len(fraud_idx)))
    return np.round(amounts, 2)


def _sample_merchant_category(size: int, fraud_mask: np.ndarray) -> np.ndarray:
    """
    Travel and electronics categories have higher fraud concentration.
    """
    legit_probs  = [0.25, 0.20, 0.10, 0.08, 0.15, 0.12, 0.06, 0.04]
    fraud_probs  = [0.08, 0.07, 0.25, 0.28, 0.06, 0.14, 0.08, 0.04]

    categories = np.empty(size, dtype=object)
    legit_idx = np.where(~fraud_mask)[0]
    fraud_idx = np.where(fraud_mask)[0]

    categories[legit_idx] = RNG.choice(MERCHANT_CATEGORIES, size=len(legit_idx), p=legit_probs)
    categories[fraud_idx] = RNG.choice(MERCHANT_CATEGORIES, size=len(fraud_idx), p=fraud_probs)
    return categories


def _sample_time_of_day(size: int, fraud_mask: np.ndarray) -> np.ndarray:
    """
    Fraudulent transactions are more common in late-night / early-morning hours.
    """
    hours = RNG.integers(6, 22, size=size)           # Legitimate: 6 AM–10 PM
    fraud_idx = np.where(fraud_mask)[0]
    # Fraud: uniform across 24 hours, weighted toward off-hours
    fraud_hours = RNG.integers(0, 24, size=len(fraud_idx))
    hours[fraud_idx] = fraud_hours
    return hours


def generate_dataset(n: int = N) -> pd.DataFrame:
    """
    Build the full synthetic transaction DataFrame.

    Parameters
    ----------
    n : int
        Number of rows to generate.

    Returns
    -------
    pd.DataFrame
    """
    # -----------------------------------------------------------------------
    # 1. Generate fraud labels first (~2 % fraud rate)
    # -----------------------------------------------------------------------
    fraud_prob = 0.02
    is_fraud = RNG.random(size=n) < fraud_prob

    # -----------------------------------------------------------------------
    # 2. Core features
    # -----------------------------------------------------------------------
    transaction_amount   = _sample_transaction_amount(n, is_fraud)
    merchant_category    = _sample_merchant_category(n, is_fraud)
    time_of_day          = _sample_time_of_day(n, is_fraud)
    day_of_week          = RNG.integers(0, 7, size=n)

    # User demographics
    user_age             = RNG.integers(18, 80, size=n)
    account_tenure_days  = RNG.integers(1, 3650, size=n)  # up to 10 years

    # Prior fraud flag — fraudsters are ~4× more likely to have history
    prior_fraud_base     = RNG.random(size=n) < 0.03      # 3 % base rate
    prior_fraud_boost    = is_fraud & (RNG.random(size=n) < 0.15)
    previous_fraud_flag  = (prior_fraud_base | prior_fraud_boost).astype(int)

    # Device type
    device_probs_legit   = [0.55, 0.35, 0.10]
    device_probs_fraud   = [0.65, 0.25, 0.10]   # Fraudsters prefer mobile
    device_type          = np.empty(n, dtype=object)
    legit_idx            = np.where(~is_fraud)[0]
    fraud_idx_arr        = np.where(is_fraud)[0]
    device_type[legit_idx]    = RNG.choice(DEVICE_TYPES, size=len(legit_idx),   p=device_probs_legit)
    device_type[fraud_idx_arr] = RNG.choice(DEVICE_TYPES, size=len(fraud_idx_arr), p=device_probs_fraud)

    # Location mismatch — higher for fraud
    loc_mismatch_legit   = RNG.random(size=n) < 0.05
    loc_mismatch_fraud   = is_fraud & (RNG.random(size=n) < 0.55)
    location_mismatch    = (loc_mismatch_legit | loc_mismatch_fraud).astype(int)

    # Transaction velocity in last 24 hours
    velocity_last_24h    = RNG.poisson(lam=2.5, size=n)
    velocity_last_24h[fraud_idx_arr] = RNG.poisson(lam=6.5, size=len(fraud_idx_arr))
    velocity_last_24h    = np.clip(velocity_last_24h, 0, 30)

    # -----------------------------------------------------------------------
    # 3. Unique transaction ID and timestamp
    # -----------------------------------------------------------------------
    transaction_ids = [f"TXN{str(i).zfill(8)}" for i in range(n)]

    # Random timestamps spread over 12 months in 2023
    base_ts  = pd.Timestamp("2023-01-01")
    offsets  = pd.to_timedelta(RNG.integers(0, 365 * 24 * 60, size=n), unit="min")
    timestamps = base_ts + offsets

    # -----------------------------------------------------------------------
    # 4. Assemble DataFrame
    # -----------------------------------------------------------------------
    df = pd.DataFrame({
        "transaction_id":      transaction_ids,
        "timestamp":           timestamps,
        "transaction_amount":  transaction_amount,
        "merchant_category":   merchant_category,
        "time_of_day":         time_of_day,
        "day_of_week":         day_of_week,
        "user_age":            user_age,
        "account_tenure_days": account_tenure_days,
        "previous_fraud_flag": previous_fraud_flag,
        "device_type":         device_type,
        "location_mismatch":   location_mismatch,
        "velocity_last_24h":   velocity_last_24h,
        "is_fraud":            is_fraud.astype(int),
    })

    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    output_path = Path(__file__).parent / "transactions.csv"
    print(f"Generating {N:,} synthetic transactions …")

    df = generate_dataset(N)

    fraud_rate = df["is_fraud"].mean() * 100
    print(f"  Total rows   : {len(df):,}")
    print(f"  Fraud rows   : {df['is_fraud'].sum():,}  ({fraud_rate:.2f}%)")
    print(f"  Legit rows   : {(df['is_fraud'] == 0).sum():,}")

    df.to_csv(output_path, index=False)
    print(f"  Saved → {output_path}")
