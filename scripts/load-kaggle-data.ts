#!/usr/bin/env tsx

/**
 * Script to download a Kaggle dataset and load it into DuckDB
 * for demonstration purposes
 */

import * as fs from 'fs'
import * as path from 'path'
import { QueryService } from '../services/query-engine/src/services/query.service'
import { DuckDBConnector } from '../services/query-engine/src/connectors/duckdb.connector'

async function downloadDataset() {
  console.log('📂 Setting up demo dataset...')
  
  // Create data directory
  const dataDir = path.join(__dirname, '../data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // For demo, we'll create a sample e-commerce dataset
  const sampleData = [
    // E-commerce sales data
    {
      order_id: 1001,
      customer_id: 'CUST_001',
      product_category: 'Electronics',
      product_name: 'Laptop',
      quantity: 1,
      unit_price: 899.99,
      total_amount: 899.99,
      order_date: '2024-01-15',
      customer_age: 32,
      customer_city: 'San Francisco',
      customer_state: 'CA'
    },
    {
      order_id: 1002,
      customer_id: 'CUST_002',
      product_category: 'Books',
      product_name: 'JavaScript Guide',
      quantity: 2,
      unit_price: 29.99,
      total_amount: 59.98,
      order_date: '2024-01-16',
      customer_age: 28,
      customer_city: 'New York',
      customer_state: 'NY'
    },
    {
      order_id: 1003,
      customer_id: 'CUST_003',
      product_category: 'Clothing',
      product_name: 'T-Shirt',
      quantity: 3,
      unit_price: 19.99,
      total_amount: 59.97,
      order_date: '2024-01-17',
      customer_age: 25,
      customer_city: 'Austin',
      customer_state: 'TX'
    },
    {
      order_id: 1004,
      customer_id: 'CUST_001',
      product_category: 'Electronics',
      product_name: 'Headphones',
      quantity: 1,
      unit_price: 149.99,
      total_amount: 149.99,
      order_date: '2024-01-18',
      customer_age: 32,
      customer_city: 'San Francisco',
      customer_state: 'CA'
    },
    {
      order_id: 1005,
      customer_id: 'CUST_004',
      product_category: 'Home & Garden',
      product_name: 'Coffee Maker',
      quantity: 1,
      unit_price: 79.99,
      total_amount: 79.99,
      order_date: '2024-01-19',
      customer_age: 45,
      customer_city: 'Seattle',
      customer_state: 'WA'
    },
    {
      order_id: 1006,
      customer_id: 'CUST_005',
      product_category: 'Sports',
      product_name: 'Running Shoes',
      quantity: 1,
      unit_price: 119.99,
      total_amount: 119.99,
      order_date: '2024-01-20',
      customer_age: 29,
      customer_city: 'Denver',
      customer_state: 'CO'
    },
    {
      order_id: 1007,
      customer_id: 'CUST_002',
      product_category: 'Electronics',
      product_name: 'Smartphone',
      quantity: 1,
      unit_price: 699.99,
      total_amount: 699.99,
      order_date: '2024-01-21',
      customer_age: 28,
      customer_city: 'New York',
      customer_state: 'NY'
    },
    {
      order_id: 1008,
      customer_id: 'CUST_006',
      product_category: 'Books',
      product_name: 'Data Science Handbook',
      quantity: 1,
      unit_price: 49.99,
      total_amount: 49.99,
      order_date: '2024-01-22',
      customer_age: 35,
      customer_city: 'Boston',
      customer_state: 'MA'
    },
    {
      order_id: 1009,
      customer_id: 'CUST_003',
      product_category: 'Clothing',
      product_name: 'Jeans',
      quantity: 2,
      unit_price: 59.99,
      total_amount: 119.98,
      order_date: '2024-01-23',
      customer_age: 25,
      customer_city: 'Austin',
      customer_state: 'TX'
    },
    {
      order_id: 1010,
      customer_id: 'CUST_007',
      product_category: 'Home & Garden',
      product_name: 'Blender',
      quantity: 1,
      unit_price: 89.99,
      total_amount: 89.99,
      order_date: '2024-01-24',
      customer_age: 38,
      customer_city: 'Miami',
      customer_state: 'FL'
    }
  ]

  // Generate more data for demonstration
  const expandedData = []
  const cities = ['San Francisco', 'New York', 'Austin', 'Seattle', 'Denver', 'Boston', 'Miami', 'Chicago', 'Phoenix', 'Portland']
  const states = ['CA', 'NY', 'TX', 'WA', 'CO', 'MA', 'FL', 'IL', 'AZ', 'OR']
  const categories = ['Electronics', 'Books', 'Clothing', 'Home & Garden', 'Sports', 'Toys', 'Beauty', 'Automotive']
  const products = {
    'Electronics': ['Laptop', 'Smartphone', 'Tablet', 'Headphones', 'Smart Watch', 'Camera'],
    'Books': ['JavaScript Guide', 'Data Science Handbook', 'Novel', 'Cookbook', 'Biography'],
    'Clothing': ['T-Shirt', 'Jeans', 'Sweater', 'Dress', 'Shoes', 'Hat'],
    'Home & Garden': ['Coffee Maker', 'Blender', 'Vacuum', 'Plant Pot', 'Lamp'],
    'Sports': ['Running Shoes', 'Yoga Mat', 'Dumbbells', 'Tennis Racket', 'Basketball'],
    'Toys': ['Board Game', 'Puzzle', 'Action Figure', 'Doll', 'LEGO Set'],
    'Beauty': ['Shampoo', 'Moisturizer', 'Lipstick', 'Perfume', 'Face Mask'],
    'Automotive': ['Car Phone Mount', 'Floor Mats', 'Air Freshener', 'Car Charger']
  }

  // Generate 1000 records
  for (let i = 0; i < 1000; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const productList = products[category as keyof typeof products]
    const product = productList[Math.floor(Math.random() * productList.length)]
    const cityIndex = Math.floor(Math.random() * cities.length)
    
    expandedData.push({
      order_id: 2000 + i,
      customer_id: `CUST_${String(Math.floor(Math.random() * 500) + 1).padStart(3, '0')}`,
      product_category: category,
      product_name: product,
      quantity: Math.floor(Math.random() * 5) + 1,
      unit_price: Math.round((Math.random() * 500 + 10) * 100) / 100,
      total_amount: 0, // Will calculate below
      order_date: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      customer_age: Math.floor(Math.random() * 60) + 18,
      customer_city: cities[cityIndex],
      customer_state: states[cityIndex]
    })
  }

  // Calculate total amounts
  expandedData.forEach(record => {
    record.total_amount = Math.round(record.quantity * record.unit_price * 100) / 100
  })

  // Combine sample and expanded data
  const allData = [...sampleData, ...expandedData]

  // Convert to CSV
  const headers = Object.keys(allData[0])
  const csvContent = [
    headers.join(','),
    ...allData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        return typeof value === 'string' ? `"${value}"` : value
      }).join(',')
    )
  ].join('\n')

  // Write CSV file
  const csvPath = path.join(dataDir, 'ecommerce_sales.csv')
  fs.writeFileSync(csvPath, csvContent)

  console.log(`✅ Generated sample dataset: ${csvPath}`)
  console.log(`📊 Records: ${allData.length}`)
  
  return csvPath
}

