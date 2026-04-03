-- ============================================================
-- GMV & Revenue Analytics
-- ============================================================

-- 1. Overall GMV Summary
SELECT
    SUM(total_amount) AS total_gmv,
    COUNT(CASE WHEN order_status IN ('Delivered', 'Returned') THEN 1 END) AS total_orders,
    ROUND(AVG(CASE WHEN total_amount > 0 THEN total_amount END), 2) AS avg_order_value,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(DISTINCT seller_id) AS active_sellers
FROM transactions
WHERE order_status IN ('Delivered', 'Returned', 'Cancelled');

-- 2. GMV by Category
SELECT
    category,
    SUM(total_amount) AS category_gmv,
    ROUND(SUM(total_amount) * 100.0 / (SELECT SUM(total_amount) FROM transactions WHERE order_status = 'Delivered'), 2) AS gmv_share_pct,
    COUNT(*) AS order_count,
    ROUND(AVG(total_amount), 2) AS avg_order_value,
    COUNT(DISTINCT seller_id) AS seller_count
FROM transactions
WHERE order_status = 'Delivered'
GROUP BY category
ORDER BY category_gmv DESC;

-- 3. Monthly GMV Trend
SELECT
    strftime('%Y-%m', transaction_date) AS month,
    SUM(total_amount) AS monthly_gmv,
    COUNT(CASE WHEN order_status = 'Delivered' THEN 1 END) AS delivered_orders,
    ROUND(AVG(CASE WHEN total_amount > 0 THEN total_amount END), 2) AS avg_order_value
FROM transactions
WHERE order_status IN ('Delivered', 'Returned')
GROUP BY strftime('%Y-%m', transaction_date)
ORDER BY month;

-- 4. GMV by City Tier
SELECT
    customer_tier,
    SUM(total_amount) AS tier_gmv,
    ROUND(SUM(total_amount) * 100.0 / (SELECT SUM(total_amount) FROM transactions WHERE order_status = 'Delivered'), 2) AS gmv_share_pct,
    COUNT(*) AS order_count,
    ROUND(AVG(total_amount), 2) AS avg_order_value
FROM transactions
WHERE order_status = 'Delivered'
GROUP BY customer_tier
ORDER BY tier_gmv DESC;

-- 5. Top 10 Cities by GMV
SELECT
    c.customer_city,
    c.customer_state,
    t.customer_tier,
    SUM(t.total_amount) AS city_gmv,
    COUNT(*) AS order_count
FROM transactions t
JOIN customers c ON t.customer_id = c.customer_id
WHERE t.order_status = 'Delivered'
GROUP BY c.customer_city, c.customer_state, t.customer_tier
ORDER BY city_gmv DESC
LIMIT 10;

-- 6. GMV by Category and Tier (Cross-tab)
SELECT
    category,
    SUM(CASE WHEN customer_tier = 'Tier-1' THEN total_amount ELSE 0 END) AS tier1_gmv,
    SUM(CASE WHEN customer_tier = 'Tier-2' THEN total_amount ELSE 0 END) AS tier2_gmv,
    SUM(CASE WHEN customer_tier = 'Tier-3' THEN total_amount ELSE 0 END) AS tier3_gmv,
    SUM(total_amount) AS total_gmv
FROM transactions
WHERE order_status = 'Delivered'
GROUP BY category
ORDER BY total_gmv DESC;
