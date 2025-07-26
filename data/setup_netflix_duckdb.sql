-- Netflix IMDB Dataset Setup for DuckDB
-- Generated automatically from Kaggle dataset

-- Drop table if exists
DROP TABLE IF EXISTS netflix_shows;

-- Create table with proper schema
CREATE TABLE netflix_shows (
    index INTEGER,
    id VARCHAR,
    title VARCHAR,
    type VARCHAR,
    description VARCHAR,
    release_year INTEGER,
    age_certification VARCHAR,
    runtime INTEGER,
    imdb_id VARCHAR,
    imdb_score DOUBLE,
    imdb_votes DOUBLE
);

-- Load data from CSV
INSERT INTO netflix_shows 
SELECT * FROM read_csv_auto('/Users/nmirson/Repos/dashboarding-embedded-app/data/netflix_imdb_dataset.csv', 
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
