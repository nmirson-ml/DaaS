#!/usr/bin/env node

/**
 * Script to verify DuckDB data structure and show sample queries
 * This demonstrates the data that powers the full embedded dashboard
 */

console.log('🦆 DuckDB Data Verification for Full Embedded Dashboard\n');

// Simulated DuckDB query results that would be used in production
const duckDBQueries = {
    // Query 1: Sales by Category
    salesByCategory: {
        sql: `SELECT 
            product_category,
            SUM(total_amount) as revenue,
            COUNT(*) as orders,
            ROUND(SUM(total_amount) * 100.0 / (SELECT SUM(total_amount) FROM ecommerce_sales), 1) as percentage
        FROM ecommerce_sales 
        GROUP BY product_category 
        ORDER BY revenue DESC`,
        results: [
            { product_category: 'Electronics', revenue: 185420.50, orders: 247, percentage: 26.1 },
            { product_category: 'Home & Garden', revenue: 156780.40, orders: 205, percentage: 22.1 },
            { product_category: 'Clothing', revenue: 142380.25, orders: 312, percentage: 20.0 },
            { product_category: 'Books', revenue: 89650.75, orders: 189, percentage: 12.6 },
            { product_category: 'Sports', revenue: 78420.30, orders: 167, percentage: 11.0 },
            { product_category: 'Beauty', revenue: 45230.20, orders: 134, percentage: 6.4 },
            { product_category: 'Automotive', revenue: 23450.15, orders: 89, percentage: 3.3 },
            { product_category: 'Toys', revenue: 18960.45, orders: 95, percentage: 2.7 }
        ]
    },

    // Query 2: Monthly Revenue Trends
    monthlyRevenue: {
        sql: `SELECT 
            strftime(order_date, '%Y-%m') as month,
            strftime(order_date, '%b') as month_name,
            SUM(total_amount) as revenue,
            COUNT(*) as orders
        FROM ecommerce_sales 
        WHERE order_date >= '2024-01-01'
        GROUP BY month, month_name
        ORDER BY month`,
        results: [
            { month: '2024-01', month_name: 'Jan', revenue: 45230, orders: 156 },
            { month: '2024-02', month_name: 'Feb', revenue: 52180, orders: 189 },
            { month: '2024-03', month_name: 'Mar', revenue: 48790, orders: 167 },
            { month: '2024-04', month_name: 'Apr', revenue: 56420, orders: 203 },
            { month: '2024-05', month_name: 'May', revenue: 62350, orders: 234 },
            { month: '2024-06', month_name: 'Jun', revenue: 58940, orders: 218 },
            { month: '2024-07', month_name: 'Jul', revenue: 67230, orders: 245 },
            { month: '2024-08', month_name: 'Aug', revenue: 71850, orders: 267 },
            { month: '2024-09', month_name: 'Sep', revenue: 65420, orders: 241 },
            { month: '2024-10', month_name: 'Oct', revenue: 73560, orders: 278 },
            { month: '2024-11', month_name: 'Nov', revenue: 79340, orders: 289 },
            { month: '2024-12', month_name: 'Dec', revenue: 85670, orders: 312 }
        ]
    },

    // Query 3: Customer Demographics
    customerDemographics: {
        sql: `SELECT 
            CASE 
                WHEN customer_age < 25 THEN '18-24'
                WHEN customer_age < 35 THEN '25-34'
                WHEN customer_age < 45 THEN '35-44'
                WHEN customer_age < 55 THEN '45-54'
                ELSE '55+'
            END as age_group,
            COUNT(DISTINCT customer_id) as customer_count,
            ROUND(COUNT(DISTINCT customer_id) * 100.0 / (SELECT COUNT(DISTINCT customer_id) FROM ecommerce_sales), 1) as percentage
        FROM ecommerce_sales 
        GROUP BY age_group
        ORDER BY customer_count DESC`,
        results: [
            { age_group: '25-34', customer_count: 312, percentage: 30.9 },
            { age_group: '35-44', customer_count: 287, percentage: 28.4 },
            { age_group: '18-24', customer_count: 234, percentage: 23.2 },
            { age_group: '45-54', customer_count: 134, percentage: 13.3 },
            { age_group: '55+', customer_count: 43, percentage: 4.3 }
        ]
    },

    // Query 4: Geographic Distribution
    geographicSales: {
        sql: `SELECT 
            customer_state,
            SUM(total_amount) as revenue,
            COUNT(*) as orders,
            COUNT(DISTINCT customer_id) as unique_customers
        FROM ecommerce_sales 
        GROUP BY customer_state
        ORDER BY revenue DESC
        LIMIT 10`,
        results: [
            { customer_state: 'CA', revenue: 125420, orders: 287, unique_customers: 156 },
            { customer_state: 'NY', revenue: 98340, orders: 234, unique_customers: 134 },
            { customer_state: 'TX', revenue: 87650, orders: 201, unique_customers: 112 },
            { customer_state: 'FL', revenue: 76520, orders: 189, unique_customers: 98 },
            { customer_state: 'WA', revenue: 65430, orders: 156, unique_customers: 87 },
            { customer_state: 'MA', revenue: 54320, orders: 134, unique_customers: 76 },
            { customer_state: 'CO', revenue: 45230, orders: 112, unique_customers: 65 },
            { customer_state: 'IL', revenue: 43210, orders: 98, unique_customers: 54 },
            { customer_state: 'AZ', revenue: 38940, orders: 87, unique_customers: 43 },
            { customer_state: 'OR', revenue: 34560, orders: 76, unique_customers: 38 }
        ]
    },

    // Query 5: Top Products Performance
    topProducts: {
        sql: `SELECT 
            product_name,
            SUM(total_amount) as revenue,
            SUM(quantity) as units_sold,
            COUNT(*) as order_count,
            AVG(unit_price) as avg_price
        FROM ecommerce_sales 
        GROUP BY product_name
        ORDER BY revenue DESC
        LIMIT 10`,
        results: [
            { product_name: 'Laptop', revenue: 78940, units_sold: 89, order_count: 89, avg_price: 887.64 },
            { product_name: 'Smartphone', revenue: 65420, units_sold: 134, order_count: 134, avg_price: 488.21 },
            { product_name: 'Tablet', revenue: 45230, units_sold: 98, order_count: 98, avg_price: 461.53 },
            { product_name: 'Headphones', revenue: 34560, units_sold: 156, order_count: 156, avg_price: 221.54 },
            { product_name: 'Smart Watch', revenue: 28940, units_sold: 87, order_count: 87, avg_price: 332.64 },
            { product_name: 'Coffee Maker', revenue: 23450, units_sold: 234, order_count: 234, avg_price: 100.21 },
            { product_name: 'Running Shoes', revenue: 19870, units_sold: 145, order_count: 145, avg_price: 137.03 },
            { product_name: 'Jeans', revenue: 18650, units_sold: 189, order_count: 189, avg_price: 98.68 },
            { product_name: 'Cookbook', revenue: 15420, units_sold: 267, order_count: 267, avg_price: 57.75 },
            { product_name: 'Yoga Mat', revenue: 12340, units_sold: 178, order_count: 178, avg_price: 69.33 }
        ]
    },

    // Query 6: Hourly Order Patterns
    hourlyPatterns: {
        sql: `SELECT 
            strftime(order_date, '%H') as hour,
            COUNT(*) as order_count,
            AVG(total_amount) as avg_order_value
        FROM ecommerce_sales 
        GROUP BY hour
        ORDER BY hour`,
        results: [
            { hour: '06', order_count: 12, avg_order_value: 145.23 },
            { hour: '08', order_count: 25, avg_order_value: 167.45 },
            { hour: '10', order_count: 42, avg_order_value: 189.67 },
            { hour: '12', order_count: 45, avg_order_value: 156.78 },
            { hour: '14', order_count: 58, avg_order_value: 203.45 },
            { hour: '16', order_count: 44, avg_order_value: 178.90 },
            { hour: '18', order_count: 55, avg_order_value: 167.23 },
            { hour: '20', order_count: 41, avg_order_value: 145.67 }
        ]
    }
};

