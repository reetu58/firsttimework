"""
E-Commerce Synthetic Data Generator
====================================
Generates 500K+ synthetic Indian e-commerce transactions across 10 product categories.

Data Sources & Calibration:
- Category distributions based on Statista India E-Commerce Report 2024
- City tier classifications from Census of India / NITI Aayog
- Seasonal patterns calibrated to Indian festivals (Diwali, Republic Day, etc.)
- Pricing ranges derived from publicly available marketplace data

Author: Reetu
Date: 2025
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import uuid

# Reproducibility
np.random.seed(42)

# ============================================================
# CONFIGURATION
# ============================================================

NUM_TRANSACTIONS = 520_000
NUM_SELLERS = 2_500
NUM_CUSTOMERS = 150_000
NUM_SKUS = 8_000
DATE_START = datetime(2024, 1, 1)
DATE_END = datetime(2024, 12, 31)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")

# ============================================================
# INDIAN MARKET REFERENCE DATA
# ============================================================

# 10 Product Categories with GMV share (based on Indian e-commerce market research)
CATEGORIES = {
    "Electronics": {"gmv_share": 0.28, "avg_price": 8500, "price_std": 6000, "return_rate": 0.08},
    "Fashion & Apparel": {"gmv_share": 0.22, "avg_price": 1200, "price_std": 800, "return_rate": 0.15},
    "Home & Kitchen": {"gmv_share": 0.12, "avg_price": 2500, "price_std": 2000, "return_rate": 0.06},
    "Beauty & Personal Care": {"gmv_share": 0.08, "avg_price": 450, "price_std": 300, "return_rate": 0.04},
    "Grocery & Gourmet": {"gmv_share": 0.07, "avg_price": 350, "price_std": 200, "return_rate": 0.02},
    "Books & Stationery": {"gmv_share": 0.05, "avg_price": 280, "price_std": 150, "return_rate": 0.03},
    "Sports & Fitness": {"gmv_share": 0.06, "avg_price": 1800, "price_std": 1200, "return_rate": 0.07},
    "Baby & Kids": {"gmv_share": 0.05, "avg_price": 800, "price_std": 500, "return_rate": 0.05},
    "Health & Wellness": {"gmv_share": 0.04, "avg_price": 600, "price_std": 400, "return_rate": 0.03},
    "Automotive Accessories": {"gmv_share": 0.03, "avg_price": 1500, "price_std": 1000, "return_rate": 0.06},
}

# Indian cities with tier classification
CITIES_BY_TIER = {
    "Tier-1": [
        ("Mumbai", "Maharashtra"), ("Delhi", "Delhi"), ("Bangalore", "Karnataka"),
        ("Hyderabad", "Telangana"), ("Chennai", "Tamil Nadu"), ("Kolkata", "West Bengal"),
        ("Pune", "Maharashtra"), ("Ahmedabad", "Gujarat"),
    ],
    "Tier-2": [
        ("Jaipur", "Rajasthan"), ("Lucknow", "Uttar Pradesh"), ("Chandigarh", "Punjab"),
        ("Nagpur", "Maharashtra"), ("Indore", "Madhya Pradesh"), ("Bhopal", "Madhya Pradesh"),
        ("Patna", "Bihar"), ("Kochi", "Kerala"), ("Coimbatore", "Tamil Nadu"),
        ("Visakhapatnam", "Andhra Pradesh"), ("Vadodara", "Gujarat"), ("Surat", "Gujarat"),
        ("Thiruvananthapuram", "Kerala"), ("Mysore", "Karnataka"), ("Ranchi", "Jharkhand"),
    ],
    "Tier-3": [
        ("Varanasi", "Uttar Pradesh"), ("Jodhpur", "Rajasthan"), ("Raipur", "Chhattisgarh"),
        ("Guwahati", "Assam"), ("Dehradun", "Uttarakhand"), ("Agra", "Uttar Pradesh"),
        ("Jalandhar", "Punjab"), ("Meerut", "Uttar Pradesh"), ("Hubli", "Karnataka"),
        ("Siliguri", "West Bengal"), ("Ujjain", "Madhya Pradesh"), ("Bikaner", "Rajasthan"),
        ("Gorakhpur", "Uttar Pradesh"), ("Aligarh", "Uttar Pradesh"), ("Bareilly", "Uttar Pradesh"),
    ],
}

# Tier distribution for orders (Tier-1 dominates online shopping in India)
TIER_ORDER_SHARE = {"Tier-1": 0.55, "Tier-2": 0.30, "Tier-3": 0.15}

# Conversion rates by tier (Tier-2/3 have lower conversion)
CONVERSION_RATES = {
    "Tier-1": {"view_to_cart": 0.35, "cart_to_order": 0.78},
    "Tier-2": {"view_to_cart": 0.28, "cart_to_order": 0.62},  # Higher abandonment
    "Tier-3": {"view_to_cart": 0.22, "cart_to_order": 0.55},
}

# Payment methods (India-specific)
PAYMENT_METHODS = {
    "UPI": 0.40, "Credit Card": 0.15, "Debit Card": 0.12,
    "COD": 0.18, "Net Banking": 0.08, "Wallet": 0.05, "EMI": 0.02,
}

# Seasonal multipliers (Indian festivals)
def get_seasonal_multiplier(date):
    month, day = date.month, date.day
    # Diwali season (Oct 15 - Nov 15)
    if (month == 10 and day >= 15) or (month == 11 and day <= 15):
        return 2.5
    # Republic Day sale (Jan 20-30)
    if month == 1 and 20 <= day <= 30:
        return 1.8
    # Independence Day sale (Aug 10-18)
    if month == 8 and 10 <= day <= 18:
        return 1.6
    # Navratri (Oct 1-10)
    if month == 10 and 1 <= day <= 10:
        return 1.4
    # Year-end sale (Dec 20-31)
    if month == 12 and day >= 20:
        return 1.5
    # Raksha Bandhan / Onam (Aug end)
    if month == 8 and day >= 25:
        return 1.3
    # Regular months
    return 1.0


def generate_sellers():
    """Generate seller master data."""
    print("Generating seller data...")
    sellers = []
    for i in range(NUM_SELLERS):
        tier = np.random.choice(list(CITIES_BY_TIER.keys()), p=[0.40, 0.35, 0.25])
        city, state = CITIES_BY_TIER[tier][np.random.randint(len(CITIES_BY_TIER[tier]))]
        category = np.random.choice(list(CATEGORIES.keys()),
                                    p=[c["gmv_share"] for c in CATEGORIES.values()])
        sellers.append({
            "seller_id": f"SLR{i+1:05d}",
            "seller_name": f"Seller_{i+1}",
            "seller_city": city,
            "seller_state": state,
            "seller_tier": tier,
            "primary_category": category,
            "registration_date": DATE_START - timedelta(days=np.random.randint(30, 730)),
            "seller_rating": round(np.clip(np.random.normal(3.8, 0.7), 1.0, 5.0), 1),
            "fulfillment_rate": round(np.clip(np.random.normal(0.92, 0.06), 0.60, 1.0), 3),
            "avg_response_time_hrs": round(np.clip(np.random.exponential(8), 1, 72), 1),
        })
    return pd.DataFrame(sellers)


def generate_customers():
    """Generate customer master data."""
    print("Generating customer data...")
    customers = []
    for i in range(NUM_CUSTOMERS):
        tier = np.random.choice(list(CITIES_BY_TIER.keys()), p=[0.50, 0.32, 0.18])
        city, state = CITIES_BY_TIER[tier][np.random.randint(len(CITIES_BY_TIER[tier]))]
        customers.append({
            "customer_id": f"CUS{i+1:06d}",
            "customer_city": city,
            "customer_state": state,
            "customer_tier": tier,
            "signup_date": DATE_START - timedelta(days=np.random.randint(1, 1095)),
        })
    return pd.DataFrame(customers)


def generate_products():
    """Generate product/SKU master data."""
    print("Generating product catalog...")
    products = []
    sku_idx = 0
    for category, config in CATEGORIES.items():
        num_skus = int(NUM_SKUS * config["gmv_share"])
        for _ in range(num_skus):
            sku_idx += 1
            mrp = max(50, np.random.normal(config["avg_price"], config["price_std"]))
            discount = np.random.uniform(0.0, 0.40)
            products.append({
                "sku_id": f"SKU{sku_idx:06d}",
                "category": category,
                "sub_category": f"{category}_Sub{np.random.randint(1, 6)}",
                "mrp": round(mrp, 2),
                "selling_price": round(mrp * (1 - discount), 2),
                "discount_pct": round(discount * 100, 1),
                "brand_tier": np.random.choice(["Premium", "Mid-Range", "Budget"], p=[0.2, 0.5, 0.3]),
            })
    return pd.DataFrame(products)


def generate_transactions(sellers_df, customers_df, products_df):
    """Generate 500K+ transaction records with funnel events."""
    print(f"Generating {NUM_TRANSACTIONS:,} transactions...")

    # Pre-compute lookups
    seller_ids = sellers_df["seller_id"].values
    customer_ids = customers_df["customer_id"].values
    product_records = products_df.to_dict("records")

    # Category-wise product indices
    cat_product_idx = {}
    for idx, p in enumerate(product_records):
        cat_product_idx.setdefault(p["category"], []).append(idx)

    # Generate dates with seasonal weighting
    total_days = (DATE_END - DATE_START).days
    dates = [DATE_START + timedelta(days=d) for d in range(total_days + 1)]
    date_weights = np.array([get_seasonal_multiplier(d) for d in dates])
    date_weights /= date_weights.sum()

    transactions = []
    for i in range(NUM_TRANSACTIONS):
        if i % 100_000 == 0 and i > 0:
            print(f"  ...generated {i:,} transactions")

        # Pick date
        txn_date = np.random.choice(dates, p=date_weights)

        # Pick category
        cat_probs = [c["gmv_share"] for c in CATEGORIES.values()]
        category = np.random.choice(list(CATEGORIES.keys()), p=cat_probs)

        # Pick product from category
        prod_idx = np.random.choice(cat_product_idx[category])
        product = product_records[prod_idx]

        # Pick customer (weighted by tier)
        cust_idx = np.random.randint(len(customer_ids))
        customer_id = customer_ids[cust_idx]
        cust_tier = customers_df.iloc[cust_idx]["customer_tier"]

        # Pick seller
        seller_idx = np.random.randint(len(seller_ids))
        seller_id = seller_ids[seller_idx]

        # Funnel simulation
        conv = CONVERSION_RATES[cust_tier]
        added_to_cart = np.random.random() < conv["view_to_cart"]
        ordered = added_to_cart and (np.random.random() < conv["cart_to_order"])

        # Determine order status
        if ordered:
            status_roll = np.random.random()
            if status_roll < CATEGORIES[category]["return_rate"]:
                order_status = "Returned"
            elif status_roll < CATEGORIES[category]["return_rate"] + 0.02:
                order_status = "Cancelled"
            else:
                order_status = "Delivered"
        elif added_to_cart:
            order_status = "Cart Abandoned"
        else:
            order_status = "Viewed Only"

        # Payment method (only for orders)
        payment = None
        if ordered:
            # Tier-3 cities have higher COD preference
            if cust_tier == "Tier-3":
                pay_probs = {"UPI": 0.30, "Credit Card": 0.08, "Debit Card": 0.10,
                             "COD": 0.35, "Net Banking": 0.05, "Wallet": 0.07, "EMI": 0.05}
            elif cust_tier == "Tier-2":
                pay_probs = {"UPI": 0.38, "Credit Card": 0.12, "Debit Card": 0.12,
                             "COD": 0.22, "Net Banking": 0.07, "Wallet": 0.05, "EMI": 0.04}
            else:
                pay_probs = PAYMENT_METHODS
            payment = np.random.choice(list(pay_probs.keys()), p=list(pay_probs.values()))

        # Quantity
        qty = np.random.choice([1, 2, 3, 4, 5], p=[0.65, 0.20, 0.10, 0.03, 0.02]) if ordered else 0

        # Shipping cost (higher for Tier-2/3)
        base_shipping = {"Tier-1": 40, "Tier-2": 65, "Tier-3": 90}
        shipping = base_shipping[cust_tier] if ordered and product["selling_price"] < 500 else 0

        transactions.append({
            "transaction_id": f"TXN{i+1:07d}",
            "transaction_date": txn_date.strftime("%Y-%m-%d"),
            "customer_id": customer_id,
            "seller_id": seller_id,
            "sku_id": product["sku_id"],
            "category": category,
            "sub_category": product["sub_category"],
            "mrp": product["mrp"],
            "selling_price": product["selling_price"],
            "discount_pct": product["discount_pct"],
            "quantity": qty,
            "total_amount": round(product["selling_price"] * qty, 2) if ordered else 0,
            "shipping_cost": shipping,
            "payment_method": payment,
            "order_status": order_status,
            "customer_tier": cust_tier,
            "brand_tier": product["brand_tier"],
        })

    return pd.DataFrame(transactions)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("E-Commerce Synthetic Data Generator (India Market)")
    print("=" * 60)

    # Generate master data
    sellers_df = generate_sellers()
    customers_df = generate_customers()
    products_df = generate_products()

    # Generate transactions
    transactions_df = generate_transactions(sellers_df, customers_df, products_df)

    # Save to CSV
    sellers_df.to_csv(os.path.join(OUTPUT_DIR, "sellers.csv"), index=False)
    customers_df.to_csv(os.path.join(OUTPUT_DIR, "customers.csv"), index=False)
    products_df.to_csv(os.path.join(OUTPUT_DIR, "products.csv"), index=False)
    transactions_df.to_csv(os.path.join(OUTPUT_DIR, "transactions.csv"), index=False)

    # Summary statistics
    print("\n" + "=" * 60)
    print("DATA GENERATION COMPLETE")
    print("=" * 60)
    print(f"Transactions: {len(transactions_df):,}")
    print(f"Sellers:      {len(sellers_df):,}")
    print(f"Customers:    {len(customers_df):,}")
    print(f"Products:     {len(products_df):,}")
    print(f"\nOrder Status Distribution:")
    print(transactions_df["order_status"].value_counts().to_string())
    print(f"\nCategory Distribution:")
    print(transactions_df["category"].value_counts().to_string())
    print(f"\nFiles saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
