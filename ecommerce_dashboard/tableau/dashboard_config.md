# Tableau Dashboard Configuration Guide

## E-Commerce Category Intelligence Dashboard

### Data Source Setup

Connect the following CSV files from `data/exports/`:

| Data Source | File | Description |
|-------------|------|-------------|
| Category Monthly | `tableau_category_monthly.csv` | Category-level monthly GMV, orders, AOV |
| Tier Category | `tableau_tier_category.csv` | City tier x Category cross-tab |
| Funnel Data | `tableau_funnel_data.csv` | Full conversion funnel by category/tier |
| Seller Health | `tableau_seller_health.csv` | Seller performance and health metrics |
| KPI Summary | `kpi_summary.csv` | Top-line KPIs |
| Weekly KPIs | `weekly_kpis_query_*.csv` | Weekly trend data |

### Dashboard Layout (4 Sheets)

---

### Sheet 1: Executive Summary

**KPI Cards (Top Row):**
- Total GMV (INR Cr) — `SUM(gmv)` formatted as currency
- Total Orders — `SUM(orders)` formatted as number
- Average Order Value — `AVG(aov)` formatted as currency
- Overall Conversion Rate (%) — calculated field
- Cart Abandonment Rate (%) — calculated field

**Monthly GMV Trend (Line Chart):**
- Columns: `year_month` (continuous)
- Rows: `SUM(gmv)`
- Color: Category (optional)
- Add reference line for average GMV
- Annotate Diwali (Oct-Nov) and Republic Day (Jan) spikes

**Category GMV Share (Treemap):**
- Size: `SUM(gmv)`
- Color: `SUM(gmv)` (sequential green)
- Label: Category name + GMV value

---

### Sheet 2: Category Deep-Dive

**Category Selector:**
- Add `category` as a filter (dropdown, single select)

**KPI Row (filtered by category):**
- GMV, Orders, AOV, Conversion Rate, Return Rate

**Weekly Trend (Dual-Axis):**
- Axis 1: `SUM(gmv)` as bars
- Axis 2: Conversion Rate as line
- Columns: `year_month`

**Sub-Category Breakdown (Horizontal Bar):**
- Show top sub-categories by GMV within selected category

**Tier Distribution (Stacked Bar):**
- Show GMV split by Tier-1/2/3 for selected category

---

### Sheet 3: Conversion Funnel & Cart Abandonment

**Funnel Visualization:**
- Stages: Viewed Only → Cart Added → Order Placed → Delivered
- Use `tableau_funnel_data.csv`
- Color by stage

**Abandonment by Tier (Grouped Bar):**
- X: City Tier
- Y: Abandonment Rate (%)
- Color: Category

**Abandonment Heatmap:**
- Rows: Category
- Columns: City Tier
- Color: Abandonment Rate (diverging red palette)

**Payment Method Distribution (Pie/Donut):**
- Filter by Tier to show payment preferences

---

### Sheet 4: Seller Health & Pricing

**Seller Health Distribution (Histogram):**
- Bins for health score (0-100)
- Color by health tier (Excellent/Good/Average/At Risk)

**Seller Health by Category (Box Plot):**
- X: Category
- Y: Health Score
- Show distribution spread

**Price Competitiveness Scatter:**
- X: Price Competitiveness Index
- Y: Order Count
- Size: GMV
- Color: Pricing Tier

**Top/Bottom Sellers Table:**
- Show top 10 and bottom 10 sellers by health score
- Include: Seller ID, City, Category, Rating, Fulfillment Rate, Health Score

---

### Calculated Fields

```
// Conversion Rate
[Orders] / [Total Events] * 100

// Cart Abandonment Rate
[Cart Abandoned] / ([Cart Abandoned] + [Orders]) * 100

// Return Rate
[Returned] / ([Delivered] + [Returned]) * 100

// GMV in Crores
SUM([gmv]) / 10000000

// Health Score (if computing in Tableau)
IF [fulfillment_rate] >= 0.95 THEN 25
ELSEIF [fulfillment_rate] >= 0.90 THEN 20
ELSEIF [fulfillment_rate] >= 0.80 THEN 15
ELSE 10 END
+
IF [return_rate] <= 0.03 THEN 25
ELSEIF [return_rate] <= 0.07 THEN 20
ELSEIF [return_rate] <= 0.12 THEN 15
ELSE 10 END
+
IF [seller_rating] >= 4.5 THEN 25
ELSEIF [seller_rating] >= 4.0 THEN 20
ELSEIF [seller_rating] >= 3.5 THEN 15
ELSE 10 END
+
IF [avg_response_time_hrs] <= 4 THEN 25
ELSEIF [avg_response_time_hrs] <= 8 THEN 20
ELSEIF [avg_response_time_hrs] <= 16 THEN 15
ELSE 10 END
```

### Filters & Interactivity

- **Global Filters:** Date Range, Category, City Tier
- **Dashboard Actions:** Filter on click (category selection filters all sheets)
- **Tooltips:** Show detailed metrics on hover
- **Parameter:** Toggle between GMV and Order Count views

### Color Palette

- **Primary:** #2196F3 (Blue)
- **Success:** #4CAF50 (Green)
- **Warning:** #FF9800 (Orange)
- **Danger:** #F44336 (Red)
- **Tier-1:** #2196F3 | **Tier-2:** #FF9800 | **Tier-3:** #9C27B0

### Publishing

1. Save workbook as `.twbx` (packaged with data)
2. Optionally publish to Tableau Public for portfolio
3. Set auto-refresh schedule if connecting to live database
