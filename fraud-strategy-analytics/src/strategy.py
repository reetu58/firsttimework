"""
strategy.py
-----------
Rule-based + ML hybrid fraud strategy engine.

Core concepts
-------------
1. Score tiers      : Map model fraud scores → APPROVE / REVIEW / DECLINE
2. Tradeoff table   : For every candidate cutoff, quantify business impact:
                        - Fraud catch rate (sensitivity)
                        - False positive rate
                        - Estimated revenue impact
                        - Estimated operations cost
3. Recommended strategy : Select the cutoff tier that maximises a configurable
                           business objective function.
4. Champion-Challenger : Skeleton for A/B testing new strategy variants.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Business assumption constants
# (These are illustrative; adjust to match actual bank economics.)
# ---------------------------------------------------------------------------

AVG_TRANSACTION_AMOUNT  = 150.0    # USD — used when per-transaction amount unavailable
FRAUD_LOSS_RATE         = 0.95     # 95 % of fraud amount is lost / charged-back
REVIEW_COST_PER_CASE    = 12.0     # USD — analyst time to review one case
DECLINE_REVENUE_LOSS    = 0.02     # 2 % interchange / fee revenue lost per declined txn
CHARGEBACK_ADMIN_COST   = 25.0     # Fixed admin cost per fraud that slips through


# ---------------------------------------------------------------------------
# Decision tiers
# ---------------------------------------------------------------------------

class DecisionTier:
    """String constants for strategy decision tiers."""
    APPROVE = "APPROVE"
    REVIEW  = "REVIEW"
    DECLINE = "DECLINE"


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ScoreCutoffs:
    """
    Defines two score thresholds that partition [0,1] into three tiers.

    Scores below `review_threshold`  → APPROVE  (low risk)
    Scores in  [review, decline)     → REVIEW   (medium risk — manual check)
    Scores ≥ `decline_threshold`     → DECLINE  (high risk — block)
    """
    review_threshold:  float = 0.3
    decline_threshold: float = 0.7

    def __post_init__(self):
        if not (0 < self.review_threshold < self.decline_threshold < 1):
            raise ValueError(
                f"Invalid cutoffs: need 0 < review ({self.review_threshold}) "
                f"< decline ({self.decline_threshold}) < 1"
            )

    def assign(self, scores: np.ndarray) -> np.ndarray:
        """
        Vectorised decision assignment.

        Parameters
        ----------
        scores : 1-D float array in [0, 1]

        Returns
        -------
        np.ndarray of strings — DecisionTier values
        """
        decisions = np.where(
            scores >= self.decline_threshold,
            DecisionTier.DECLINE,
            np.where(
                scores >= self.review_threshold,
                DecisionTier.REVIEW,
                DecisionTier.APPROVE,
            ),
        )
        return decisions


@dataclass
class TradeoffRow:
    """One row in the tradeoff table — results for a single decline cutoff."""
    decline_cutoff:     float
    review_cutoff:      float
    fraud_catch_rate:   float   # True positive rate for DECLINE tier
    false_positive_rate: float  # FPR — legitimate txns declined
    review_volume:      int     # Number of cases sent for manual review
    fraud_in_review:    int     # Frauds captured in REVIEW tier
    total_fraud_caught: float   # Fraction of all fraud stopped (DECLINE + REVIEW)
    revenue_impact_usd: float   # Net P&L impact vs. no strategy
    ops_cost_usd:       float   # Cost of running the review queue

    def to_dict(self) -> dict:
        return {
            "decline_cutoff":      round(self.decline_cutoff, 2),
            "review_cutoff":       round(self.review_cutoff,  2),
            "fraud_catch_rate_%":  round(self.fraud_catch_rate   * 100, 1),
            "false_positive_rate_%": round(self.false_positive_rate * 100, 1),
            "review_volume":       self.review_volume,
            "fraud_in_review":     self.fraud_in_review,
            "total_fraud_caught_%": round(self.total_fraud_caught * 100, 1),
            "revenue_impact_usd":  round(self.revenue_impact_usd, 0),
            "ops_cost_usd":        round(self.ops_cost_usd, 0),
            "net_benefit_usd":     round(self.revenue_impact_usd - self.ops_cost_usd, 0),
        }


@dataclass
class StrategyRecommendation:
    """Final recommended strategy with justification."""
    cutoffs:             ScoreCutoffs
    selected_row:        TradeoffRow
    rationale:           str
    champion_challenger: Dict = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Core strategy engine
# ---------------------------------------------------------------------------

class FraudStrategyEngine:
    """
    Computes the tradeoff table and recommends an optimal score-based strategy.

    Usage
    -----
    engine = FraudStrategyEngine(scores, y_true, amounts)
    table  = engine.build_tradeoff_table()
    rec    = engine.recommend(objective="net_benefit")
    print(rec.rationale)
    """

    def __init__(
        self,
        fraud_scores:   np.ndarray,
        y_true:         np.ndarray,
        amounts:        Optional[np.ndarray] = None,
        review_offset:  float = 0.2,
    ):
        """
        Parameters
        ----------
        fraud_scores  : Model fraud probability scores (0–1) for each transaction
        y_true        : Ground-truth fraud labels (0/1)
        amounts       : Transaction amounts (USD). Defaults to AVG_TRANSACTION_AMOUNT.
        review_offset : The REVIEW threshold is set to (decline_cutoff - review_offset)
        """
        self.scores        = np.asarray(fraud_scores, dtype=float)
        self.y_true        = np.asarray(y_true,       dtype=int)
        self.amounts       = (
            np.asarray(amounts, dtype=float)
            if amounts is not None
            else np.full(len(self.scores), AVG_TRANSACTION_AMOUNT)
        )
        self.review_offset = review_offset
        self._table_cache: Optional[pd.DataFrame] = None

    # -----------------------------------------------------------------------
    # Tradeoff table
    # -----------------------------------------------------------------------

    def _evaluate_cutoff(self, decline_cutoff: float) -> TradeoffRow:
        """Compute business metrics for one specific decline threshold."""
        review_cutoff = max(0.01, decline_cutoff - self.review_offset)

        cutoffs   = ScoreCutoffs(review_threshold=review_cutoff, decline_threshold=decline_cutoff)
        decisions = cutoffs.assign(self.scores)

        is_declined = decisions == DecisionTier.DECLINE
        is_reviewed = decisions == DecisionTier.REVIEW
        is_approved = decisions == DecisionTier.APPROVE

        n_fraud = self.y_true.sum()
        n_legit = len(self.y_true) - n_fraud

        # ---- Fraud metrics ----
        fraud_declined    = (is_declined & (self.y_true == 1)).sum()
        fraud_reviewed    = (is_reviewed & (self.y_true == 1)).sum()
        fraud_approved    = (is_approved & (self.y_true == 1)).sum()

        fraud_catch_rate  = fraud_declined / max(n_fraud, 1)
        total_fraud_caught = (fraud_declined + fraud_reviewed * 0.8) / max(n_fraud, 1)
        # (Assume 80% of reviewed fraud is actually caught via manual review)

        # ---- False positive rate ----
        legit_declined     = (is_declined & (self.y_true == 0)).sum()
        false_positive_rate = legit_declined / max(n_legit, 1)

        # ---- Revenue impact (vs. doing nothing) ----
        # Fraud losses prevented by declining
        fraud_loss_prevented = (
            self.amounts[is_declined & (self.y_true == 1)].sum() * FRAUD_LOSS_RATE
        )
        # Fraud losses prevented by review queue (partial)
        fraud_loss_review = (
            self.amounts[is_reviewed & (self.y_true == 1)].sum() * FRAUD_LOSS_RATE * 0.8
        )
        # Revenue lost by declining legitimate transactions
        legit_declined_amounts = self.amounts[is_declined & (self.y_true == 0)]
        revenue_lost = legit_declined_amounts.sum() * DECLINE_REVENUE_LOSS

        # Chargeback admin cost for fraud that slips through
        chargeback_cost = fraud_approved * CHARGEBACK_ADMIN_COST

        net_revenue_impact = (
            fraud_loss_prevented
            + fraud_loss_review
            - revenue_lost
            - chargeback_cost
        )

        # ---- Operations cost ----
        review_volume = int(is_reviewed.sum())
        ops_cost      = review_volume * REVIEW_COST_PER_CASE

        return TradeoffRow(
            decline_cutoff=decline_cutoff,
            review_cutoff=review_cutoff,
            fraud_catch_rate=float(fraud_catch_rate),
            false_positive_rate=float(false_positive_rate),
            review_volume=review_volume,
            fraud_in_review=int(fraud_reviewed),
            total_fraud_caught=min(1.0, float(total_fraud_caught)),
            revenue_impact_usd=float(net_revenue_impact),
            ops_cost_usd=float(ops_cost),
        )

    def build_tradeoff_table(
        self,
        decline_cutoffs: Optional[List[float]] = None,
    ) -> pd.DataFrame:
        """
        Build a tradeoff table across a range of decline thresholds.

        Parameters
        ----------
        decline_cutoffs : List of thresholds to evaluate.
                          Defaults to [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].

        Returns
        -------
        pd.DataFrame  — one row per cutoff, sorted by fraud_catch_rate desc
        """
        if decline_cutoffs is None:
            decline_cutoffs = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

        rows = [self._evaluate_cutoff(c) for c in decline_cutoffs]
        df   = pd.DataFrame([r.to_dict() for r in rows])
        self._table_cache = df
        return df

    # -----------------------------------------------------------------------
    # Strategy recommendation
    # -----------------------------------------------------------------------

    def recommend(
        self,
        objective: str = "net_benefit",
        min_fraud_catch_rate: float = 0.50,
        max_false_positive_rate: float = 0.05,
        decline_cutoffs: Optional[List[float]] = None,
    ) -> StrategyRecommendation:
        """
        Select the strategy that maximises `objective` subject to constraints.

        Parameters
        ----------
        objective             : "net_benefit" | "fraud_catch_rate" | "f1_proxy"
        min_fraud_catch_rate  : Hard constraint — must catch ≥ this % of fraud
        max_false_positive_rate: Hard constraint — FPR must not exceed this
        decline_cutoffs       : Passed to build_tradeoff_table()

        Returns
        -------
        StrategyRecommendation
        """
        table = self.build_tradeoff_table(decline_cutoffs)

        # Apply hard constraints
        feasible = table[
            (table["fraud_catch_rate_%"] / 100 >= min_fraud_catch_rate)
            & (table["false_positive_rate_%"] / 100 <= max_false_positive_rate)
        ].copy()

        if feasible.empty:
            logger.warning(
                "No feasible strategy found under constraints "
                "(min_catch=%.0f%%, max_fpr=%.1f%%). Relaxing constraints.",
                min_fraud_catch_rate * 100,
                max_false_positive_rate * 100,
            )
            feasible = table.copy()

        # Rank by objective
        if objective == "net_benefit":
            best_idx = feasible["net_benefit_usd"].idxmax()
        elif objective == "fraud_catch_rate":
            best_idx = feasible["fraud_catch_rate_%"].idxmax()
        elif objective == "f1_proxy":
            # Balance catch rate and false positives
            feasible["f1_proxy"] = (
                2 * feasible["fraud_catch_rate_%"]
                / (feasible["fraud_catch_rate_%"] + feasible["false_positive_rate_%"] + 1e-9)
            )
            best_idx = feasible["f1_proxy"].idxmax()
        else:
            raise ValueError(f"Unknown objective: {objective!r}")

        best_row_dict = feasible.loc[best_idx]
        raw_row       = self._evaluate_cutoff(best_row_dict["decline_cutoff"])
        cutoffs       = ScoreCutoffs(
            review_threshold=best_row_dict["review_cutoff"],
            decline_threshold=best_row_dict["decline_cutoff"],
        )

        rationale = self._generate_rationale(best_row_dict, objective)
        champion_challenger = self._champion_challenger_skeleton(cutoffs)

        return StrategyRecommendation(
            cutoffs=cutoffs,
            selected_row=raw_row,
            rationale=rationale,
            champion_challenger=champion_challenger,
        )

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    @staticmethod
    def _generate_rationale(row: pd.Series, objective: str) -> str:
        """Produce a human-readable justification for the selected cutoff."""
        lines = [
            "=== RECOMMENDED FRAUD STRATEGY ===",
            "",
            f"  Objective          : Maximise {objective.replace('_', ' ')}",
            f"  REVIEW threshold   : {row['review_cutoff']:.2f}",
            f"  DECLINE threshold  : {row['decline_cutoff']:.2f}",
            "",
            "  KEY METRICS",
            f"  ├─ Fraud catch rate (auto-decline) : {row['fraud_catch_rate_%']:.1f}%",
            f"  ├─ Total fraud stopped (incl. review): {row['total_fraud_caught_%']:.1f}%",
            f"  ├─ False positive rate             : {row['false_positive_rate_%']:.1f}%",
            f"  ├─ Review queue size               : {row['review_volume']:,} cases",
            f"  ├─ Fraud flagged for review        : {row['fraud_in_review']:,} cases",
            f"  ├─ Estimated net revenue benefit   : ${row['net_benefit_usd']:,.0f}",
            f"  └─ Operations cost (review queue)  : ${row['ops_cost_usd']:,.0f}",
            "",
            "  RATIONALE",
            "  Transactions scoring above the DECLINE threshold are automatically",
            "  blocked — these have the highest probability of fraud and the lowest",
            "  chance of being legitimate customer activity. Transactions in the",
            "  REVIEW band are routed to the fraud analyst queue for manual inspection.",
            "  All other transactions are approved with no friction added.",
            "",
            "  This configuration was selected because it delivers the best",
            f"  '{objective}' while keeping the false positive rate below the",
            "  acceptable threshold (limiting customer friction and revenue leakage).",
        ]
        return "\n".join(lines)

    @staticmethod
    def _champion_challenger_skeleton(champion_cutoffs: ScoreCutoffs) -> Dict:
        """
        Return a champion-challenger framework configuration skeleton.

        In production this would be wired to a traffic-splitting layer that
        routes a percentage of transactions to the challenger strategy and
        tracks outcomes for statistical comparison.
        """
        return {
            "champion": {
                "name": "Champion_v1",
                "review_threshold":  champion_cutoffs.review_threshold,
                "decline_threshold": champion_cutoffs.decline_threshold,
                "traffic_pct": 90,
                "description": "Current production strategy",
            },
            "challenger": {
                "name": "Challenger_v1",
                "review_threshold":  round(champion_cutoffs.review_threshold - 0.05, 2),
                "decline_threshold": round(champion_cutoffs.decline_threshold - 0.05, 2),
                "traffic_pct": 10,
                "description": (
                    "Tighter thresholds — testing whether catching ~5% more fraud "
                    "is worth the additional false positives."
                ),
            },
            "success_metric": "net_benefit_usd",
            "minimum_sample_size": 10_000,
            "evaluation_cadence": "bi-weekly",
            "notes": (
                "Promote challenger to champion when it shows statistically significant "
                "improvement (p < 0.05) on the success metric over a 4-week evaluation window."
            ),
        }


# ---------------------------------------------------------------------------
# Rule-based pre-filters (applied BEFORE the ML score)
# ---------------------------------------------------------------------------

class RuleBasedFilter:
    """
    Hard rules that immediately DECLINE a transaction regardless of ML score.
    These represent well-understood, high-confidence fraud patterns.

    In a hybrid strategy, rule hits are logged separately so they can be
    audited and refreshed independently of the ML model.
    """

    @staticmethod
    def apply(df: pd.DataFrame) -> pd.DataFrame:
        """
        Add a column `rule_decline` (1/0) to the DataFrame.

        Current rules
        -------------
        R1 : velocity_last_24h > 15  (burst of transactions — card-testing)
        R2 : location_mismatch == 1 AND previous_fraud_flag == 1
        R3 : transaction_amount > 5000 AND account_tenure_days < 30
        """
        df = df.copy()

        r1 = df["velocity_last_24h"] > 15
        r2 = (df["location_mismatch"] == 1) & (df["previous_fraud_flag"] == 1)
        r3 = (df["transaction_amount"] > 5_000) & (df["account_tenure_days"] < 30)

        df["rule_decline"]  = (r1 | r2 | r3).astype(int)
        df["rule_triggered"] = np.select(
            [r1, r2, r3],
            ["R1_velocity", "R2_location_prior_fraud", "R3_new_acct_high_amt"],
            default="none",
        )
        return df


# ---------------------------------------------------------------------------
# End-to-end hybrid decision function
# ---------------------------------------------------------------------------

def make_decision(
    df: pd.DataFrame,
    fraud_scores: np.ndarray,
    cutoffs: ScoreCutoffs,
) -> pd.DataFrame:
    """
    Apply the full hybrid strategy: rules first, then ML score tiers.

    Parameters
    ----------
    df           : Transaction DataFrame (must contain rule filter columns)
    fraud_scores : Model probability scores (one per row in df)
    cutoffs      : ScoreCutoffs instance

    Returns
    -------
    df with columns: fraud_score, rule_decline, rule_triggered, decision
    """
    df = df.copy()
    df["fraud_score"] = fraud_scores

    # 1. Apply rule-based pre-filter
    df = RuleBasedFilter.apply(df)

    # 2. ML-based tier assignment
    ml_decisions = cutoffs.assign(fraud_scores)
    df["decision"] = ml_decisions

    # 3. Override with hard rule declines
    df.loc[df["rule_decline"] == 1, "decision"] = DecisionTier.DECLINE

    return df
