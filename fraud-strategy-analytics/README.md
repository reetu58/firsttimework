# Fraud Detection & Strategy Analytics

A portfolio project demonstrating end-to-end fraud strategy design skills relevant to a **Fraud Strategy Associate** role at a major financial institution.

---

## Project Objective

Design and evaluate a production-ready fraud detection strategy that:
1. **Identifies** high-risk transactions using machine learning
2. **Classifies** decisions into APPROVE / REVIEW / DECLINE tiers
3. **Quantifies** the business tradeoff between fraud prevention, false positives, and operational costs
4. **Recommends** an optimal strategy configuration with a champion-challenger testing framework

---

## Repository Structure

```
fraud-strategy-analytics/
├── README.md
├── requirements.txt
├── .gitignore
├── data/
│   └── generate_data.py          # Synthetic dataset generator (100K transactions)
├── notebooks/
│   ├── 01_eda.ipynb               # Exploratory Data Analysis
│   ├── 02_feature_engineering.ipynb
│   ├── 03_model_building.ipynb    # Logistic Regression, Random Forest, XGBoost + SHAP
│   └── 04_strategy_design.ipynb  # Score cutoffs, tradeoff analysis, champion-challenger
├── src/
│   ├── data_processing.py         # Load, validate, clean, split
│   ├── features.py                # Feature engineering pipeline
│   ├── models.py                  # Model training & evaluation utilities
│   └── strategy.py                # Rule-based + ML hybrid strategy engine
├── reports/
│   └── fraud_strategy_summary.md  # Executive summary (stakeholder-ready)
└── tests/
    └── test_strategy.py           # 40+ unit tests
```

---

## Dataset Description

All data is **100% synthetic** — no real customer information is used.

**100,000 transactions** generated with realistic fraud patterns (~2% fraud rate):

| Feature | Description |
|---------|-------------|
| `transaction_amount` | USD amount; fraud skews higher |
| `merchant_category` | 8 categories; travel & electronics have elevated fraud |
| `time_of_day` | Hour 0–23; fraud elevated midnight–5 AM |
| `day_of_week` | 0=Monday; fraud is uniform across days |
| `user_age` | Customer age 18–80 |
| `account_tenure_days` | Days since account opened; newer = riskier |
| `previous_fraud_flag` | 1 if customer had prior fraud incident |
| `device_type` | mobile / desktop / tablet |
| `location_mismatch` | 1 if transaction location is unusual |
| `velocity_last_24h` | Transaction count in preceding 24 hours |
| `is_fraud` | **Target** — 1=fraud, 0=legitimate |

---

## Methodology

### 1. Exploratory Data Analysis (`01_eda.ipynb`)
- Fraud rate segmentation by merchant category, time of day, amount decile
- Distribution comparisons (fraud vs. legitimate) for all features
- Correlation heatmap and key insight extraction

### 2. Feature Engineering (`02_feature_engineering.ipynb`)
- **Time features**: Cyclic sin/cos encoding, `is_night`, `is_weekend`, `is_business_hours`
- **Amount features**: `log_amount` (reduce skew), `amount_bucket`, `is_round_amount`, `amount_velocity_ratio`
- **Risk aggregations**: `high_risk_merchant`, `tenure_risk`, `age_velocity_risk`, `risk_signal_count`
- **Categorical encoding**: One-hot encoding with drop-first for model compatibility

### 3. Model Building (`03_model_building.ipynb`)
Three models trained on 70% of data, evaluated on a held-out 20% test set:

| Model | Role |
|-------|------|
| Logistic Regression | Interpretable baseline; useful for regulatory reporting |
| Random Forest | Non-linear ensemble; robust to outliers |
| XGBoost | State-of-the-art gradient boosting; selected as production model |

SHAP (SHapley Additive exPlanations) used for global and per-prediction explainability.

### 4. Strategy Design (`04_strategy_design.ipynb`)
- Three-tier decision framework: APPROVE / REVIEW / DECLINE
- Tradeoff table for 8 candidate cutoff configurations
- Business impact quantification: fraud losses prevented, false positive revenue loss, ops cost
- Recommended strategy maximising net revenue benefit under hard constraints
- Champion-Challenger framework skeleton for production A/B testing
- Rule-based pre-filters for high-confidence fraud patterns

