"""
test_strategy.py
----------------
Unit tests for the fraud strategy engine and supporting modules.

Run with:
    pytest tests/test_strategy.py -v
    pytest tests/test_strategy.py -v --cov=src --cov-report=term-missing
"""

import sys
import os

# Ensure the project root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
import pytest

from src.strategy import (
    ScoreCutoffs,
    FraudStrategyEngine,
    RuleBasedFilter,
    make_decision,
    DecisionTier,
    TradeoffRow,
)
from src.features import (
    add_time_features,
    add_amount_features,
    add_risk_features,
    encode_categoricals,
    build_feature_matrix,
)
from src.data_processing import clean_data, split_data, validate_schema
from data.generate_data import generate_dataset


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture(scope="module")
def small_dataset():
    """Generate a small synthetic dataset for fast tests."""
    return generate_dataset(n=500)


@pytest.fixture(scope="module")
def score_arrays():
    """Deterministic fraud scores and labels for strategy tests."""
    rng = np.random.default_rng(42)
    n = 1000
    y = (rng.random(n) < 0.05).astype(int)          # 5% fraud
    # Higher scores for fraud, lower for legit
    scores = np.where(
        y == 1,
        np.clip(rng.beta(5, 2, n), 0, 1),
        np.clip(rng.beta(1, 8, n), 0, 1),
    )
    amounts = rng.lognormal(4.0, 1.2, n)
    return scores, y, amounts


# ============================================================================
# 1. ScoreCutoffs
# ============================================================================

class TestScoreCutoffs:

    def test_valid_cutoffs_no_error(self):
        """Valid cutoffs should not raise."""
        cutoffs = ScoreCutoffs(review_threshold=0.3, decline_threshold=0.7)
        assert cutoffs.review_threshold == 0.3
        assert cutoffs.decline_threshold == 0.7

    def test_invalid_cutoffs_review_ge_decline_raises(self):
        """review_threshold >= decline_threshold must raise ValueError."""
        with pytest.raises(ValueError):
            ScoreCutoffs(review_threshold=0.7, decline_threshold=0.3)

    def test_invalid_cutoffs_equal_raises(self):
        with pytest.raises(ValueError):
            ScoreCutoffs(review_threshold=0.5, decline_threshold=0.5)

    def test_invalid_cutoffs_zero_review_raises(self):
        with pytest.raises(ValueError):
            ScoreCutoffs(review_threshold=0.0, decline_threshold=0.7)

    def test_assign_below_review_is_approve(self):
        cutoffs = ScoreCutoffs(review_threshold=0.3, decline_threshold=0.7)
        scores = np.array([0.0, 0.1, 0.29])
        result = cutoffs.assign(scores)
        assert all(r == DecisionTier.APPROVE for r in result)

    def test_assign_in_review_band(self):
        cutoffs = ScoreCutoffs(review_threshold=0.3, decline_threshold=0.7)
        scores = np.array([0.30, 0.50, 0.69])
        result = cutoffs.assign(scores)
        assert all(r == DecisionTier.REVIEW for r in result)

    def test_assign_above_decline_is_decline(self):
        cutoffs = ScoreCutoffs(review_threshold=0.3, decline_threshold=0.7)
        scores = np.array([0.70, 0.85, 1.0])
        result = cutoffs.assign(scores)
        assert all(r == DecisionTier.DECLINE for r in result)

    def test_assign_all_tiers_present(self):
        cutoffs = ScoreCutoffs(review_threshold=0.3, decline_threshold=0.7)
        scores = np.array([0.1, 0.5, 0.9])
        result = cutoffs.assign(scores)
        assert set(result) == {DecisionTier.APPROVE, DecisionTier.REVIEW, DecisionTier.DECLINE}

    def test_assign_returns_correct_dtype(self):
        cutoffs = ScoreCutoffs()
        scores = np.linspace(0, 1, 20)
        result = cutoffs.assign(scores)
        assert result.dtype.kind in ('U', 'O')  # string or object


