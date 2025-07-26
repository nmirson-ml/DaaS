#!/usr/bin/env node

/**
 * Netflix Analytics Demo - Real DuckDB Integration
 * This script connects to the Netflix DuckDB database and provides analytics API
 */

const express = require('express');
const cors = require('cors');
const Database = require('duckdb').Database;
const path = require('path');
const fs = require('fs');

const PORT = 3001;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'netflix.duckdb');

let db;
let connection;

// Initialize DuckDB connection to Netflix database
function initializeNetflixDB() {
    return new Promise((resolve, reject) => {
        console.log('🎬 Connecting to Netflix DuckDB database...');
        
        // Check if database file exists
        if (!fs.existsSync(DB_PATH)) {
            console.error(`❌ Netflix database not found: ${DB_PATH}`);
            console.log('Please run: python scripts/create-netflix-duckdb.py');
            reject(new Error('Netflix database not found'));
            return;
        }
        
        db = new Database(DB_PATH);
        connection = db.connect();
        
        // Verify netflix_shows table exists
        connection.all("SELECT name FROM sqlite_master WHERE type='table' AND name='netflix_shows'", (err, rows) => {
            if (err) {
                console.error('❌ Error checking database:', err);
                reject(err);
                return;
            }
            
            if (rows.length === 0) {
                console.error('❌ netflix_shows table not found in database');
                reject(new Error('netflix_shows table not found'));
                return;
            }
            
            // Get record count
            connection.all("SELECT COUNT(*) as count FROM netflix_shows", (err, countResult) => {
                if (err) {
                    console.error('❌ Error counting records:', err);
                    reject(err);
                    return;
                }
                
                const recordCount = countResult[0].count;
                console.log(`✅ Connected to Netflix database with ${recordCount.toLocaleString()} records`);
                resolve();
            });
        });
    });
}

// Execute SQL query with error handling and metrics
function executeQuery(sql) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        console.log(`🔍 Executing query: ${sql.substring(0, 100)}...`);
        
        connection.all(sql, (err, rows) => {
            if (err) {
                console.error('❌ Query failed:', err.message);
                reject(err);
                return;
            }
            
            const executionTime = Date.now() - startTime;
            
            // Extract column metadata from first row
            const columns = rows.length > 0 ? Object.keys(rows[0]).map(name => ({
                name,
                type: typeof rows[0][name] === 'number' ? 'number' : 'string',
                nullable: true
            })) : [];
            
            console.log(`✅ Query executed in ${executionTime}ms, returned ${rows.length} rows`);
            
            resolve({
                rows,
                columns,
                metadata: {
                    executionTime,
                    rowCount: rows.length,
                    dataScanned: 0,
                    cached: false
                }
            });
        });
    });
}

