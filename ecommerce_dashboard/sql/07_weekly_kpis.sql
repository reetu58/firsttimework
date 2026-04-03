-- ============================================================
-- Weekly KPI Trends
-- ============================================================

-- 1. Weekly KPI Summary
SELECT
    strftime('%Y-W%W', transaction_date) AS week,
    MIN(transaction_date) AS week_start,
    -- Volume KPIs
    COUNT(*) AS total_events,
    COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) AS total_orders,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(DISTINCT seller_id) AS active_sellers,
    -- Revenue KPIs
    SUM(CASE WHEN order_status = 'Delivered' THEN total_amount ELSE 0 END) AS weekly_gmv,
    ROUND(AVG(CASE WHEN total_amount > 0 THEN total_amount END), 2) AS avg_order_value,
    -- Conversion KPIs
    ROUND(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) * 100.0 / COUNT(*), 2) AS conversion_rate,
    ROUND(COUNT(CASE WHEN order_status = 'Cart Abandoned' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END), 0), 2) AS cart_abandonment_rate,
    -- Quality KPIs
    ROUND(COUNT(CASE WHEN order_status = 'Returned' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned') THEN 1 END), 0), 2) AS return_rate
FROM transactions
GROUP BY strftime('%Y-W%W', transaction_date)
ORDER BY week;

-- 2. Weekly KPIs by Category
SELECT
    strftime('%Y-W%W', transaction_date) AS week,
    category,
    SUM(CASE WHEN order_status = 'Delivered' THEN total_amount ELSE 0 END) AS weekly_gmv,
    COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) AS orders,
    ROUND(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) * 100.0 / COUNT(*), 2) AS conversion_rate
FROM transactions
GROUP BY strftime('%Y-W%W', transaction_date), category
ORDER BY week, category;

-- 3. Week-over-Week Growth
WITH weekly AS (
    SELECT
        strftime('%Y-W%W', transaction_date) AS week,
        SUM(CASE WHEN order_status = 'Delivered' THEN total_amount ELSE 0 END) AS weekly_gmv,
        COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) AS orders
    FROM transactions
    GROUP BY strftime('%Y-W%W', transaction_date)
)
SELECT
    w.week,
    w.weekly_gmv,
    w.orders,
    ROUND((w.weekly_gmv - LAG(w.weekly_gmv) OVER (ORDER BY w.week)) * 100.0 /
          NULLIF(LAG(w.weekly_gmv) OVER (ORDER BY w.week), 0), 2) AS gmv_wow_growth_pct,
    ROUND((w.orders - LAG(w.orders) OVER (ORDER BY w.week)) * 100.0 /
          NULLIF(LAG(w.orders) OVER (ORDER BY w.week), 0), 2) AS orders_wow_growth_pct
FROM weekly w
ORDER BY w.week;

-- 4. Weekly KPIs by City Tier
SELECT
    strftime('%Y-W%W', transaction_date) AS week,
    customer_tier,
    SUM(CASE WHEN order_status = 'Delivered' THEN total_amount ELSE 0 END) AS weekly_gmv,
    COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) AS orders,
    ROUND(COUNT(CASE WHEN order_status = 'Cart Abandoned' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END), 0), 2) AS cart_abandonment_rate
FROM transactions
GROUP BY strftime('%Y-W%W', transaction_date), customer_tier
ORDER BY week, customer_tier;
