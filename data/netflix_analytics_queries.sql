-- Sample Analytics Queries for Netflix Dataset

-- Content Type Distribution

SELECT 
    type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM netflix_shows 
GROUP BY type
ORDER BY count DESC;

-- Top Rated Shows by IMDB Score

SELECT 
    title,
    type,
    release_year,
    imdb_score,
    imdb_votes
FROM netflix_shows 
WHERE imdb_score IS NOT NULL
ORDER BY imdb_score DESC, imdb_votes DESC
LIMIT 20;

-- Content by Release Year

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
LIMIT 15;

-- Age Certification Analysis

SELECT 
    age_certification,
    COUNT(*) as content_count,
    ROUND(AVG(imdb_score), 2) as avg_rating,
    ROUND(AVG(runtime), 0) as avg_runtime_minutes
FROM netflix_shows 
WHERE age_certification IS NOT NULL
GROUP BY age_certification
ORDER BY content_count DESC;

-- Runtime Distribution

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
ORDER BY count DESC;

-- Highly Rated Content (Score > 8.0)

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
ORDER BY imdb_score DESC, imdb_votes DESC;