async function setupDuckDB(csvPath: string) {
  console.log('🦆 Setting up DuckDB with sample data...')
  
  // Initialize query service
  const queryService = new QueryService()
  
  // Register DuckDB data source
  await queryService.registerDataSource('demo-duckdb', {
    type: 'duckdb',
    databasePath: path.join(__dirname, '../data/demo.duckdb'),
    name: 'Demo DuckDB Database'
  })

  // Get DuckDB connector for direct data loading
  const connector = queryService.getConnector('demo-duckdb') as DuckDBConnector
  if (!connector) {
    throw new Error('Failed to get DuckDB connector')
  }

  // Load CSV data
  await connector.loadCSV('ecommerce_sales', csvPath, {
    header: true,
    delimiter: ','
  })

  console.log('✅ Data loaded into DuckDB')

  // Test some queries
  console.log('\n📈 Testing sample queries...')

  // Query 1: Sales by category
  const categoryQuery = `
    SELECT 
      product_category,
      COUNT(*) as order_count,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value
    FROM ecommerce_sales 
    GROUP BY product_category 
    ORDER BY total_revenue DESC
  `

  const categoryResult = await queryService.executeQuery({
    dataSourceId: 'demo-duckdb',
    sql: categoryQuery
  })

  console.log('\n🏷️  Sales by Category:')
  console.table(categoryResult.rows)

  // Query 2: Monthly trends
  const monthlyQuery = `
    SELECT 
      strftime(order_date, '%Y-%m') as month,
      COUNT(*) as orders,
      SUM(total_amount) as revenue
    FROM ecommerce_sales 
    GROUP BY strftime(order_date, '%Y-%m')
    ORDER BY month
  `

  const monthlyResult = await queryService.executeQuery({
    dataSourceId: 'demo-duckdb',
    sql: monthlyQuery
  })

  console.log('\n📅 Monthly Sales Trends:')
  console.table(monthlyResult.rows)

  // Query 3: Top customers
  const customersQuery = `
    SELECT 
      customer_id,
      customer_city,
      customer_state,
      COUNT(*) as order_count,
      SUM(total_amount) as total_spent
    FROM ecommerce_sales 
    GROUP BY customer_id, customer_city, customer_state
    ORDER BY total_spent DESC
    LIMIT 10
  `

  const customersResult = await queryService.executeQuery({
    dataSourceId: 'demo-duckdb',
    sql: customersQuery
  })

  console.log('\n👥 Top Customers:')
  console.table(customersResult.rows)

  console.log('\n🎉 DuckDB setup complete!')
  console.log('\n🚀 You can now use this data source in your dashboard builder!')
  console.log('\nData source ID: demo-duckdb')
  console.log('Database path:', path.join(__dirname, '../data/demo.duckdb'))

  return queryService
}

async function main() {
  try {
    console.log('🚀 Setting up Kaggle-like demo dataset for Analytics Platform\n')

    // Download/generate dataset
    const csvPath = await downloadDataset()

    // Setup DuckDB
    const queryService = await setupDuckDB(csvPath)

    console.log('\n✨ Demo setup complete!')
    console.log('\nNext steps:')
    console.log('1. Start the query engine service: npm run dev:query')
    console.log('2. Start the dashboard service: npm run dev:dashboard')
    console.log('3. Start the dashboard builder: npm run dev:app')
    console.log('4. Create beautiful charts with your data!')

  } catch (error) {
    console.error('❌ Error setting up demo:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
} 