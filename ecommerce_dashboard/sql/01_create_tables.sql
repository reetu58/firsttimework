-- ============================================================
-- E-Commerce Category Intelligence Dashboard
-- Schema Definition (SQLite Compatible)
-- ============================================================

-- Sellers Master Table
CREATE TABLE IF NOT EXISTS sellers (
    seller_id TEXT PRIMARY KEY,
    seller_name TEXT NOT NULL,
    seller_city TEXT NOT NULL,
    seller_state TEXT NOT NULL,
    seller_tier TEXT NOT NULL,
    primary_category TEXT NOT NULL,
    registration_date DATE,
    seller_rating REAL,
    fulfillment_rate REAL,
    avg_response_time_hrs REAL
);

-- Customers Master Table
CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    customer_city TEXT NOT NULL,
    customer_state TEXT NOT NULL,
    customer_tier TEXT NOT NULL,
    signup_date DATE
);

-- Products / SKU Catalog
CREATE TABLE IF NOT EXISTS products (
    sku_id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    mrp REAL NOT NULL,
    selling_price REAL NOT NULL,
    discount_pct REAL,
    brand_tier TEXT
);

-- Transactions (Fact Table)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    transaction_date DATE NOT NULL,
    customer_id TEXT,
    seller_id TEXT,
    sku_id TEXT,
    category TEXT NOT NULL,
    sub_category TEXT,
    mrp REAL,
    selling_price REAL,
    discount_pct REAL,
    quantity INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    shipping_cost REAL DEFAULT 0,
    payment_method TEXT,
    order_status TEXT NOT NULL,
    customer_tier TEXT,
    brand_tier TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (seller_id) REFERENCES sellers(seller_id),
    FOREIGN KEY (sku_id) REFERENCES products(sku_id)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_txn_status ON transactions(order_status);
CREATE INDEX IF NOT EXISTS idx_txn_customer_tier ON transactions(customer_tier);
CREATE INDEX IF NOT EXISTS idx_txn_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_txn_sku ON transactions(sku_id);
