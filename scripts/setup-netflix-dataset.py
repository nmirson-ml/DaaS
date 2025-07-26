#!/usr/bin/env python3

"""
Setup Netflix IMDB Dataset for DaaS Platform
Downloads Kaggle dataset and prepares it for DuckDB integration
"""

import os
import sys
import shutil
import pandas as pd
from pathlib import Path

def setup_netflix_dataset():
    print("🎬 Setting up Netflix IMDB Dataset for DaaS Platform\n")
    
    # Check if kagglehub is installed
    try:
        import kagglehub
        print("✅ kagglehub is available")
    except ImportError:
        print("❌ kagglehub not found. Installing...")
        os.system("pip install kagglehub")
        import kagglehub
        print("✅ kagglehub installed")
    
    # Set up paths
    project_root = Path(__file__).parent.parent
    data_dir = project_root / "data"
    data_dir.mkdir(exist_ok=True)
    
    print(f"📁 Data directory: {data_dir}")
    
    # Download dataset
    print("\n📥 Downloading Netflix dataset from Kaggle...")
    try:
        path = kagglehub.dataset_download("sufyan145/netflix-movies-and-shows-imdb-scores")
        print(f"✅ Dataset downloaded to: {path}")
        
        # Find CSV files in the downloaded path
        dataset_path = Path(path)
        csv_files = list(dataset_path.glob("*.csv"))
        
        if not csv_files:
            print("❌ No CSV files found in downloaded dataset")
            return False
            
        # Copy CSV file to our data directory
        netflix_csv = csv_files[0]  # Assume first CSV is the main dataset
        target_csv = data_dir / "netflix_imdb_dataset.csv"
        
        shutil.copy2(netflix_csv, target_csv)
        print(f"✅ Dataset copied to: {target_csv}")
        
        # Analyze dataset structure
        print("\n📊 Analyzing dataset structure...")
        df = pd.read_csv(target_csv)
        
        print(f"📈 Dataset Statistics:")
        print(f"   Total records: {len(df):,}")
        print(f"   Columns: {len(df.columns)}")
        print(f"   File size: {target_csv.stat().st_size / 1024:.1f} KB")
        
        print(f"\n📋 Dataset Columns:")
        for i, col in enumerate(df.columns, 1):
            dtype = df[col].dtype
            null_count = df[col].isnull().sum()
            null_pct = (null_count / len(df)) * 100
            print(f"   {i:2d}. {col:<20} ({dtype}) - {null_count:,} nulls ({null_pct:.1f}%)")
        
        print(f"\n🎭 Sample Data:")
        print(df.head(3).to_string(index=False))
        
        # Create DuckDB setup queries
        print(f"\n🦆 Generating DuckDB setup queries...")
        
        # Generate CREATE TABLE statement based on pandas dtypes
        create_table_sql = generate_duckdb_schema(df, "netflix_shows")
        
        # Write setup SQL file
        sql_file = data_dir / "setup_netflix_duckdb.sql"
        with open(sql_file, 'w') as f:
            f.write(f"""-- Netflix IMDB Dataset Setup for DuckDB
-- Generated automatically from Kaggle dataset

-- Drop table if exists
DROP TABLE IF EXISTS netflix_shows;

-- Create table with proper schema
{create_table_sql}

-- Load data from CSV
INSERT INTO netflix_shows 
SELECT * FROM read_csv_auto('{target_csv.absolute()}', 
    header=true, 
    delim=',',
    quote='"'
);

-- Verify data loaded
SELECT COUNT(*) as total_records FROM netflix_shows;

-- Sample analytics queries for testing
SELECT 
    type,
    COUNT(*) as count,
    ROUND(AVG(imdb_score), 2) as avg_imdb_score
FROM netflix_shows 
WHERE imdb_score IS NOT NULL
GROUP BY type
ORDER BY count DESC;
""")
        
        print(f"✅ DuckDB setup SQL saved to: {sql_file}")
        
        # Generate sample analytics queries
        analytics_queries = generate_analytics_queries()
        queries_file = data_dir / "netflix_analytics_queries.sql"
        
        with open(queries_file, 'w') as f:
            f.write("-- Sample Analytics Queries for Netflix Dataset\n\n")
            for name, query in analytics_queries.items():
                f.write(f"-- {name}\n{query}\n\n")
        
        print(f"✅ Sample analytics queries saved to: {queries_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        return False

def generate_duckdb_schema(df, table_name):
    """Generate CREATE TABLE statement for DuckDB based on pandas DataFrame"""
    
    type_mapping = {
        'object': 'VARCHAR',
        'int64': 'INTEGER',
        'float64': 'DOUBLE',
        'bool': 'BOOLEAN',
        'datetime64[ns]': 'TIMESTAMP'
    }
    
    columns = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        duckdb_type = type_mapping.get(dtype, 'VARCHAR')
        
        # Clean column name for SQL
        clean_col = col.replace(' ', '_').replace('-', '_').lower()
        columns.append(f"    {clean_col} {duckdb_type}")
    
    return f"CREATE TABLE {table_name} (\n" + ",\n".join(columns) + "\n);"

def generate_analytics_queries():
    """Generate sample analytics queries for Netflix dataset"""
    
    return {
        "Content Type Distribution": """
SELECT 
    type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM netflix_shows 
GROUP BY type
ORDER BY count DESC;""",
        
        "Top Rated Shows by IMDB Score": """
SELECT 
    title,
    type,
    release_year,
    imdb_score,
    imdb_votes
FROM netflix_shows 
WHERE imdb_score IS NOT NULL
ORDER BY imdb_score DESC, imdb_votes DESC
LIMIT 20;""",
        
        "Content by Release Year": """
SELECT 
    release_year,
    COUNT(*) as total_content,
    COUNT(CASE WHEN type = 'MOVIE' THEN 1 END) as movies,
    COUNT(CASE WHEN type = 'SHOW' THEN 1 END) as shows,
    ROUND(AVG(imdb_score), 2) as avg_imdb_score
FROM netflix_shows 
WHERE release_year IS NOT NULL
GROUP BY release_year
ORDER BY release_year DESC
LIMIT 15;""",
        
        "Age Certification Analysis": """
SELECT 
    age_certification,
    COUNT(*) as content_count,
    ROUND(AVG(imdb_score), 2) as avg_rating,
    ROUND(AVG(runtime), 0) as avg_runtime_minutes
FROM netflix_shows 
WHERE age_certification IS NOT NULL
GROUP BY age_certification
ORDER BY content_count DESC;""",
        
        "Runtime Distribution": """
SELECT 
    CASE 
        WHEN runtime < 30 THEN '< 30 min'
        WHEN runtime < 60 THEN '30-60 min'
        WHEN runtime < 90 THEN '60-90 min'
        WHEN runtime < 120 THEN '90-120 min'
        WHEN runtime < 180 THEN '2-3 hours'
        ELSE '3+ hours'
    END as runtime_category,
    COUNT(*) as count,
    ROUND(AVG(imdb_score), 2) as avg_score
FROM netflix_shows 
WHERE runtime IS NOT NULL
GROUP BY runtime_category
ORDER BY count DESC;""",
        
        "Highly Rated Content (Score > 8.0)": """
SELECT 
    title,
    type,
    release_year,
    age_certification,
    runtime,
    imdb_score,
    imdb_votes
FROM netflix_shows 
WHERE imdb_score > 8.0
ORDER BY imdb_score DESC, imdb_votes DESC;"""
    }

if __name__ == "__main__":
    print("🎬 Netflix IMDB Dataset Setup")
    print("=" * 40)
    
    # Check if pandas is available
    try:
        import pandas as pd
        print("✅ pandas is available")
    except ImportError:
        print("❌ pandas not found. Installing...")
        os.system("pip install pandas")
        import pandas as pd
        print("✅ pandas installed")
    
    success = setup_netflix_dataset()
    
    if success:
        print("\n🎉 Netflix dataset setup completed successfully!")
        print("\nNext steps:")
        print("1. Install DuckDB: pip install duckdb")
        print("2. Run DuckDB setup: duckdb data/netflix.duckdb < data/setup_netflix_duckdb.sql")
        print("3. Start services: node scripts/start-live-demo.js")
        print("4. Test analytics queries")
    else:
        print("\n❌ Dataset setup failed. Please check errors above.")
        sys.exit(1)