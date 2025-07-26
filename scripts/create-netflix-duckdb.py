#!/usr/bin/env python3

"""
Create DuckDB database with Netflix dataset
"""

import duckdb
import pandas as pd
from pathlib import Path

def create_netflix_duckdb():
    print("🦆 Creating Netflix DuckDB Database\n")
    
    # Set up paths
    project_root = Path(__file__).parent.parent
    data_dir = project_root / "data"
    csv_path = data_dir / "netflix_imdb_dataset.csv"
    db_path = data_dir / "netflix.duckdb"
    
    if not csv_path.exists():
        print(f"❌ CSV file not found: {csv_path}")
        print("Please run: python scripts/setup-netflix-dataset.py first")
        return False
    
    print(f"📄 CSV file: {csv_path}")
    print(f"🗃️  Database: {db_path}")
    
    # Create DuckDB connection
    conn = duckdb.connect(str(db_path))
    print(f"✅ Connected to DuckDB database")
    
    try:
        # Drop table if exists
        conn.execute("DROP TABLE IF EXISTS netflix_shows")
        print("🗑️  Dropped existing table (if any)")
        
        # Create table and load data in one step using DuckDB's CSV reader
        create_and_load_sql = f"""
        CREATE TABLE netflix_shows AS 
        SELECT * FROM read_csv_auto('{csv_path}', 
            header=true, 
            delim=',',
            quote='"'
        )
        """
        
        conn.execute(create_and_load_sql)
        print("📊 Created table and loaded data from CSV")
        
        # Verify data loaded
        result = conn.execute("SELECT COUNT(*) as total_records FROM netflix_shows").fetchone()
        total_records = result[0]
        print(f"✅ Loaded {total_records:,} records")
        
        # Get table schema
        schema_result = conn.execute("DESCRIBE netflix_shows").fetchall()
        print(f"\n📋 Table Schema:")
        for row in schema_result:
            col_name, col_type, null_val, key, default, extra = row
            print(f"   {col_name:<20} {col_type}")
        
        # Run sample analytics
        print(f"\n📈 Sample Analytics:")
        
        # Content type distribution
        type_result = conn.execute("""
            SELECT 
                type,
                COUNT(*) as count,
                ROUND(AVG(imdb_score), 2) as avg_imdb_score
            FROM netflix_shows 
            WHERE imdb_score IS NOT NULL
            GROUP BY type
            ORDER BY count DESC
        """).fetchall()
        
        print(f"\n🎭 Content by Type:")
        for row in type_result:
            type_name, count, avg_score = row
            print(f"   {type_name:<8} {count:>5,} items (avg score: {avg_score})")
        
        # Top rated content
        top_rated = conn.execute("""
            SELECT title, type, release_year, imdb_score
            FROM netflix_shows 
            WHERE imdb_score IS NOT NULL
            ORDER BY imdb_score DESC
            LIMIT 5
        """).fetchall()
        
        print(f"\n⭐ Top 5 Highest Rated:")
        for row in top_rated:
            title, content_type, year, score = row
            print(f"   {score} - {title} ({content_type}, {year})")
        
        # Release year distribution
        year_result = conn.execute("""
            SELECT 
                release_year,
                COUNT(*) as count
            FROM netflix_shows 
            WHERE release_year >= 2020
            GROUP BY release_year
            ORDER BY release_year DESC
        """).fetchall()
        
        print(f"\n📅 Recent Content (2020+):")
        for row in year_result:
            year, count = row
            print(f"   {year}: {count:>4,} titles")
        
        print(f"\n🎉 Netflix DuckDB database created successfully!")
        print(f"📍 Database location: {db_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False
    
    finally:
        conn.close()

if __name__ == "__main__":
    print("🎬 Netflix DuckDB Setup")
    print("=" * 30)
    
    success = create_netflix_duckdb()
    
    if success:
        print(f"\n✅ Setup complete! Next steps:")
        print(f"1. Update live demo to use Netflix data")
        print(f"2. Start query engine service")
        print(f"3. Test analytics dashboard")
    else:
        print(f"\n❌ Setup failed. Check errors above.")