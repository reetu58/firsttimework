"""
PySpark ETL Pipeline
====================
Large-scale data processing and enrichment for the e-commerce dataset.

Features:
- Data cleaning and type casting
- Derived column generation (seller health scores, price competitiveness index)
- Category-level aggregations
- Weekly KPI rollups
- Parquet output for downstream analytics

Usage: python pyspark/etl_pipeline.py
"""

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.sql.types import (
    StructType, StructField, StringType, DoubleType, IntegerType, DateType
)
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")


def create_spark_session():
    """Initialize Spark session."""
    return (
        SparkSession.builder
        .appName("ECommerce_Category_Intelligence")
        .master("local[*]")
        .config("spark.sql.shuffle.partitions", "8")
        .config("spark.driver.memory", "4g")
        .getOrCreate()
    )


def load_raw_data(spark):
    """Load raw CSV files into Spark DataFrames."""
    print("Loading raw data...")

    transactions = spark.read.csv(
        os.path.join(RAW_DIR, "transactions.csv"),
        header=True, inferSchema=True
    )
    sellers = spark.read.csv(
        os.path.join(RAW_DIR, "sellers.csv"),
        header=True, inferSchema=True
    )
    customers = spark.read.csv(
        os.path.join(RAW_DIR, "customers.csv"),
        header=True, inferSchema=True
    )
    products = spark.read.csv(
        os.path.join(RAW_DIR, "products.csv"),
        header=True, inferSchema=True
    )

    print(f"  Transactions: {transactions.count():,} rows")
    print(f"  Sellers:      {sellers.count():,} rows")
    print(f"  Customers:    {customers.count():,} rows")
    print(f"  Products:     {products.count():,} rows")

    return transactions, sellers, customers, products


def clean_transactions(df):
    """Clean and enrich transaction data."""
    print("Cleaning transactions...")

    df = (
        df
        # Cast date column
        .withColumn("transaction_date", F.to_date("transaction_date", "yyyy-MM-dd"))
        # Add time dimensions
        .withColumn("year", F.year("transaction_date"))
        .withColumn("month", F.month("transaction_date"))
        .withColumn("week_of_year", F.weekofyear("transaction_date"))
        .withColumn("day_of_week", F.dayofweek("transaction_date"))
        .withColumn("year_month", F.date_format("transaction_date", "yyyy-MM"))
        .withColumn("year_week", F.concat(
            F.year("transaction_date").cast("string"),
            F.lit("-W"),
            F.lpad(F.weekofyear("transaction_date").cast("string"), 2, "0")
        ))
        # Flag orders vs non-orders
        .withColumn("is_order", F.when(
            F.col("order_status").isin("Delivered", "Returned", "Cancelled"), 1
        ).otherwise(0))
        .withColumn("is_delivered", F.when(
            F.col("order_status") == "Delivered", 1
        ).otherwise(0))
        .withColumn("is_cart_abandoned", F.when(
            F.col("order_status") == "Cart Abandoned", 1
        ).otherwise(0))
        .withColumn("is_returned", F.when(
            F.col("order_status") == "Returned", 1
        ).otherwise(0))
        # Seasonal flag
        .withColumn("is_festive_season", F.when(
            ((F.col("month") == 10) & (F.dayofmonth("transaction_date") >= 15)) |
            ((F.col("month") == 11) & (F.dayofmonth("transaction_date") <= 15)) |
            ((F.col("month") == 1) & (F.dayofmonth("transaction_date").between(20, 30))) |
            ((F.col("month") == 8) & (F.dayofmonth("transaction_date").between(10, 18))),
            1
        ).otherwise(0))
        # Net revenue
        .withColumn("net_revenue", F.when(
            F.col("order_status") == "Delivered",
            F.col("total_amount") - F.col("shipping_cost")
        ).otherwise(0))
    )

    return df


