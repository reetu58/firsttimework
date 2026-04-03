"""
Pipeline Orchestrator
=====================
Loads CSV data into SQLite, executes all SQL analytics queries,
and exports results for Tableau consumption.

Usage: python scripts/run_pipeline.py
"""

import sqlite3
import pandas as pd
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
EXPORT_DIR = os.path.join(BASE_DIR, "data", "exports")
SQL_DIR = os.path.join(BASE_DIR, "sql")
DB_PATH = os.path.join(BASE_DIR, "data", "ecommerce.db")


def load_csv_to_sqlite(conn):
    """Load all raw CSV files into SQLite tables."""
    print("Loading CSV data into SQLite...")

    # Read schema and create tables
    schema_path = os.path.join(SQL_DIR, "01_create_tables.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)

    # Load each CSV
    tables = {
        "sellers": "sellers.csv",
        "customers": "customers.csv",
        "products": "products.csv",
        "transactions": "transactions.csv",
    }

    for table_name, csv_file in tables.items():
        csv_path = os.path.join(RAW_DIR, csv_file)
        if not os.path.exists(csv_path):
            print(f"  WARNING: {csv_path} not found. Run generate_data.py first.")
            continue
        df = pd.read_csv(csv_path)
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        print(f"  Loaded {table_name}: {len(df):,} rows")

    conn.commit()


def run_sql_file(conn, sql_filename, export_name=None):
    """Execute a SQL file and optionally export results."""
    sql_path = os.path.join(SQL_DIR, sql_filename)
    with open(sql_path, "r") as f:
        sql_content = f.read()

    # Split into individual statements
    statements = [s.strip() for s in sql_content.split(";") if s.strip()]

    results = {}
    query_num = 0
    for stmt in statements:
        # Skip comments-only blocks and CREATE/INSERT statements for export
        if not stmt or stmt.startswith("--"):
            continue

        try:
            if stmt.upper().startswith(("CREATE", "DROP", "INSERT", "DELETE", "UPDATE")):
                conn.execute(stmt)
                conn.commit()
                print(f"  Executed DDL/DML: {stmt[:60]}...")
            elif stmt.upper().startswith("SELECT") or stmt.upper().startswith("WITH"):
                query_num += 1
                df = pd.read_sql_query(stmt, conn)
                results[f"query_{query_num}"] = df
                print(f"  Query {query_num}: {len(df)} rows returned")
        except Exception as e:
            print(f"  Error executing: {stmt[:80]}...")
            print(f"  Error: {e}")

    # Export combined results
    if export_name and results:
        os.makedirs(EXPORT_DIR, exist_ok=True)
        for key, df in results.items():
            export_path = os.path.join(EXPORT_DIR, f"{export_name}_{key}.csv")
            df.to_csv(export_path, index=False)
        print(f"  Exported {len(results)} result sets to {EXPORT_DIR}/")

    return results


def run_pipeline():
    """Execute the full analytics pipeline."""
    print("=" * 60)
    print("E-COMMERCE ANALYTICS PIPELINE")
    print("=" * 60)

    # Check if raw data exists
    if not os.path.exists(os.path.join(RAW_DIR, "transactions.csv")):
        print("\nRaw data not found. Generating synthetic data first...")
        sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
        from generate_data import main as generate_main
        generate_main()

    # Connect to SQLite
    conn = sqlite3.connect(DB_PATH)
    print(f"\nDatabase: {DB_PATH}")

    # Step 1: Load data
    print("\n--- STEP 1: Loading Data ---")
    load_csv_to_sqlite(conn)

    # Step 2: Validate data
    print("\n--- STEP 2: Data Validation ---")
    run_sql_file(conn, "02_load_data.sql", "validation")

    # Step 3: GMV Analysis
    print("\n--- STEP 3: GMV Analysis ---")
    run_sql_file(conn, "03_gmv_analysis.sql", "gmv_analysis")

    # Step 4: Conversion Funnel
    print("\n--- STEP 4: Conversion Funnel ---")
    run_sql_file(conn, "04_conversion_funnel.sql", "conversion_funnel")

    # Step 5: Seller Health
    print("\n--- STEP 5: Seller Health Scores ---")
    run_sql_file(conn, "05_seller_health.sql", "seller_health")

    # Step 6: Pricing Analysis
    print("\n--- STEP 6: Pricing Competitiveness ---")
    run_sql_file(conn, "06_pricing_analysis.sql", "pricing_analysis")

    # Step 7: Weekly KPIs
    print("\n--- STEP 7: Weekly KPI Trends ---")
    run_sql_file(conn, "07_weekly_kpis.sql", "weekly_kpis")

    conn.close()

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print(f"Database: {DB_PATH}")
    print(f"Exports:  {EXPORT_DIR}/")
    print("=" * 60)


if __name__ == "__main__":
    run_pipeline()