// Create Express API with Netflix analytics endpoints
function createNetflixAPI() {
    const app = express();
    
    app.use(cors());
    app.use(express.json());
    
    // Health check
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'healthy', 
            service: 'netflix-analytics-api',
            database: 'netflix.duckdb'
        });
    });
    
    // Data source health for Netflix database
    app.get('/api/health', (req, res) => {
        res.json({
            'netflix-duckdb': {
                status: 'healthy',
                details: {
                    connected: true,
                    databasePath: DB_PATH,
                    tableExists: true
                }
            }
        });
    });
    
    // Generic query endpoint (same as original for compatibility)
    app.post('/api/query', async (req, res) => {
        try {
            const { sql, dataSourceId } = req.body;
            
            if (dataSourceId !== 'netflix-duckdb') {
                return res.status(400).json({ error: 'Invalid data source. Use "netflix-duckdb"' });
            }
            
            const result = await executeQuery(sql);
            res.json(result);
            
        } catch (error) {
            console.error('❌ Query API error:', error.message);
            res.status(500).json({ error: error.message });
        }
    });
    
    // Predefined Netflix analytics endpoints
    app.get('/api/netflix/content-types', async (req, res) => {
        try {
            const sql = `
                SELECT 
                    type,
                    COUNT(*) as count,
                    ROUND(AVG(imdb_score), 2) as avg_imdb_score,
                    ROUND(AVG(runtime), 0) as avg_runtime
                FROM netflix_shows 
                WHERE imdb_score IS NOT NULL
                GROUP BY type
                ORDER BY count DESC
            `;
            const result = await executeQuery(sql);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.get('/api/netflix/top-rated', async (req, res) => {
        try {
            const limit = req.query.limit || 20;
            const sql = `
                SELECT 
                    title,
                    type,
                    release_year,
                    imdb_score,
                    imdb_votes,
                    runtime,
                    age_certification
                FROM netflix_shows 
                WHERE imdb_score IS NOT NULL
                ORDER BY imdb_score DESC, imdb_votes DESC
                LIMIT ${limit}
            `;
            const result = await executeQuery(sql);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.get('/api/netflix/release-years', async (req, res) => {
        try {
            const sql = `
                SELECT 
                    release_year,
                    COUNT(*) as total_content,
                    COUNT(CASE WHEN type = 'MOVIE' THEN 1 END) as movies,
                    COUNT(CASE WHEN type = 'SHOW' THEN 1 END) as shows,
                    ROUND(AVG(imdb_score), 2) as avg_imdb_score
                FROM netflix_shows 
                WHERE release_year >= 2010
                GROUP BY release_year
                ORDER BY release_year DESC
            `;
            const result = await executeQuery(sql);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.get('/api/netflix/age-ratings', async (req, res) => {
        try {
            const sql = `
                SELECT 
                    COALESCE(age_certification, 'Not Rated') as age_certification,
                    COUNT(*) as content_count,
                    ROUND(AVG(imdb_score), 2) as avg_rating,
                    ROUND(AVG(runtime), 0) as avg_runtime_minutes
                FROM netflix_shows 
                GROUP BY age_certification
                ORDER BY content_count DESC
            `;
            const result = await executeQuery(sql);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.get('/api/netflix/runtime-distribution', async (req, res) => {
        try {
            const sql = `
                SELECT 
                    CASE 
                        WHEN runtime < 30 THEN 'Short (< 30 min)'
                        WHEN runtime < 60 THEN 'Medium (30-60 min)'
                        WHEN runtime < 90 THEN 'Standard (60-90 min)'
                        WHEN runtime < 120 THEN 'Long (90-120 min)'
                        WHEN runtime < 180 THEN 'Extended (2-3 hours)'
                        ELSE 'Epic (3+ hours)'
                    END as runtime_category,
                    COUNT(*) as count,
                    ROUND(AVG(imdb_score), 2) as avg_score,
                    MIN(runtime) as min_runtime,
                    MAX(runtime) as max_runtime
                FROM netflix_shows 
                WHERE runtime IS NOT NULL
                GROUP BY runtime_category
                ORDER BY count DESC
            `;
            const result = await executeQuery(sql);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.get('/api/netflix/highly-rated', async (req, res) => {
        try {
            const minScore = req.query.minScore || 8.0;
            const sql = `
                SELECT 
                    title,
                    type,
                    release_year,
                    age_certification,
                    runtime,
                    imdb_score,
                    imdb_votes
                FROM netflix_shows 
                WHERE imdb_score >= ${minScore}
                ORDER BY imdb_score DESC, imdb_votes DESC
            `;
            const result = await executeQuery(sql);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    return app;
}

// Start the Netflix analytics demo
async function startNetflixDemo() {
    try {
        console.log('🎬 Starting Netflix Analytics Demo API\n');
        
        // Initialize Netflix DuckDB
        await initializeNetflixDB();
        
        // Create and start API server
        const app = createNetflixAPI();
        app.listen(PORT, () => {
            console.log(`\n🚀 Netflix Analytics API running on http://localhost:${PORT}`);
            console.log(`🗃️  Database: ${DB_PATH}`);
            console.log(`📊 Table: netflix_shows (5,283 records)`);
            
            console.log(`\n🎯 API Endpoints:`);
            console.log(`  Health Check:`);
            console.log(`  - GET  http://localhost:${PORT}/health`);
            console.log(`  - GET  http://localhost:${PORT}/api/health`);
            
            console.log(`\n  Generic Query:`);
            console.log(`  - POST http://localhost:${PORT}/api/query`);
            
            console.log(`\n  Netflix Analytics:`);
            console.log(`  - GET  http://localhost:${PORT}/api/netflix/content-types`);
            console.log(`  - GET  http://localhost:${PORT}/api/netflix/top-rated?limit=10`);
            console.log(`  - GET  http://localhost:${PORT}/api/netflix/release-years`);
            console.log(`  - GET  http://localhost:${PORT}/api/netflix/age-ratings`);
            console.log(`  - GET  http://localhost:${PORT}/api/netflix/runtime-distribution`);
            console.log(`  - GET  http://localhost:${PORT}/api/netflix/highly-rated?minScore=8.5`);
            
            console.log(`\n📋 Example Queries:`);
            console.log(`\n  Content Types:`);
            console.log(`  curl http://localhost:${PORT}/api/netflix/content-types`);
            
            console.log(`\n  Custom Query:`);
            console.log(`  curl -X POST http://localhost:${PORT}/api/query \\`);
            console.log(`    -H "Content-Type: application/json" \\`);
            console.log(`    -d '{"sql": "SELECT title, imdb_score FROM netflix_shows WHERE imdb_score > 9.0 ORDER BY imdb_score DESC", "dataSourceId": "netflix-duckdb"}'`);
            
            console.log(`\n🎉 Netflix Analytics Demo ready! Query real data from ${path.basename(DB_PATH)}`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start Netflix demo:', error.message);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Netflix Analytics Demo...');
    if (connection) connection.close();
    if (db) db.close();
    process.exit(0);
});

// Start if called directly
if (require.main === module) {
    startNetflixDemo();
}

module.exports = { startNetflixDemo, executeQuery };