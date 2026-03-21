# The SAS-to-Python Migration Playbook for Bank Model Teams

*What model governance teams actually need to know before, during, and after the switch*

**Published:** March 2026 | **Reading time:** 10 min | **Topic:** Automation in Banking

---

## Why This Is Happening Now

Every major US bank is either migrating from SAS to Python or actively planning to. The reasons are well-known:

- **Cost**: SAS enterprise licenses run $50K-$500K+ annually per team. Python is free.
- **Talent**: New hires from MBA analytics and data science programs know Python. Few know SAS.
- **Ecosystem**: Python's ML/AI libraries (scikit-learn, XGBoost, TensorFlow) are years ahead of SAS Viya.
- **Cloud-native**: Python runs natively on AWS/Azure/GCP. SAS requires additional infrastructure.

But here's what nobody tells you: **the migration isn't a technical problem — it's a governance problem.**

## The Real Challenge: Model Risk Management

Under SR 11-7, every model used for decision-making must be validated. When you migrate a SAS model to Python, regulators don't see a "translation" — they see a **new model** that requires:

1. Full model documentation (MDD)
2. Independent validation
3. Ongoing performance monitoring setup
4. Approval from model risk committee

Multiply that by 50-200 models in a typical bank's fraud/risk portfolio, and you understand why migrations stall.

## The Playbook

### Phase 1: Inventory and Prioritize (Month 1-2)

Not all models should be migrated at once. Prioritize based on:

```
Priority Matrix:

HIGH priority (migrate first):
├── Models approaching scheduled revalidation anyway
├── Models with known SAS-specific technical debt
├── Models where Python offers clear performance gains (ML-heavy)
└── Models maintained by teams already proficient in Python

LOW priority (migrate later):
├── Recently validated models with stable performance
├── Regulatory-mandated models with strict change controls
├── Models with complex SAS-specific integrations (EG, DI)
└── Models nearing retirement/replacement
```

### Phase 2: Build the Foundation (Month 2-4)

Before migrating a single model, establish:

**1. Standardized Python Environment**
```python
# Example: Standard model development environment
# requirements.txt for fraud model teams
pandas==2.2.0
numpy==1.26.0
scikit-learn==1.4.0
xgboost==2.0.3
shap==0.45.0      # Model explainability
great-expectations==0.18.0  # Data validation
mlflow==2.10.0    # Model tracking
```

**2. Equivalent Validation Framework**

SAS PROC FREQ, PROC MEANS, PROC LOGISTIC all have Python equivalents, but your validation team needs to trust them:

| SAS Procedure | Python Equivalent | Key Difference |
|--------------|-------------------|----------------|
| PROC LOGISTIC | sklearn.linear_model.LogisticRegression | Default regularization differs |
| PROC FREQ | pd.crosstab() | Same output, different format |
| PROC MEANS | df.describe() + custom stats | Need to add weighted stats manually |
| PROC SCORE | model.predict() | Scoring pipeline needs explicit setup |
| PROC KS | scipy.stats.ks_2samp | Identical statistical test |

**3. Numerical Equivalence Testing**

This is where most migrations fail. SAS and Python handle floating-point arithmetic differently. You need:

- Tolerance thresholds for model outputs (typically ±0.001 for probabilities)
- Automated comparison scripts that run SAS and Python models on identical data
- Documentation of any material differences and justification

### Phase 3: Migrate and Validate (Month 4-8)

For each model:

1. **Replicate in Python** — Match the SAS logic exactly first. Don't optimize yet.
2. **Run parallel** — Score the same population in both SAS and Python for 30-60 days
3. **Compare outputs** — Document any differences with statistical tests (KS, PSI)
4. **Validate** — Have your model validation team review the Python version independently
5. **Document** — Update the Model Development Document (MDD) with Python-specific details
6. **Approve** — Get model risk committee sign-off before decommissioning SAS version

### Phase 4: Operationalize (Month 8-12)

Once models are migrated:

- **Monitoring pipeline**: Rebuild PSI, CSI, KS, Gini monitoring in Python
- **Alerting**: Set up automated alerts for model drift using Python-native tools
- **Scheduling**: Replace SAS batch jobs with Airflow/Prefect DAGs
- **Access control**: Ensure Python model artifacts have same access controls as SAS

## Common Pitfalls

### 1. The "While We're At It" Trap
Teams often try to improve models during migration: "Let's add these new features since we're rewriting anyway." **Don't.** Migrate first, optimize later. Changing model logic during migration makes it impossible to validate equivalence.

### 2. The Data Type Mismatch
SAS handles missing values differently than Python. SAS numeric missing = `.` Python = `NaN`. These differences cascade through model scoring and can produce materially different outputs if not handled explicitly.

```python
# SAS: missing + 5 = missing
# Python: NaN + 5 = NaN (same behavior with pandas)
# BUT: SAS treats missing as negative infinity in comparisons
# Python: NaN comparisons return False

# Always handle explicitly:
df['score'] = df['feature'].fillna(-999)  # Match SAS behavior
```

### 3. The Governance Documentation Gap
SAS models often have 10+ years of institutional documentation. Python rewrites start with blank documentation. Budget 30-40% of migration effort for documentation alone.

### 4. The "Python Is Better" Assumption
For some models — especially well-established logistic regressions with stable performance — SAS works fine. Don't migrate models just because Python is trendy. Migrate when there's a clear business or technical case.

## What This Means for Your Career

If you're in model governance at a bank right now, the SAS-to-Python migration is the single biggest opportunity to become indispensable:

- **Learn both**: Be the person who can read SAS code AND write the Python equivalent
- **Own the validation framework**: Build the numerical equivalence testing pipeline
- **Document everything**: The person who writes the migration playbook becomes the subject matter expert
- **Understand the regulatory angle**: Know SR 11-7 implications cold — most Python developers don't

The banks paying $500K/year for SAS licenses are going to redirect that budget somewhere. The people who enabled the migration will benefit.

---

*This is part of my weekly deep dive series on banking, fraud analytics, and risk management. I'm an Assistant Manager at Bank of America working on model performance and governance.*

**Tags:** `SAS` `Python` `Model Governance` `SR 11-7` `Banking Automation` `Migration`
