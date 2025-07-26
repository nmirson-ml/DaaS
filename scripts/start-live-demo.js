#!/usr/bin/env node

/**
 * Start script for Live Analytics Demo
 * This script sets up DuckDB with sample data and starts a simple query API
 */

const express = require('express');
const cors = require('cors');
const Database = require('duckdb').Database;
const path = require('path');
const fs = require('fs');

const PORT = 3001;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'demo.duckdb');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db;
let connection;

// Initialize DuckDB
function initializeDuckDB() {
    return new Promise((resolve, reject) => {
        console.log('🦆 Initializing DuckDB...');
        
        db = new Database(DB_PATH);
        connection = db.connect();
        
        // Check if data exists, if not create sample data
        connection.all("SELECT name FROM sqlite_master WHERE type='table' AND name='ecommerce_sales'", (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (rows.length === 0) {
                console.log('📊 Creating sample data...');
                createSampleData().then(resolve).catch(reject);
            } else {
                console.log('✅ Using existing data');
                resolve();
            }
        });
    });
}

// Create sample e-commerce data
function createSampleData() {
    return new Promise((resolve, reject) => {
        // Generate sample data
        const sampleData = generateEcommerceData(1000);
        
        // Create table and insert data
        const createTableSQL = `
            CREATE TABLE ecommerce_sales (
                order_id INTEGER,
                customer_id VARCHAR,
                product_category VARCHAR,
                product_name VARCHAR,
                quantity INTEGER,
                unit_price DECIMAL(10,2),
                total_amount DECIMAL(10,2),
                order_date DATE,
                customer_age INTEGER,
                customer_city VARCHAR,
                customer_state VARCHAR
            )
        `;
        
        connection.run(createTableSQL, (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Insert sample data in batches
            const insertSQL = `
                INSERT INTO ecommerce_sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            let inserted = 0;
            const batchSize = 100;
            
            function insertBatch(startIndex) {
                const batch = sampleData.slice(startIndex, startIndex + batchSize);
                if (batch.length === 0) {
                    console.log(`✅ Inserted ${inserted} sample records`);
                    resolve();
                    return;
                }
                
                const stmt = connection.prepare(insertSQL);
                batch.forEach(row => {
                    stmt.run([
                        row.order_id, row.customer_id, row.product_category,
                        row.product_name, row.quantity, row.unit_price,
                        row.total_amount, row.order_date, row.customer_age,
                        row.customer_city, row.customer_state
                    ]);
                    inserted++;
                });
                stmt.finalize();
                
                // Insert next batch
                setTimeout(() => insertBatch(startIndex + batchSize), 10);
            }
            
            insertBatch(0);
        });
    });
}

// Generate realistic e-commerce data
function generateEcommerceData(count) {
    const categories = ['Electronics', 'Books', 'Clothing', 'Home & Garden', 'Sports', 'Toys', 'Beauty', 'Automotive'];
    const products = {
        'Electronics': ['Laptop', 'Smartphone', 'Tablet', 'Headphones', 'Smart Watch', 'Camera'],
        'Books': ['JavaScript Guide', 'Data Science Handbook', 'Novel', 'Cookbook', 'Biography'],
        'Clothing': ['T-Shirt', 'Jeans', 'Sweater', 'Dress', 'Shoes', 'Hat'],
        'Home & Garden': ['Coffee Maker', 'Blender', 'Vacuum', 'Plant Pot', 'Lamp'],
        'Sports': ['Running Shoes', 'Yoga Mat', 'Dumbbells', 'Tennis Racket', 'Basketball'],
        'Toys': ['Board Game', 'Puzzle', 'Action Figure', 'Doll', 'LEGO Set'],
        'Beauty': ['Shampoo', 'Moisturizer', 'Lipstick', 'Perfume', 'Face Mask'],
        'Automotive': ['Car Phone Mount', 'Floor Mats', 'Air Freshener', 'Car Charger']
    };
    
    const cities = ['San Francisco', 'New York', 'Austin', 'Seattle', 'Denver', 'Boston', 'Miami', 'Chicago', 'Phoenix', 'Portland'];
    const states = ['CA', 'NY', 'TX', 'WA', 'CO', 'MA', 'FL', 'IL', 'AZ', 'OR'];
    
    const data = [];
    
    for (let i = 0; i < count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const productList = products[category];
        const product = productList[Math.floor(Math.random() * productList.length)];
        const cityIndex = Math.floor(Math.random() * cities.length);
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = Math.round((Math.random() * 500 + 10) * 100) / 100;
        
        data.push({
            order_id: 1000 + i,
            customer_id: `CUST_${String(Math.floor(Math.random() * 500) + 1).padStart(3, '0')}`,
            product_category: category,
            product_name: product,
            quantity: quantity,
            unit_price: unitPrice,
            total_amount: Math.round(quantity * unitPrice * 100) / 100,
            order_date: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            customer_age: Math.floor(Math.random() * 60) + 18,
            customer_city: cities[cityIndex],
            customer_state: states[cityIndex]
        });
    }
    
    return data;
}

// Execute SQL query
function executeQuery(sql) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        connection.all(sql, (err, rows) => {
            if (err) {
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

// Create Express API
function createAPI() {
    const app = express();
    
    app.use(cors());
    app.use(express.json());
    
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', service: 'query-engine-demo' });
    });
    
    // Data source health
    app.get('/api/health', (req, res) => {
        res.json({
            'demo-duckdb': {
                status: 'healthy',
                details: {
                    connected: true,
                    databasePath: DB_PATH
                }
            }
        });
    });
    
    // Execute query
    app.post('/api/query', async (req, res) => {
        try {
            const { sql, dataSourceId } = req.body;
            
            if (dataSourceId !== 'demo-duckdb') {
                return res.status(400).json({ error: 'Invalid data source' });
            }
            
            console.log(`📊 Executing query: ${sql.substring(0, 100)}...`);
            
            const result = await executeQuery(sql);
            
            console.log(`✅ Query completed in ${result.metadata.executionTime}ms, ${result.rows.length} rows`);
            
            res.json(result);
            
        } catch (error) {
            console.error('❌ Query failed:', error.message);
            res.status(500).json({ error: error.message });
        }
    });
    
    return app;
}

// Start the demo
async function startDemo() {
    try {
        console.log('🚀 Starting Live Analytics Demo...\n');
        
        // Initialize DuckDB
        await initializeDuckDB();
        
        // Create and start API
        const app = createAPI();
        app.listen(PORT, () => {
            console.log(`\n✅ Demo API running on http://localhost:${PORT}`);
            console.log(`🦆 DuckDB database: ${DB_PATH}`);
            console.log(`\n🌟 Open demo/live-demo.html in your browser to see live data!`);
            console.log(`\nAPI Endpoints:`);
            console.log(`  - GET  http://localhost:${PORT}/health`);
            console.log(`  - GET  http://localhost:${PORT}/api/health`);
            console.log(`  - POST http://localhost:${PORT}/api/query`);
            
            // Open the demo page
            const { exec } = require('child_process');
            const demoPath = path.join(__dirname, '..', 'demo', 'live-demo.html');
            exec(`open "${demoPath}"`, (error) => {
                if (error) {
                    console.log(`\n📝 Manually open: ${demoPath}`);
                } else {
                    console.log(`\n🎉 Demo page opened in browser!`);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to start demo:', error);
        process.exit(1);
    }
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down demo...');
    if (connection) connection.close();
    if (db) db.close();
    process.exit(0);
});

// Start if called directly
if (require.main === module) {
    startDemo();
}

module.exports = { startDemo, executeQuery }; 