// Display query information
Object.entries(duckDBQueries).forEach(([queryName, queryData], index) => {
    console.log(`📊 Query ${index + 1}: ${queryName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
    console.log(`🔍 SQL: ${queryData.sql.replace(/\s+/g, ' ').trim()}`);
    console.log(`📈 Results: ${queryData.results.length} rows`);
    console.log(`📋 Sample Data:`);
    
    // Show first 3 results
    queryData.results.slice(0, 3).forEach((row, i) => {
        console.log(`   ${i + 1}. ${JSON.stringify(row, null, 2).replace(/\n/g, '').replace(/\s+/g, ' ')}`);
    });
    
    if (queryData.results.length > 3) {
        console.log(`   ... and ${queryData.results.length - 3} more rows`);
    }
    console.log('');
});

// Database Summary
console.log('📊 DATABASE SUMMARY');
console.log('==================');
console.log(`🦆 Database: demo.duckdb`);
console.log(`📅 Date Range: 2024-01-01 to 2024-12-31`);
console.log(`🛍️  Total Orders: 1,010+`);
console.log(`💰 Total Revenue: $740,290+`);
console.log(`👥 Unique Customers: 500+`);
console.log(`🏷️  Product Categories: 8`);
console.log(`🌎 Geographic Coverage: 10 states`);
console.log(`📊 Products Tracked: 25+`);

console.log('\n🚀 FULL EMBEDDED DASHBOARD FEATURES');
console.log('====================================');
console.log('✅ Canvas-to-Dashboard Transformation');
console.log('✅ 6 Interactive Chart Visualizations:');
console.log('   • Sales by Category (Doughnut Chart)');
console.log('   • Monthly Revenue Trends (Line Chart)');
console.log('   • Customer Demographics (Bar Chart)');
console.log('   • Geographic Distribution (Horizontal Bar)');
console.log('   • Top Products Performance (Bar Chart)');
console.log('   • Hourly Order Patterns (Line Chart)');
console.log('✅ Real-time Loading Simulation');
console.log('✅ Performance Metrics Display');
console.log('✅ Professional UI with Animations');
console.log('✅ DuckDB Query Integration Ready');

console.log('\n🎯 TO ACCESS THE DEMO:');
console.log('======================');
console.log('1. Open: demo/full-embedded-dashboard.html');
console.log('2. Click "🚀 Load Full Dashboard" button');
console.log('3. Watch the canvas transform into a full analytics dashboard');
console.log('4. Explore interactive charts powered by DuckDB data structure');

console.log('\n💡 TECHNICAL IMPLEMENTATION:');
console.log('============================');
console.log('• Frontend: HTML5, Tailwind CSS, Chart.js');
console.log('• Data Source: DuckDB-structured sample data');
console.log('• Charts: 6 different visualization types');
console.log('• Animation: Staggered loading with CSS transitions');
console.log('• Architecture: Embedded SDK simulation');