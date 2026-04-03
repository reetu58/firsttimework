-- ============================================================
-- Seller Health Score Model
-- ============================================================
-- Composite score based on:
--   - Fulfillment Rate (25%)
--   - Return Rate (25%)
--   - Seller Rating (25%)
--   - Response Time (25%)

-- 1. Seller Performance Metrics
CREATE VIEW IF NOT EXISTS v_seller_performance AS
SELECT
    s.seller_id,
    s.seller_name,
    s.seller_city,
    s.seller_state,
    s.seller_tier,
    s.primary_category,
    s.seller_rating,
    s.fulfillment_rate,
    s.avg_response_time_hrs,
    COUNT(CASE WHEN t.order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) AS total_orders,
    SUM(CASE WHEN t.order_status = 'Delivered' THEN t.total_amount ELSE 0 END) AS total_gmv,
    ROUND(COUNT(CASE WHEN t.order_status = 'Returned' THEN 1 END) * 1.0 /
          NULLIF(COUNT(CASE WHEN t.order_status IN ('Delivered', 'Returned') THEN 1 END), 0), 3) AS return_rate,
    ROUND(COUNT(CASE WHEN t.order_status = 'Cancelled' THEN 1 END) * 1.0 /
          NULLIF(COUNT(CASE WHEN t.order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END), 0), 3) AS cancellation_rate
FROM sellers s
LEFT JOIN transactions t ON s.seller_id = t.seller_id
GROUP BY s.seller_id, s.seller_name, s.seller_city, s.seller_state,
         s.seller_tier, s.primary_category, s.seller_rating,
         s.fulfillment_rate, s.avg_response_time_hrs;

-- 2. Seller Health Score Calculation
SELECT
    seller_id,
    seller_name,
    seller_city,
    seller_tier,
    primary_category,
    total_orders,
    total_gmv,
    seller_rating,
    fulfillment_rate,
    return_rate,
    avg_response_time_hrs,
    -- Health Score (0-100)
    ROUND(
        (CASE WHEN fulfillment_rate >= 0.95 THEN 25
              WHEN fulfillment_rate >= 0.90 THEN 20
              WHEN fulfillment_rate >= 0.80 THEN 15
              ELSE 10 END) +
        (CASE WHEN return_rate <= 0.03 THEN 25
              WHEN return_rate <= 0.07 THEN 20
              WHEN return_rate <= 0.12 THEN 15
              ELSE 10 END) +
        (CASE WHEN seller_rating >= 4.5 THEN 25
              WHEN seller_rating >= 4.0 THEN 20
              WHEN seller_rating >= 3.5 THEN 15
              ELSE 10 END) +
        (CASE WHEN avg_response_time_hrs <= 4 THEN 25
              WHEN avg_response_time_hrs <= 8 THEN 20
              WHEN avg_response_time_hrs <= 16 THEN 15
              ELSE 10 END)
    , 1) AS health_score,
    -- Health Tier
    CASE
        WHEN (
            (CASE WHEN fulfillment_rate >= 0.95 THEN 25 WHEN fulfillment_rate >= 0.90 THEN 20 WHEN fulfillment_rate >= 0.80 THEN 15 ELSE 10 END) +
            (CASE WHEN return_rate <= 0.03 THEN 25 WHEN return_rate <= 0.07 THEN 20 WHEN return_rate <= 0.12 THEN 15 ELSE 10 END) +
            (CASE WHEN seller_rating >= 4.5 THEN 25 WHEN seller_rating >= 4.0 THEN 20 WHEN seller_rating >= 3.5 THEN 15 ELSE 10 END) +
            (CASE WHEN avg_response_time_hrs <= 4 THEN 25 WHEN avg_response_time_hrs <= 8 THEN 20 WHEN avg_response_time_hrs <= 16 THEN 15 ELSE 10 END)
        ) >= 85 THEN 'Excellent'
        WHEN (
            (CASE WHEN fulfillment_rate >= 0.95 THEN 25 WHEN fulfillment_rate >= 0.90 THEN 20 WHEN fulfillment_rate >= 0.80 THEN 15 ELSE 10 END) +
            (CASE WHEN return_rate <= 0.03 THEN 25 WHEN return_rate <= 0.07 THEN 20 WHEN return_rate <= 0.12 THEN 15 ELSE 10 END) +
            (CASE WHEN seller_rating >= 4.5 THEN 25 WHEN seller_rating >= 4.0 THEN 20 WHEN seller_rating >= 3.5 THEN 15 ELSE 10 END) +
            (CASE WHEN avg_response_time_hrs <= 4 THEN 25 WHEN avg_response_time_hrs <= 8 THEN 20 WHEN avg_response_time_hrs <= 16 THEN 15 ELSE 10 END)
        ) >= 70 THEN 'Good'
        WHEN (
            (CASE WHEN fulfillment_rate >= 0.95 THEN 25 WHEN fulfillment_rate >= 0.90 THEN 20 WHEN fulfillment_rate >= 0.80 THEN 15 ELSE 10 END) +
            (CASE WHEN return_rate <= 0.03 THEN 25 WHEN return_rate <= 0.07 THEN 20 WHEN return_rate <= 0.12 THEN 15 ELSE 10 END) +
            (CASE WHEN seller_rating >= 4.5 THEN 25 WHEN seller_rating >= 4.0 THEN 20 WHEN seller_rating >= 3.5 THEN 15 ELSE 10 END) +
            (CASE WHEN avg_response_time_hrs <= 4 THEN 25 WHEN avg_response_time_hrs <= 8 THEN 20 WHEN avg_response_time_hrs <= 16 THEN 15 ELSE 10 END)
        ) >= 55 THEN 'Average'
        ELSE 'At Risk'
    END AS health_tier
FROM v_seller_performance
WHERE total_orders > 0
ORDER BY health_score DESC;

-- 3. Seller Health by Category
SELECT
    primary_category,
    COUNT(*) AS seller_count,
    ROUND(AVG(seller_rating), 2) AS avg_rating,
    ROUND(AVG(fulfillment_rate), 3) AS avg_fulfillment,
    ROUND(AVG(return_rate), 3) AS avg_return_rate,
    ROUND(AVG(avg_response_time_hrs), 1) AS avg_response_hrs
FROM v_seller_performance
WHERE total_orders > 0
GROUP BY primary_category
ORDER BY avg_rating DESC;

-- 4. Bottom 20 Sellers (At Risk)
SELECT
    seller_id,
    seller_name,
    seller_city,
    primary_category,
    total_orders,
    seller_rating,
    fulfillment_rate,
    return_rate,
    avg_response_time_hrs
FROM v_seller_performance
WHERE total_orders > 10
ORDER BY seller_rating ASC, fulfillment_rate ASC
LIMIT 20;
