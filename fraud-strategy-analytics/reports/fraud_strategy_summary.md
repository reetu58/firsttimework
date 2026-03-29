# Fraud Detection Strategy — Executive Summary

**Prepared by:** Fraud Strategy Analytics Team
**Date:** March 2026
**Audience:** Senior Fraud Risk Management Stakeholders

---

## 1. Business Problem

Card-not-present and account-takeover fraud continue to erode bank profitability and damage customer trust. The existing rule-based system flags ~8% of transactions for review, resulting in high operational costs and excessive customer friction — without materially improving fraud catch rates above 45%.

**Objective:** Deploy a data-driven, ML-augmented fraud strategy that maximises fraud prevention while minimising false positives (legitimate transactions incorrectly declined), maintaining a sustainable review queue, and reducing operational costs.

---

## 2. Approach

### Data
A synthetic dataset of **100,000 card transactions** was generated to mirror production characteristics:
- ~2% fraud prevalence (matching industry baseline)
- 12 transaction and customer features including velocity, location signals, device type, merchant category, account tenure, and prior fraud history
- Intentionally imbalanced to reflect real-world detection challenges

### Methodology

| Phase | Description |
|-------|-------------|
| Exploratory Analysis | Fraud pattern discovery by segment, time, amount, and device |
| Feature Engineering | 20+ engineered features: cyclic time encoding, log transforms, composite risk signals |
| Model Training | Logistic Regression (baseline), Random Forest, XGBoost |
| Evaluation | AUC-ROC, KS Statistic, Precision, Recall, F1 at optimised threshold |
| Explainability | SHAP values for global and local feature attribution |
| Strategy Design | Three-tier score framework with business tradeoff optimisation |

---

## 3. Key Fraud Patterns Discovered

Through exploratory data analysis, the following high-signal fraud patterns were identified:

| # | Pattern | Fraud Rate vs. Average |
|---|---------|----------------------|
| 1 | **Travel & Electronics** merchant categories | 3–5× higher |
| 2 | **Transaction velocity > 10** in 24 hours | 4× higher |
| 3 | **Location mismatch** present | 6× higher |
| 4 | **Location mismatch + prior fraud history** | >12× higher |
| 5 | **Late-night hours** (midnight–5 AM) | 2× higher |
| 6 | **Account tenure < 90 days** | 2.5× higher |
| 7 | **Transaction amount top decile** | 3–4× higher |

---

## 4. Model Results

All models trained on 70% of data; evaluated on held-out 20% test set.

| Model | AUC-ROC | KS Statistic | Precision | Recall | F1 |
|-------|---------|-------------|-----------|--------|----|
| Logistic Regression | 0.87 | 0.62 | 0.41 | 0.78 | 0.54 |
| Random Forest | 0.93 | 0.74 | 0.56 | 0.82 | 0.67 |
| **XGBoost** | **0.96** | **0.81** | **0.64** | **0.86** | **0.73** |

**Selected model: XGBoost** — highest AUC-ROC and KS statistic, best recall (critical for fraud detection), and cleanest score separation enabling precise strategy cutoff placement.

**Top predictive features (SHAP):**
1. `velocity_last_24h` — burst activity is the strongest fraud indicator
2. `location_mismatch` — geographic anomaly
3. `previous_fraud_flag` — behavioural history
4. `risk_signal_count` — composite risk indicator
5. `log_amount` — high-value transactions
6. `account_tenure_days` — new accounts are riskier

---

## 5. Recommended Strategy

### Score Tier Configuration

| Tier | Score Range | Action | Rationale |
|------|------------|--------|-----------|
| **APPROVE** | 0.00 – 0.30 | Auto-approve | Low fraud probability; friction harms customer experience |
| **REVIEW** | 0.30 – 0.70 | Route to analyst queue | Material fraud probability; human review adds value |
| **DECLINE** | 0.70 – 1.00 | Auto-decline | High-confidence fraud; blocking is optimal |

### Business Impact (on 20,000-transaction test set)

| Metric | Value |
|--------|-------|
| Fraud catch rate (auto-decline) | ~62% |
| Total fraud stopped (decline + review) | ~88% |
| False positive rate | ~3.2% |
| Review queue volume | ~1,800 cases |
| Estimated net revenue benefit | $142,000+ |
| Operations cost (review queue) | ~$21,600 |
| **Net benefit** | **~$120,000** |

### Rule-Based Pre-Filters (applied before ML scoring)

| Rule | Condition | Purpose |
|------|-----------|---------|
| R1 | velocity_last_24h > 15 | Card-testing burst |
| R2 | location_mismatch = 1 AND prior_fraud = 1 | High-confidence takeover |
| R3 | amount > $5,000 AND tenure < 30 days | New account large purchase |

---

## 6. Next Steps

### Immediate (0–30 days)
- [ ] Validate model on live production data (shadow mode scoring — no actions taken)
- [ ] Calibrate score thresholds against actual fraud loss data and analyst capacity
- [ ] Establish monitoring dashboard: KS statistic, fraud rate by tier, false positive rate

### Short-term (1–3 months)
- [ ] **Launch Champion-Challenger test** — route 10% of traffic to new ML strategy; compare against rules-only baseline on net benefit metric
- [ ] Promote challenger to champion when statistically significant improvement confirmed (p < 0.05, minimum 4-week evaluation, minimum 10,000 transactions per arm)
- [ ] Add real-time velocity features by integrating with transaction event stream

### Ongoing
- [ ] **Model refresh cadence: quarterly** — retrain on rolling 6-month transaction window to capture fraud pattern evolution
- [ ] Trigger emergency refresh if KS statistic degrades >10% from baseline or fraud rate in APPROVE tier exceeds 0.5%
- [ ] Annual strategy review with fraud operations, risk management, and compliance

---

## 7. Constraints & Limitations

- Results derived from **synthetic data** — real-world performance will vary based on actual population characteristics and fraud typologies
- **Class imbalance** in production may differ from the 2% rate assumed; threshold recalibration will be required
- **Regulatory requirements** (e.g., adverse action notices for declined transactions) must be reviewed with compliance before deployment
- SHAP explainability covers model-driven decisions; rule-triggered declines require separate documentation

---

*For questions, contact the Fraud Strategy Analytics team.*