# ============================================================================
# 2. FraudStrategyEngine — Tradeoff Table
# ============================================================================

class TestFraudStrategyEngine:

    def test_tradeoff_table_shape(self, score_arrays):
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        table = engine.build_tradeoff_table([0.3, 0.5, 0.7])
        assert len(table) == 3
        assert "fraud_catch_rate_%" in table.columns
        assert "net_benefit_usd" in table.columns

    def test_fraud_catch_rate_decreases_with_higher_cutoff(self, score_arrays):
        """Higher decline threshold → fewer declines → lower catch rate."""
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        table = engine.build_tradeoff_table([0.3, 0.5, 0.7, 0.9])
        catch_rates = table["fraud_catch_rate_%"].values
        # Should be monotonically non-increasing
        assert all(catch_rates[i] >= catch_rates[i + 1] for i in range(len(catch_rates) - 1))

    def test_false_positive_rate_decreases_with_higher_cutoff(self, score_arrays):
        """Higher decline threshold → lower FPR (fewer legitimate txns blocked)."""
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        table = engine.build_tradeoff_table([0.3, 0.5, 0.7, 0.9])
        fpr = table["false_positive_rate_%"].values
        assert all(fpr[i] >= fpr[i + 1] for i in range(len(fpr) - 1))

    def test_review_volume_not_negative(self, score_arrays):
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        table = engine.build_tradeoff_table()
        assert (table["review_volume"] >= 0).all()

    def test_fraud_catch_rate_bounded(self, score_arrays):
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        table = engine.build_tradeoff_table()
        assert (table["fraud_catch_rate_%"] >= 0).all()
        assert (table["fraud_catch_rate_%"] <= 100).all()

    def test_recommend_returns_recommendation(self, score_arrays):
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        rec = engine.recommend(objective="net_benefit")
        assert rec.cutoffs.review_threshold < rec.cutoffs.decline_threshold
        assert len(rec.rationale) > 50

    def test_recommend_champion_challenger_keys(self, score_arrays):
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        rec = engine.recommend()
        cc = rec.champion_challenger
        assert "champion" in cc
        assert "challenger" in cc
        assert "success_metric" in cc
        assert cc["champion"]["traffic_pct"] + cc["challenger"]["traffic_pct"] == 100

    def test_recommend_invalid_objective_raises(self, score_arrays):
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        with pytest.raises(ValueError, match="Unknown objective"):
            engine.recommend(objective="banana")

    def test_tradeoff_row_to_dict_keys(self, score_arrays):
        scores, y, amounts = score_arrays
        engine = FraudStrategyEngine(scores, y, amounts)
        table = engine.build_tradeoff_table([0.5])
        assert "net_benefit_usd" in table.columns
        assert "ops_cost_usd" in table.columns


# ============================================================================
# 3. RuleBasedFilter
# ============================================================================

