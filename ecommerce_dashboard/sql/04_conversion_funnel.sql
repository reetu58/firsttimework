-- ============================================================
-- Conversion Funnel Analysis
-- ============================================================

-- 1. Overall Funnel
SELECT
    COUNT(*) AS total_views,
    COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END) AS added_to_cart,
    COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) AS orders_placed,
    COUNT(CASE WHEN order_status = 'Delivered' THEN 1 END) AS delivered,
    ROUND(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END) * 100.0 / COUNT(*), 2) AS view_to_cart_pct,
    ROUND(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END), 0), 2) AS cart_to_order_pct,
    ROUND(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) * 100.0 / COUNT(*), 2) AS overall_conversion_pct
FROM transactions;

-- 2. Conversion Funnel by City Tier
SELECT
    customer_tier,
    COUNT(*) AS total_views,
    COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END) AS added_to_cart,
    COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) AS orders_placed,
    COUNT(CASE WHEN order_status = 'Cart Abandoned' THEN 1 END) AS cart_abandoned,
    ROUND(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END) * 100.0 / COUNT(*), 2) AS view_to_cart_pct,
    ROUND(COUNT(CASE WHEN order_status = 'Cart Abandoned' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END), 0), 2) AS cart_abandonment_rate,
    ROUND(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) * 100.0 / COUNT(*), 2) AS overall_conversion_pct
FROM transactions
GROUP BY customer_tier
ORDER BY customer_tier;

-- 3. Conversion by Category
SELECT
    category,
    COUNT(*) AS total_views,
    ROUND(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END) * 100.0 / COUNT(*), 2) AS view_to_cart_pct,
    ROUND(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) * 100.0 / COUNT(*), 2) AS overall_conversion_pct,
    ROUND(COUNT(CASE WHEN order_status = 'Cart Abandoned' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END), 0), 2) AS cart_abandonment_rate
FROM transactions
GROUP BY category
ORDER BY overall_conversion_pct DESC;

-- 4. Conversion by Payment Method (for completed orders)
SELECT
    payment_method,
    COUNT(*) AS order_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions WHERE payment_method IS NOT NULL), 2) AS share_pct,
    ROUND(AVG(total_amount), 2) AS avg_order_value
FROM transactions
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY order_count DESC;

-- 5. Cart Abandonment by Category and Tier
SELECT
    category,
    customer_tier,
    COUNT(CASE WHEN order_status = 'Cart Abandoned' THEN 1 END) AS abandoned_count,
    COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END) AS total_cart_adds,
    ROUND(COUNT(CASE WHEN order_status = 'Cart Abandoned' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END), 0), 2) AS abandonment_rate
FROM transactions
GROUP BY category, customer_tier
ORDER BY abandonment_rate DESC;

-- 6. Monthly Conversion Trend
SELECT
    strftime('%Y-%m', transaction_date) AS month,
    ROUND(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) * 100.0 / COUNT(*), 2) AS conversion_rate,
    ROUND(COUNT(CASE WHEN order_status = 'Cart Abandoned' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN order_status != 'Viewed Only' THEN 1 END), 0), 2) AS cart_abandonment_rate
FROM transactions
GROUP BY strftime('%Y-%m', transaction_date)
ORDER BY month;
