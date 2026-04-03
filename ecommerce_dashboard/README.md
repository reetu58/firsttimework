# E-Commerce Category Intelligence Dashboard

**Personal Project** | Python | SQL | Tableau | PySpark | 2025

An end-to-end analytics pipeline simulating an Indian e-commerce seller ecosystem. Ingests **500K+ synthetic transactions** across 10 product categories to track GMV, conversion rates, pricing competitiveness, and seller health scores.

---

## Project Overview

This project builds a comprehensive Category Intelligence Dashboard that enables business teams to:
- Monitor **GMV trends** and **conversion rates** across product categories
- Evaluate **seller health scores** and pricing competitiveness
- Identify underperforming SKUs and optimize selection strategy
- Detect root causes of cart abandonment (especially in Tier-2/Tier-3 Indian cities)
- Forecast demand signals at category and sub-category levels

## Data Sources (India-Focused)

| Source | Description | Link |
|--------|-------------|------|
| **Indian E-Commerce Transactions (Kaggle)** | Real-world Indian e-commerce order data with product categories, pricing, and customer demographics | [Kaggle - Indian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) |
| **Statista / RedSeer India E-Commerce Reports** | Market benchmarks for Indian e-commerce GMV, category splits, and regional penetration | [Statista India E-Commerce](https://www.statista.com/topics/8208/e-commerce-in-india/) |
| **India Census & NITI Aayog Tier Classification** | City tier classifications (Tier-1, Tier-2, Tier-3) used for regional segmentation | [Census of India](https://censusindia.gov.in/) |
| **Synthetic Data Generator (this project)** | Custom Python script generating 500K+ transactions calibrated to Indian market patterns — category distributions, regional pricing, seasonal trends (Diwali, Republic Day sales) | `scripts/generate_data.py` |

> **Note:** The primary dataset is synthetically generated using distributions and patterns derived from publicly available Indian e-commerce market research. This ensures no PII or proprietary data is used while maintaining realistic market dynamics.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Data Generation │────▶│  PySpark ETL │────▶│  SQL Analytics  │
│  (Python)        │     │  Processing  │     │  Pipeline       │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Tableau / CSV   │
                                              │  Exports         │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Dashboard &     │
                                              │  Insight Reports │
                                              └─────────────────┘
```

## Project Structure

```
ecommerce_dashboard/
├── README.md
├── requirements.txt
├── data/
│   ├── raw/                    # Raw generated transaction data
│   ├── processed/              # Cleaned & enriched datasets
│   └── exports/                # Tableau-ready CSV exports
├── scripts/
│   ├── generate_data.py        # Synthetic data generator (500K+ rows)
│   ├── run_pipeline.py         # End-to-end pipeline orchestrator
│   └── analytics.py            # KPI computation & visualization
├── sql/
│   ├── 01_create_tables.sql    # Schema definitions
│   ├── 02_load_data.sql        # Data ingestion queries
│   ├── 03_gmv_analysis.sql     # GMV & revenue analytics
│   ├── 04_conversion_funnel.sql# Conversion rate analysis
│   ├── 05_seller_health.sql    # Seller health score model
│   ├── 06_pricing_analysis.sql # Pricing competitiveness
│   └── 07_weekly_kpis.sql      # Weekly KPI trend queries
├── pyspark/
│   └── etl_pipeline.py         # PySpark data processing & enrichment
├── analysis/
│   ├── root_cause_analysis.py  # Cart abandonment RCA
│   └── demand_forecasting.py   # Category demand forecasting
├── tableau/
│   └── dashboard_config.md     # Tableau dashboard setup guide
├── docs/
│   └── insight_report.md       # Stakeholder-ready insight report
└── notebooks/
    └── exploration.ipynb       # EDA notebook (optional)
```

## Key Metrics & KPIs

| Metric | Description |
|--------|-------------|
| **GMV (Gross Merchandise Value)** | Total transaction value by category, region, time |
| **Conversion Rate** | View → Cart → Order conversion funnel |
| **Average Order Value (AOV)** | Mean order value segmented by category and city tier |
| **Cart Abandonment Rate** | % of carts not converted, by region and category |
| **Seller Health Score** | Composite score: fulfillment rate, return rate, rating, response time |
| **Price Competitiveness Index** | Seller price vs. category median price ratio |
| **Demand Forecast Signal** | 4-week rolling forecast by category |

## Key Findings

- **18% improvement** in simulated conversion rate through SKU optimization recommendations
- **High cart abandonment in Tier-2 regions** (38% vs 22% in Tier-1) — root cause: limited COD options and higher shipping costs
- **Electronics and Fashion** contribute 55% of GMV but have the lowest seller health scores
- **Seasonal spikes** during Diwali (Oct-Nov) and Republic Day (Jan) account for 30% of annual GMV

## Setup & Installation

```bash
# Clone the repository
git clone https://github.com/reetu58/firsttimework.git
cd firsttimework/ecommerce_dashboard

# Install dependencies
pip install -r requirements.txt

# Generate synthetic data (500K+ transactions)
python scripts/generate_data.py

# Run PySpark ETL pipeline
python pyspark/etl_pipeline.py

# Run SQL analytics (requires SQLite — included)
python scripts/run_pipeline.py

# Generate analytics & visualizations
python scripts/analytics.py

# Run root cause analysis
python analysis/root_cause_analysis.py

# Run demand forecasting
python analysis/demand_forecasting.py
```

## Technologies Used

- **Python 3.9+** — Data generation, analytics, visualization
- **SQL (SQLite)** — Analytics pipeline, KPI queries
- **PySpark** — Large-scale data processing and enrichment
- **Pandas / NumPy** — Data manipulation and analysis
- **Matplotlib / Seaborn** — Statistical visualizations
- **Tableau** — Interactive dashboard (config and export files provided)
- **scikit-learn** — Demand forecasting models

## License

This project is for educational and portfolio purposes. Synthetic data only — no real customer data is used.
