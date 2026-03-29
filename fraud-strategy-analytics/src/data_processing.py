"""
data_processing.py
------------------
Utilities for loading, validating, and pre-processing the raw transactions CSV
produced by data/generate_data.py.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
RAW_DATA_PATH = Path(__file__).parents[1] / "data" / "transactions.csv"

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
TARGET_COL = "is_fraud"
ID_COL = "transaction_id"
TIMESTAMP_COL = "timestamp"


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

def load_raw_data(path: str | Path = RAW_DATA_PATH) -> pd.DataFrame:
    """
    Load the raw transactions CSV and cast column types.

    Parameters
    ----------
    path : str or Path
        Path to the CSV file.

    Returns
    -------
    pd.DataFrame
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {path}. "
            "Run `python data/generate_data.py` first."
        )

    df = pd.read_csv(path, parse_dates=[TIMESTAMP_COL])
    logger.info("Loaded %d rows from %s", len(df), path)
    return df


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_schema(df: pd.DataFrame) -> None:
    """
    Assert that the DataFrame has the expected columns and no nulls in key fields.

    Raises
    ------
    ValueError
        If schema validation fails.
    """
    expected = set(NUMERIC_COLS + CATEGORICAL_COLS + [TARGET_COL, ID_COL, TIMESTAMP_COL])
    missing = expected - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    null_counts = df[NUMERIC_COLS + [TARGET_COL]].isnull().sum()
    if null_counts.any():
        raise ValueError(f"Null values detected:\n{null_counts[null_counts > 0]}")

    logger.info("Schema validation passed.")


# ---------------------------------------------------------------------------
# Cleaning
# ---------------------------------------------------------------------------

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply basic cleaning steps:
      - Drop duplicate transaction IDs
      - Clip extreme outliers in transaction_amount (>99.9th percentile)
      - Ensure velocity_last_24h >= 0

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame  (copy, original not modified)
    """
    df = df.copy()

    # Drop duplicate IDs
    before = len(df)
    df = df.drop_duplicates(subset=[ID_COL])
    removed = before - len(df)
    if removed:
        logger.warning("Dropped %d duplicate transaction IDs.", removed)

    # Clip transaction amount outliers
    cap = df["transaction_amount"].quantile(0.999)
    df["transaction_amount"] = df["transaction_amount"].clip(upper=cap)

    # Ensure non-negative velocity
    df["velocity_last_24h"] = df["velocity_last_24h"].clip(lower=0)

    return df


# ---------------------------------------------------------------------------
# Splitting
# ---------------------------------------------------------------------------

def split_data(
    df: pd.DataFrame,
    test_size: float = 0.2,
    val_size: float = 0.1,
    seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Perform a stratified train / validation / test split.

    Parameters
    ----------
    df        : pd.DataFrame  — cleaned dataset
    test_size : float         — proportion for test set
    val_size  : float         — proportion for validation set (from remaining)
    seed      : int           — random state

    Returns
    -------
    train_df, val_df, test_df : pd.DataFrame
    """
    train_val, test = train_test_split(
        df,
        test_size=test_size,
        stratify=df[TARGET_COL],
        random_state=seed,
    )
    # val_size is relative to the original dataset size
    val_relative = val_size / (1 - test_size)
    train, val = train_test_split(
        train_val,
        test_size=val_relative,
        stratify=train_val[TARGET_COL],
        random_state=seed,
    )

    logger.info(
        "Split sizes — train: %d | val: %d | test: %d",
        len(train), len(val), len(test),
    )
    return train, val, test


# ---------------------------------------------------------------------------
# Convenience pipeline
# ---------------------------------------------------------------------------

def load_and_prepare(
    path: str | Path = RAW_DATA_PATH,
    test_size: float = 0.2,
    val_size: float = 0.1,
    seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    One-shot: load → validate → clean → split.

    Returns
    -------
    train_df, val_df, test_df
    """
    df = load_raw_data(path)
    validate_schema(df)
    df = clean_data(df)
    return split_data(df, test_size=test_size, val_size=val_size, seed=seed)
