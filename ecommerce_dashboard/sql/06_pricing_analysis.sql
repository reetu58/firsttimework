-- ============================================================
-- Pricing Competitiveness Analysis
-- ============================================================

-- 1. Category-Level Pricing Summary
SELECT
    category,
    ROUND(AVG(mrp), 2) AS avg_mrp,
    ROUND(AVG(selling_price), 2) AS avg_selling_price,
    ROUND(AVG(discount_pct), 1) AS avg_discount_pct,
    ROUND(MIN(selling_price), 2) AS min_price,
    ROUND(MAX(selling_price), 2) AS max_price,
    COUNT(DISTINCT sku_id) AS sku_count
FROM transactions
WHERE order_status = 'Delivered'
GROUP BY category
ORDER BY avg_selling_price DESC;

-- 2. Price Competitiveness Index (seller price vs category median)
WITH category_median AS (
    SELECT
        category,
        AVG(selling_price) AS median_price  -- approximation using AVG
    FROM transactions
    WHERE order_status = 'Delivered'
    GROUP BY category
)
SELECT
    t.seller_id,
    t.category,
    ROUND(AVG(t.selling_price), 2) AS seller_avg_price,
    cm.median_price AS category_median_price,
    ROUND(AVG(t.selling_price) / cm.median_price, 3) AS price_competitiveness_index,
    CASE
        WHEN AVG(t.selling_price) / cm.median_price < 0.90 THEN 'Very Competitive'
        WHEN AVG(t.selling_price) / cm.median_price < 1.00 THEN 'Competitive'
        WHEN AVG(t.selling_price) / cm.median_price < 1.10 THEN 'At Parity'
        ELSE 'Premium/Overpriced'
    END AS pricing_tier
FROM transactions t
JOIN category_median cm ON t.category = cm.category
WHERE t.order_status = 'Delivered'
GROUP BY t.seller_id, t.category, cm.median_price
ORDER BY price_competitiveness_index ASC
LIMIT 50;

-- 3. Discount Impact on Conversion
SELECT
    CASE
        WHEN discount_pct = 0 THEN 'No Discount'
        WHEN discount_pct <= 10 THEN '1-10%'
        WHEN discount_pct <= 20 THEN '11-20%'
        WHEN discount_pct <= 30 THEN '21-30%'
        ELSE '30%+'
    END AS discount_band,
    COUNT(*) AS total_views,
    COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) AS orders,
    ROUND(COUNT(CASE WHEN order_status IN ('Delivered', 'Returned', 'Cancelled') THEN 1 END) * 100.0 / COUNT(*), 2) AS conversion_rate,
    ROUND(AVG(CASE WHEN total_amount > 0 THEN total_amount END), 2) AS avg_order_value
FROM transactions
GROUP BY discount_band
ORDER BY conversion_rate DESC;

-- 4. Price Sensitivity by City Tier
SELECT
    customer_tier,
    category,
    ROUND(AVG(selling_price), 2) AS avg_price_paid,
    ROUND(AVG(discount_pct), 1) AS avg_discount_used,
    ROUND(AVG(CASE WHEN total_amount > 0 THEN total_amount END), 2) AS avg_order_value
FROM transactions
WHERE order_status = 'Delivered'
GROUP BY customer_tier, category
ORDER BY customer_tier, category;

-- 5. Brand Tier Pricing Analysis
SELECT
    brand_tier,
    category,
    ROUND(AVG(selling_price), 2) AS avg_price,
    ROUND(AVG(discount_pct), 1) AS avg_discount,
    COUNT(CASE WHEN order_status = 'Delivered' THEN 1 END) AS delivered_orders,
    ROUND(COUNT(CASE WHEN order_status = 'Delivered' THEN 1 END) * 100.0 / COUNT(*), 2) AS conversion_rate
FROM transactions
GROUP BY brand_tier, category
ORDER BY brand_tier, conversion_rate DESC;
