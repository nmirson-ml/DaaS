#!/usr/bin/env node

/**
 * Setup script to create real DuckDB database with sample data
 * This demonstrates the actual data storage and transformation pipeline
 */

const path = require('path');
const fs = require('fs');

console.log('🚀 Setting up Real DuckDB Data Pipeline\n');

// Check if we can install dependencies
const packageExists = fs.existsSync(path.join(__dirname, '..', 'demo', 'standalone', 'package.json'));
if (!packageExists) {
    console.error('❌ Package.json not found in demo/standalone/');
    console.log('🔧 Please run: cd demo/standalone && npm install');
    process.exit(1);
}

// Create data directory
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'demo.duckdb');
const CSV_PATH = path.join(DATA_DIR, 'ecommerce_sales.csv');

console.log('📁 Creating data directory...');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('✅ Created:', DATA_DIR);
} else {
    console.log('✅ Exists:', DATA_DIR);
}

// Generate CSV data first
console.log('\n📊 Generating realistic e-commerce dataset...');

function generateEcommerceData(count = 1000) {
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
    
    // Generate base records
    for (let i = 0; i < count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const productList = products[category];
        const product = productList[Math.floor(Math.random() * productList.length)];
        const cityIndex = Math.floor(Math.random() * cities.length);
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = Math.round((Math.random() * 500 + 10) * 100) / 100;
        
        // Generate realistic dates throughout 2024
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        const orderDate = `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        data.push({
            order_id: 1000 + i,
            customer_id: `CUST_${String(Math.floor(Math.random() * 500) + 1).padStart(3, '0')}`,
            product_category: category,
            product_name: product,
            quantity: quantity,
            unit_price: unitPrice,
            total_amount: Math.round(quantity * unitPrice * 100) / 100,
            order_date: orderDate,
            customer_age: Math.floor(Math.random() * 60) + 18,
            customer_city: cities[cityIndex],
            customer_state: states[cityIndex]
        });
    }
    
    return data;
}

// Generate data
const records = generateEcommerceData(1000);
console.log(`✅ Generated ${records.length} e-commerce records`);

// Create CSV content
const headers = Object.keys(records[0]);
const csvContent = [
    headers.join(','),
    ...records.map(record => 
        headers.map(header => {
            const value = record[header];
            return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
    )
].join('\n');

// Write CSV file
fs.writeFileSync(CSV_PATH, csvContent);
console.log(`✅ Created CSV file: ${CSV_PATH}`);
console.log(`📊 File size: ${(fs.statSync(CSV_PATH).size / 1024).toFixed(1)} KB`);

// Show data sample
console.log('\n📋 Sample data:');
console.table(records.slice(0, 3));

// Show data statistics
const stats = {
    totalRecords: records.length,
    dateRange: {
        min: records.reduce((min, r) => r.order_date < min ? r.order_date : min, '2024-12-31'),
        max: records.reduce((max, r) => r.order_date > max ? r.order_date : max, '2024-01-01')
    },
    totalRevenue: records.reduce((sum, r) => sum + r.total_amount, 0),
    categories: [...new Set(records.map(r => r.product_category))].length,
    uniqueCustomers: [...new Set(records.map(r => r.customer_id))].length,
    states: [...new Set(records.map(r => r.customer_state))].length
};

console.log('\n📈 Dataset Statistics:');
console.log(`📊 Total Records: ${stats.totalRecords.toLocaleString()}`);
console.log(`📅 Date Range: ${stats.dateRange.min} to ${stats.dateRange.max}`);
console.log(`💰 Total Revenue: $${stats.totalRevenue.toLocaleString()}`);
console.log(`🏷️  Categories: ${stats.categories}`);
console.log(`👥 Unique Customers: ${stats.uniqueCustomers}`);
console.log(`🌎 States: ${stats.states}`);

console.log('\n🦆 DuckDB Setup Instructions:');
console.log('================================');
console.log('1. Install DuckDB dependencies:');
console.log('   cd demo/standalone && npm install');
console.log('');
console.log('2. Start DuckDB server:');
console.log('   node scripts/start-live-demo.js');
console.log('');
console.log('3. The server will:');
console.log('   • Create demo.duckdb from the CSV data');
console.log('   • Start API server on http://localhost:3001');
console.log('   • Provide query endpoints for analytics');
console.log('');
console.log('4. Test queries:');
console.log('   curl -X POST http://localhost:3001/api/query \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"sql": "SELECT COUNT(*) FROM ecommerce_sales", "dataSourceId": "demo-duckdb"}\'');
console.log('');
console.log('5. Browse database directly:');
console.log('   brew install duckdb  # Install DuckDB CLI');
console.log('   duckdb data/demo.duckdb');
console.log('   .tables');
console.log('   SELECT * FROM ecommerce_sales LIMIT 5;');

console.log('\n🎯 Data Flow Summary:');
console.log('====================');
console.log('CSV Generation → DuckDB Loading → Query Engine → Chart Visualization');
console.log('');
console.log('🗂️  Files Created:');
console.log(`   📄 ${CSV_PATH}`);
console.log(`   🗃️  ${DB_PATH} (will be created by start-live-demo.js)`);
console.log('');
console.log('✨ Ready for full embedded dashboard integration!');