-- ============================================================
-- Data Loading Script
-- Run via Python sqlite3 module (see scripts/run_pipeline.py)
-- ============================================================

-- Note: Data is loaded programmatically via pandas to_sql()
-- This file documents the expected load process.

-- Verify row counts after load
SELECT 'sellers' AS table_name, COUNT(*) AS row_count FROM sellers
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- Verify date range
SELECT
    MIN(transaction_date) AS earliest_date,
    MAX(transaction_date) AS latest_date,
    COUNT(DISTINCT transaction_date) AS unique_dates
FROM transactions;

-- Verify category coverage
SELECT category, COUNT(*) AS txn_count
FROM transactions
GROUP BY category
ORDER BY txn_count DESC;
