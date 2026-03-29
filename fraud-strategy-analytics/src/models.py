"""
models.py
---------
Model training, evaluation, and explainability utilities.

Covers:
  - Logistic Regression (baseline)
  - Random Forest
  - XGBoost
  - Evaluation metrics: Precision, Recall, F1, AUC-ROC, KS Statistic
  - SHAP-based feature importance
"""

from __future__ import annotations

import logging
import warnings
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import shap
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)
warnings.filterwarnings("ignore", category=UserWarning)

# ---------------------------------------------------------------------------
# Model definitions
# ---------------------------------------------------------------------------

def get_logistic_regression(seed: int = 42) -> LogisticRegression:
    """
    Regularised logistic regression — interpretable baseline.
    class_weight='balanced' compensates for the ~2 % fraud rate.
    """
    return LogisticRegression(
        C=0.1,
        max_iter=1000,
        class_weight="balanced",
        solver="lbfgs",
        random_state=seed,
    )


def get_random_forest(seed: int = 42) -> RandomForestClassifier:
    """
    Ensemble tree model with balanced sub-sampling to handle class imbalance.
    """
    return RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=20,
        class_weight="balanced_subsample",
        n_jobs=-1,
        random_state=seed,
    )


def get_xgboost(seed: int = 42, scale_pos_weight: float = 49.0) -> XGBClassifier:
    """
    Gradient-boosted trees. scale_pos_weight ≈ (n_legit / n_fraud) to handle
    class imbalance natively.
    """
    return XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        eval_metric="aucpr",
        use_label_encoder=False,
        random_state=seed,
        verbosity=0,
    )


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

@dataclass
class ModelMetrics:
    """Container for all evaluation metrics for one model."""
    model_name: str
    auc_roc:    float
    ks_stat:    float
    precision:  float
    recall:     float
    f1:         float
    threshold:  float
    confusion:  np.ndarray = field(repr=False)

    def to_dict(self) -> dict:
        return {
            "model": self.model_name,
            "auc_roc":   round(self.auc_roc,   4),
            "ks_stat":   round(self.ks_stat,    4),
            "precision": round(self.precision,  4),
            "recall":    round(self.recall,     4),
            "f1":        round(self.f1,         4),
            "threshold": round(self.threshold,  4),
        }


def ks_statistic(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """
    Compute the Kolmogorov-Smirnov statistic — the maximum separation
    between the cumulative distributions of fraud and non-fraud scores.

    Higher KS → better model separation.
    """
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    return float(np.max(tpr - fpr))


def find_optimal_threshold(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    beta: float = 1.0,
) -> float:
    """
    Find the probability threshold that maximises the F-beta score.

    Parameters
    ----------
    beta : float
        Weight of recall relative to precision.
        beta > 1 favours recall (catching more fraud).
    """
    thresholds = np.linspace(0.01, 0.99, 200)
    best_thresh, best_score = 0.5, 0.0
    for t in thresholds:
        preds = (y_prob >= t).astype(int)
        score = f1_score(y_true, preds, beta=beta, zero_division=0)
        if score > best_score:
            best_score = score
            best_thresh = t
    return best_thresh


def evaluate_model(
    model_name: str,
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: Optional[float] = None,
) -> ModelMetrics:
    """
    Compute the full evaluation suite for a trained model.

    Parameters
    ----------
    model_name : str
    y_true     : Ground-truth binary labels
    y_prob     : Predicted fraud probabilities
    threshold  : Decision threshold. If None, auto-selects via F2 optimisation.

    Returns
    -------
    ModelMetrics
    """
    if threshold is None:
        threshold = find_optimal_threshold(y_true, y_prob, beta=2.0)

    y_pred = (y_prob >= threshold).astype(int)

    return ModelMetrics(
        model_name=model_name,
        auc_roc=roc_auc_score(y_true, y_prob),
        ks_stat=ks_statistic(y_true, y_prob),
        precision=precision_score(y_true, y_pred, zero_division=0),
        recall=recall_score(y_true, y_pred, zero_division=0),
        f1=f1_score(y_true, y_pred, zero_division=0),
        threshold=threshold,
        confusion=confusion_matrix(y_true, y_pred),
    )


def compare_models(metrics_list: List[ModelMetrics]) -> pd.DataFrame:
    """
    Produce a side-by-side comparison DataFrame from a list of ModelMetrics.
    """
    rows = [m.to_dict() for m in metrics_list]
    return pd.DataFrame(rows).set_index("model").sort_values("auc_roc", ascending=False)


# ---------------------------------------------------------------------------
# Training helpers
# ---------------------------------------------------------------------------

def train_model(
    estimator,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: Optional[np.ndarray] = None,
    y_val: Optional[np.ndarray] = None,
) -> object:
    """
    Fit an estimator. For XGBoost, pass validation data for early stopping.

    Returns
    -------
    Fitted estimator
    """
    if isinstance(estimator, XGBClassifier) and X_val is not None:
        estimator.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )
    else:
        estimator.fit(X_train, y_train)

    logger.info("Trained %s", type(estimator).__name__)
    return estimator


# ---------------------------------------------------------------------------
# SHAP explainability
# ---------------------------------------------------------------------------

def compute_shap_values(
    model,
    X: np.ndarray,
    feature_names: List[str],
    max_samples: int = 2000,
) -> Tuple[np.ndarray, shap.Explanation]:
    """
    Compute SHAP values for the given model and feature matrix.

    Supports tree-based models (Random Forest, XGBoost) via TreeExplainer,
    and falls back to LinearExplainer / KernelExplainer for others.

    Parameters
    ----------
    model         : Fitted model
    X             : Feature array (numpy)
    feature_names : List of feature names for display
    max_samples   : Cap the number of rows to keep computation fast

    Returns
    -------
    shap_values   : np.ndarray of shape (n_samples, n_features)
    explanation   : shap.Explanation object for plotting
    """
    idx = np.random.default_rng(42).choice(len(X), size=min(max_samples, len(X)), replace=False)
    X_sample = X[idx]

    if isinstance(model, (RandomForestClassifier, XGBClassifier)):
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X_sample)
        # Random Forest returns list [class0, class1]; take class1
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]
    else:
        # Linear / Logistic Regression
        explainer = shap.LinearExplainer(model, X_sample)
        shap_vals = explainer.shap_values(X_sample)

    explanation = shap.Explanation(
        values=shap_vals,
        data=X_sample,
        feature_names=feature_names,
    )
    return shap_vals, explanation


def get_top_features(
    shap_values: np.ndarray,
    feature_names: List[str],
    top_n: int = 15,
) -> pd.DataFrame:
    """
    Return top_n features ranked by mean absolute SHAP value.
    """
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    df = pd.DataFrame({"feature": feature_names, "mean_abs_shap": mean_abs_shap})
    return df.sort_values("mean_abs_shap", ascending=False).head(top_n).reset_index(drop=True)