def compute_seller_health_scores(transactions, sellers):
    """Compute seller health scores using PySpark."""
    print("Computing seller health scores...")

    # Aggregate seller metrics from transactions
    seller_metrics = (
        transactions
        .filter(F.col("is_order") == 1)
        .groupBy("seller_id")
        .agg(
            F.count("*").alias("total_orders"),
            F.sum("total_amount").alias("total_gmv"),
            F.avg("total_amount").alias("avg_order_value"),
            F.sum("is_returned").alias("returned_orders"),
            F.sum("is_delivered").alias("delivered_orders"),
            F.countDistinct("customer_id").alias("unique_customers"),
            F.countDistinct("category").alias("categories_served"),
        )
        .withColumn("return_rate", F.col("returned_orders") / F.col("total_orders"))
    )

    # Join with seller master data
    seller_enriched = (
        sellers
        .join(seller_metrics, "seller_id", "left")
        .fillna(0, subset=["total_orders", "total_gmv", "returned_orders"])
    )

    # Compute health score (0-100)
    seller_enriched = (
        seller_enriched
        .withColumn("fulfillment_score", F.when(
            F.col("fulfillment_rate") >= 0.95, 25
        ).when(F.col("fulfillment_rate") >= 0.90, 20
        ).when(F.col("fulfillment_rate") >= 0.80, 15
        ).otherwise(10))
        .withColumn("return_score", F.when(
            F.col("return_rate") <= 0.03, 25
        ).when(F.col("return_rate") <= 0.07, 20
        ).when(F.col("return_rate") <= 0.12, 15
        ).otherwise(10))
        .withColumn("rating_score", F.when(
            F.col("seller_rating") >= 4.5, 25
        ).when(F.col("seller_rating") >= 4.0, 20
        ).when(F.col("seller_rating") >= 3.5, 15
        ).otherwise(10))
        .withColumn("response_score", F.when(
            F.col("avg_response_time_hrs") <= 4, 25
        ).when(F.col("avg_response_time_hrs") <= 8, 20
        ).when(F.col("avg_response_time_hrs") <= 16, 15
        ).otherwise(10))
        .withColumn("health_score",
            F.col("fulfillment_score") + F.col("return_score") +
            F.col("rating_score") + F.col("response_score")
        )
        .withColumn("health_tier", F.when(
            F.col("health_score") >= 85, "Excellent"
        ).when(F.col("health_score") >= 70, "Good"
        ).when(F.col("health_score") >= 55, "Average"
        ).otherwise("At Risk"))
    )

    return seller_enriched


def compute_price_competitiveness(transactions):
    """Compute price competitiveness index per seller per category."""
    print("Computing price competitiveness index...")

    # Category median prices
    category_median = (
        transactions
        .filter(F.col("is_delivered") == 1)
        .groupBy("category")
        .agg(F.expr("percentile_approx(selling_price, 0.5)").alias("category_median_price"))
    )

    # Seller-category average prices
    seller_prices = (
        transactions
        .filter(F.col("is_delivered") == 1)
        .groupBy("seller_id", "category")
        .agg(
            F.avg("selling_price").alias("seller_avg_price"),
            F.count("*").alias("order_count"),
        )
    )

    # Join and compute index
    price_comp = (
        seller_prices
        .join(category_median, "category")
        .withColumn("price_competitiveness_index",
            F.round(F.col("seller_avg_price") / F.col("category_median_price"), 3)
        )
        .withColumn("pricing_tier", F.when(
            F.col("price_competitiveness_index") < 0.90, "Very Competitive"
        ).when(F.col("price_competitiveness_index") < 1.00, "Competitive"
        ).when(F.col("price_competitiveness_index") < 1.10, "At Parity"
        ).otherwise("Premium/Overpriced"))
    )

    return price_comp