class TestRuleBasedFilter:

    def _make_df(self, velocity, location_mismatch, prev_fraud, amount, tenure):
        return pd.DataFrame({
            "transaction_id": ["T001"],
            "velocity_last_24h": [velocity],
            "location_mismatch": [location_mismatch],
            "previous_fraud_flag": [prev_fraud],
            "transaction_amount": [amount],
            "account_tenure_days": [tenure],
        })

    def test_r1_velocity_triggers(self):
        df = self._make_df(velocity=16, location_mismatch=0, prev_fraud=0, amount=50, tenure=365)
        result = RuleBasedFilter.apply(df)
        assert result["rule_decline"].iloc[0] == 1
        assert result["rule_triggered"].iloc[0] == "R1_velocity"

    def test_r2_location_prior_fraud_triggers(self):
        df = self._make_df(velocity=2, location_mismatch=1, prev_fraud=1, amount=50, tenure=365)
        result = RuleBasedFilter.apply(df)
        assert result["rule_decline"].iloc[0] == 1
        assert result["rule_triggered"].iloc[0] == "R2_location_prior_fraud"

    def test_r3_new_account_high_amount_triggers(self):
        df = self._make_df(velocity=2, location_mismatch=0, prev_fraud=0, amount=6000, tenure=20)
        result = RuleBasedFilter.apply(df)
        assert result["rule_decline"].iloc[0] == 1
        assert result["rule_triggered"].iloc[0] == "R3_new_acct_high_amt"

    def test_no_rule_triggers_when_clean(self):
        df = self._make_df(velocity=3, location_mismatch=0, prev_fraud=0, amount=100, tenure=500)
        result = RuleBasedFilter.apply(df)
        assert result["rule_decline"].iloc[0] == 0
        assert result["rule_triggered"].iloc[0] == "none"

    def test_rule_decline_column_created(self):
        df = self._make_df(velocity=3, location_mismatch=0, prev_fraud=0, amount=100, tenure=500)
        result = RuleBasedFilter.apply(df)
        assert "rule_decline" in result.columns
        assert "rule_triggered" in result.columns

    def test_original_df_not_modified(self):
        df = self._make_df(velocity=20, location_mismatch=0, prev_fraud=0, amount=100, tenure=500)
        original_cols = list(df.columns)
        RuleBasedFilter.apply(df)
        assert list(df.columns) == original_cols  # Original unchanged


# ============================================================================
# 4. make_decision (hybrid pipeline)
# ============================================================================

class TestMakeDecision:

    def test_rule_override_overrides_ml_approve(self, small_dataset):
        """A rule-triggered transaction should be DECLINED even if ML says APPROVE."""
        df = small_dataset.head(50).copy()
        # Force very low ML scores (all would be APPROVE)
        low_scores = np.zeros(len(df))
        # Force Rule R1 on the first row
        df.iloc[0, df.columns.get_loc("velocity_last_24h")] = 20

        cutoffs = ScoreCutoffs(review_threshold=0.3, decline_threshold=0.7)
        result = make_decision(df, low_scores, cutoffs)

        assert result.iloc[0]["decision"] == DecisionTier.DECLINE

    def test_all_columns_present(self, small_dataset):
        df = small_dataset.head(20).copy()
        scores = np.random.default_rng(0).random(len(df))
        cutoffs = ScoreCutoffs(review_threshold=0.3, decline_threshold=0.7)
        result = make_decision(df, scores, cutoffs)
        assert "fraud_score" in result.columns
        assert "decision" in result.columns
        assert "rule_decline" in result.columns

    def test_decisions_only_valid_values(self, small_dataset):
        df = small_dataset.head(100).copy()
        scores = np.random.default_rng(1).random(len(df))
        cutoffs = ScoreCutoffs(review_threshold=0.3, decline_threshold=0.7)
        result = make_decision(df, scores, cutoffs)
        valid = {DecisionTier.APPROVE, DecisionTier.REVIEW, DecisionTier.DECLINE}
        assert set(result["decision"].unique()).issubset(valid)


# ============================================================================
# 5. Feature Engineering
# ============================================================================