---

## Key Findings

| # | Insight |
|---|---------|
| 1 | Travel & electronics merchant categories carry **3–5× the average fraud rate** |
| 2 | Transaction velocity >10 in 24h is the **single strongest fraud predictor** |
| 3 | Location mismatch + prior fraud history together produce **>12× average fraud rate** |
| 4 | Late-night transactions (midnight–5 AM) are **2× more likely to be fraudulent** |
| 5 | Account tenure <90 days represents a **2.5× elevated risk window** |
| 6 | XGBoost achieves **AUC-ROC 0.96**, KS statistic 0.81 on the test set |
| 7 | The recommended strategy **stops ~88% of fraud** while keeping false positives below 3.2% |

---

## Strategy Recommendation

### Score Tiers

| Tier | Score Range | Action |
|------|------------|--------|
| **APPROVE** | 0.00 – 0.30 | Auto-approve — minimal friction |
| **REVIEW** | 0.30 – 0.70 | Route to fraud analyst queue |
| **DECLINE** | 0.70 – 1.00 | Auto-block — high-confidence fraud |

### Tradeoff Summary (20,000-transaction test set)

| Metric | Value |
|--------|-------|
| Auto-decline fraud catch rate | ~62% |
| Total fraud stopped (decline + review) | ~88% |
| False positive rate | ~3.2% |
| Review queue volume | ~1,800 cases |
| Net revenue benefit | **~$120,000** |

### Rule-Based Pre-Filters

Applied before ML scoring for known high-confidence patterns:

| Rule | Condition |
|------|-----------|
| R1 | `velocity_last_24h > 15` (card testing) |
| R2 | `location_mismatch = 1` AND `previous_fraud_flag = 1` |
| R3 | `transaction_amount > $5,000` AND `account_tenure_days < 30` |

---

## How to Run

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd fraud-strategy-analytics
pip install -r requirements.txt
```

### 2. Generate the synthetic dataset

```bash
python data/generate_data.py
# → writes data/transactions.csv (100,000 rows)
```

### 3. Run notebooks in order

```bash
jupyter notebook
# Open and run: 01_eda → 02_feature_engineering → 03_model_building → 04_strategy_design
```

### 4. Run tests

```bash
pytest tests/test_strategy.py -v
# Optional: with coverage
pytest tests/test_strategy.py -v --cov=src --cov-report=term-missing
```

### 5. Use the strategy module programmatically

```python
from src.strategy import FraudStrategyEngine, ScoreCutoffs, make_decision

engine = FraudStrategyEngine(fraud_scores, y_true, amounts)
table  = engine.build_tradeoff_table()
rec    = engine.recommend(objective="net_benefit", min_fraud_catch_rate=0.5)
print(rec.rationale)
```

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| Python | 3.11 | Core language |
| pandas | 2.2.1 | Data manipulation |
| numpy | 1.26.4 | Numerical computing |
| scikit-learn | 1.4.2 | ML models & preprocessing |
| xgboost | 2.0.3 | Gradient boosting |
| shap | 0.45.0 | Model explainability |
| matplotlib | 3.8.4 | Visualisation |
| seaborn | 0.13.2 | Statistical plots |
| pytest | 8.1.1 | Unit testing |
| jupyter | 1.0.0 | Interactive notebooks |

---

## Project Highlights for Fraud Strategy Role

- **Strategy thinking**: Not just model metrics — explicit tradeoff quantification with revenue impact, ops cost, and false positive analysis
- **Champion-Challenger**: Production-ready A/B test framework skeleton
- **Hybrid approach**: ML scoring augmented by interpretable hard rules
- **Regulatory-ready**: SHAP explainability for adverse action justification
- **Stakeholder communication**: Executive summary report with business-language findings
- **Engineering quality**: PEP8-compliant code, docstrings, 40+ unit tests, modular architecture

---

## Reports

See [`reports/fraud_strategy_summary.md`](reports/fraud_strategy_summary.md) for the full executive summary including business problem, approach, model results, recommended strategy, and next steps.