def compute_weekly_kpis(transactions):
    """Compute weekly KPI rollups."""
    print("Computing weekly KPI trends...")

    weekly = (
        transactions
        .groupBy("year_week")
        .agg(
            F.count("*").alias("total_events"),
            F.sum("is_order").alias("total_orders"),
            F.sum("is_delivered").alias("delivered_orders"),
            F.sum("is_cart_abandoned").alias("cart_abandoned"),
            F.sum(F.when(F.col("is_delivered") == 1, F.col("total_amount")).otherwise(0)).alias("weekly_gmv"),
            F.countDistinct("customer_id").alias("unique_customers"),
            F.countDistinct("seller_id").alias("active_sellers"),
            F.avg(F.when(F.col("total_amount") > 0, F.col("total_amount"))).alias("avg_order_value"),
        )
        .withColumn("conversion_rate",
            F.round(F.col("total_orders") / F.col("total_events") * 100, 2)
        )
        .withColumn("cart_abandonment_rate",
            F.round(F.col("cart_abandoned") / (F.col("total_orders") + F.col("cart_abandoned")) * 100, 2)
        )
        .orderBy("year_week")
    )

    # Week-over-week growth
    w = Window.orderBy("year_week")
    weekly = (
        weekly
        .withColumn("prev_gmv", F.lag("weekly_gmv").over(w))
        .withColumn("gmv_wow_growth_pct",
            F.round((F.col("weekly_gmv") - F.col("prev_gmv")) / F.col("prev_gmv") * 100, 2)
        )
        .drop("prev_gmv")
    )

    return weekly


def compute_category_aggregations(transactions):
    """Category-level aggregations for Tableau."""
    print("Computing category aggregations...")

    category_agg = (
        transactions
        .groupBy("category", "year_month")
        .agg(
            F.count("*").alias("total_events"),
            F.sum("is_order").alias("orders"),
            F.sum("is_delivered").alias("delivered"),
            F.sum("is_cart_abandoned").alias("cart_abandoned"),
            F.sum("is_returned").alias("returned"),
            F.sum(F.when(F.col("is_delivered") == 1, F.col("total_amount")).otherwise(0)).alias("gmv"),
            F.avg(F.when(F.col("total_amount") > 0, F.col("total_amount"))).alias("aov"),
            F.avg("discount_pct").alias("avg_discount"),
            F.countDistinct("seller_id").alias("active_sellers"),
            F.countDistinct("customer_id").alias("unique_customers"),
        )
        .withColumn("conversion_rate",
            F.round(F.col("orders") / F.col("total_events") * 100, 2)
        )
        .withColumn("return_rate",
            F.round(F.col("returned") / (F.col("delivered") + F.col("returned")) * 100, 2)
        )
        .orderBy("category", "year_month")
    )

    return category_agg


def save_outputs(dataframes_dict):
    """Save processed DataFrames as CSV and Parquet."""
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    for name, df in dataframes_dict.items():
        csv_path = os.path.join(PROCESSED_DIR, f"{name}.csv")
        parquet_path = os.path.join(PROCESSED_DIR, f"{name}.parquet")

        # Save as single CSV (coalesce for small datasets)
        df.coalesce(1).write.mode("overwrite").option("header", True).csv(csv_path)

        # Save as Parquet
        df.write.mode("overwrite").parquet(parquet_path)

        print(f"  Saved {name}: {df.count():,} rows")


def main():
    print("=" * 60)
    print("PYSPARK ETL PIPELINE")
    print("=" * 60)

    # Initialize Spark
    spark = create_spark_session()
    print(f"Spark version: {spark.version}")

    # Load raw data
    transactions, sellers, customers, products = load_raw_data(spark)

    # Clean and enrich transactions
    transactions_clean = clean_transactions(transactions)
    transactions_clean.cache()

    # Compute derived datasets
    seller_health = compute_seller_health_scores(transactions_clean, sellers)
    price_comp = compute_price_competitiveness(transactions_clean)
    weekly_kpis = compute_weekly_kpis(transactions_clean)
    category_agg = compute_category_aggregations(transactions_clean)

    # Save all outputs
    print("\nSaving processed data...")
    save_outputs({
        "transactions_enriched": transactions_clean,
        "seller_health_scores": seller_health,
        "price_competitiveness": price_comp,
        "weekly_kpi_trends": weekly_kpis,
        "category_aggregations": category_agg,
    })

    # Summary stats
    print("\n" + "=" * 60)
    print("ETL PIPELINE COMPLETE")
    print(f"Processed outputs saved to: {PROCESSED_DIR}")
    print("=" * 60)

    # Print sample insights
    print("\nSeller Health Distribution:")
    seller_health.groupBy("health_tier").count().show()

    print("Top 5 Categories by GMV:")
    category_agg.groupBy("category").agg(
        F.sum("gmv").alias("total_gmv")
    ).orderBy(F.desc("total_gmv")).show(5)

    spark.stop()


if __name__ == "__main__":
    main()