class TestFeatureEngineering:

    def test_add_time_features_creates_columns(self, small_dataset):
        result = add_time_features(small_dataset)
        for col in ["is_weekend", "is_night", "is_business_hours", "hour_sin", "hour_cos"]:
            assert col in result.columns

    def test_cyclic_hour_in_range(self, small_dataset):
        result = add_time_features(small_dataset)
        assert result["hour_sin"].between(-1, 1).all()
        assert result["hour_cos"].between(-1, 1).all()

    def test_is_weekend_binary(self, small_dataset):
        result = add_time_features(small_dataset)
        assert set(result["is_weekend"].unique()).issubset({0, 1})

    def test_add_amount_features_creates_columns(self, small_dataset):
        result = add_amount_features(small_dataset)
        for col in ["log_amount", "amount_bucket", "is_round_amount", "amount_velocity_ratio"]:
            assert col in result.columns

    def test_log_amount_non_negative(self, small_dataset):
        result = add_amount_features(small_dataset)
        assert (result["log_amount"] >= 0).all()

    def test_add_risk_features_creates_columns(self, small_dataset):
        result = add_risk_features(small_dataset)
        for col in ["high_risk_merchant", "tenure_risk", "age_velocity_risk", "risk_signal_count"]:
            assert col in result.columns

    def test_risk_signal_count_non_negative(self, small_dataset):
        result = add_risk_features(small_dataset)
        assert (result["risk_signal_count"] >= 0).all()

    def test_encode_categoricals_drops_originals(self, small_dataset):
        result = encode_categoricals(small_dataset)
        assert "merchant_category" not in result.columns
        assert "device_type" not in result.columns

    def test_build_feature_matrix_increases_columns(self, small_dataset):
        n_before = small_dataset.shape[1]
        result = build_feature_matrix(small_dataset)
        assert result.shape[1] > n_before

    def test_original_not_modified(self, small_dataset):
        original_shape = small_dataset.shape
        build_feature_matrix(small_dataset)
        assert small_dataset.shape == original_shape


# ============================================================================
# 6. Data Processing
# ============================================================================

class TestDataProcessing:

    def test_validate_schema_passes_on_valid_data(self, small_dataset):
        validate_schema(small_dataset)  # Should not raise

    def test_split_sizes_sum_to_total(self, small_dataset):
        train, val, test = split_data(small_dataset)
        assert len(train) + len(val) + len(test) == len(small_dataset)

    def test_split_stratification_preserved(self, small_dataset):
        train, val, test = split_data(small_dataset)
        original_rate = small_dataset["is_fraud"].mean()
        for split in [train, val, test]:
            rate = split["is_fraud"].mean()
            # Allow ±3 percentage point deviation from original
            assert abs(rate - original_rate) < 0.03, f"Fraud rate drift: {rate:.3f} vs {original_rate:.3f}"

    def test_clean_data_returns_dataframe(self, small_dataset):
        result = clean_data(small_dataset)
        assert isinstance(result, pd.DataFrame)

    def test_clean_data_no_negative_velocity(self, small_dataset):
        result = clean_data(small_dataset)
        assert (result["velocity_last_24h"] >= 0).all()


# ============================================================================
# 7. Data Generation
# ============================================================================

class TestDataGeneration:

    def test_generate_default_size(self):
        df = generate_dataset(n=1000)
        assert len(df) == 1000

    def test_fraud_rate_approximately_two_percent(self):
        df = generate_dataset(n=10_000)
        rate = df["is_fraud"].mean()
        assert 0.01 <= rate <= 0.04, f"Fraud rate out of expected range: {rate:.3f}"

    def test_no_null_values(self):
        df = generate_dataset(n=500)
        assert df.isnull().sum().sum() == 0

    def test_all_expected_columns_present(self):
        df = generate_dataset(n=100)
        expected = {
            "transaction_id", "timestamp", "transaction_amount", "merchant_category",
            "time_of_day", "day_of_week", "user_age", "account_tenure_days",
            "previous_fraud_flag", "device_type", "location_mismatch",
            "velocity_last_24h", "is_fraud",
        }
        assert expected.issubset(set(df.columns))

    def test_is_fraud_binary(self):
        df = generate_dataset(n=500)
        assert set(df["is_fraud"].unique()).issubset({0, 1})

    def test_transaction_amount_positive(self):
        df = generate_dataset(n=500)
        assert (df["transaction_amount"] > 0).all()

    def test_time_of_day_in_range(self):
        df = generate_dataset(n=500)
        assert df["time_of_day"].between(0, 23).all()

    def test_day_of_week_in_range(self):
        df = generate_dataset(n=500)
        assert df["day_of_week"].between(0, 6).all()
