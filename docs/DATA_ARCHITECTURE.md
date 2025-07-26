# 🗄️ DaaS Platform Data Architecture

## 📍 **Current Data Storage Locations**

### **1. Local File System Storage**
```
/Users/nmirson/Repos/dashboarding-embedded-app/
├── data/                           ← Main data directory
│   ├── demo.duckdb                ← DuckDB database file (created on demand)
│   └── ecommerce_sales.csv        ← Generated CSV data (created on demand)
├── scripts/
│   ├── start-live-demo.js         ← DuckDB server + data generator
│   └── load-kaggle-data.ts        ← CSV data generation logic
└── demo/
    └── full-embedded-dashboard.html ← In-memory simulated data
```

### **2. Data Generation Flow**

#### **Step 1: Data Creation**
```javascript
// scripts/start-live-demo.js:14-21
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'demo.duckdb');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
```

#### **Step 2: DuckDB Initialization**
```javascript
// scripts/start-live-demo.js:27-49
function initializeDuckDB() {
    db = new Database(DB_PATH);  // Creates/opens demo.duckdb file
    connection = db.connect();
    
    // Check if ecommerce_sales table exists
    connection.all("SELECT name FROM sqlite_master WHERE type='table'...", callback);
}
```

#### **Step 3: Sample Data Generation**
```javascript
// scripts/start-live-demo.js:119-160
function generateEcommerceData(count) {
    // Creates 1000 realistic e-commerce records
    const categories = ['Electronics', 'Books', 'Clothing', ...];
    const products = { Electronics: ['Laptop', 'Smartphone', ...] };
    
    // Returns array of order objects with:
    // - order_id, customer_id, product_category
    // - product_name, quantity, unit_price, total_amount
    // - order_date, customer_age, customer_city, customer_state
}
```

## 🔄 **Data Transformation Pipeline**

### **1. Raw Data → DuckDB Tables**

```sql
-- Table Creation (scripts/start-live-demo.js:59-73)
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
```

### **2. DuckDB → Analytics Queries**

```sql
-- Query 1: Sales by Category
SELECT 
    product_category,
    SUM(total_amount) as revenue,
    COUNT(*) as orders,
    ROUND(SUM(total_amount) * 100.0 / total, 1) as percentage
FROM ecommerce_sales 
GROUP BY product_category 
ORDER BY revenue DESC

-- Query 2: Monthly Revenue Trends  
SELECT 
    strftime(order_date, '%Y-%m') as month,
    SUM(total_amount) as revenue,
    COUNT(*) as orders
FROM ecommerce_sales 
GROUP BY month
ORDER BY month

-- Query 3: Customer Demographics
SELECT 
    CASE 
        WHEN customer_age < 25 THEN '18-24'
        WHEN customer_age < 35 THEN '25-34'
        WHEN customer_age < 45 THEN '35-44'
        WHEN customer_age < 55 THEN '45-54'
        ELSE '55+'
    END as age_group,
    COUNT(DISTINCT customer_id) as customer_count
FROM ecommerce_sales 
GROUP BY age_group
```

### **3. Query Results → Chart Data**

```javascript
// Data transformation for Chart.js
const chartData = {
    labels: queryResult.rows.map(row => row.product_category),
    datasets: [{
        data: queryResult.rows.map(row => row.revenue),
        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', ...]
    }]
};
```

## 🏗️ **Current vs Production Architecture**

### **Current Demo Architecture:**
```
Frontend (HTML/JS)
    ↓ (simulated API calls)
JavaScript Data Objects ← Generated realistic data
    ↓ (Chart.js rendering)
Interactive Charts
```

### **Production Architecture:**
```
Frontend (React/SDK)
    ↓ (HTTP/WebSocket)
Query Engine API (Fastify)
    ↓ (SQL execution)
DuckDB Connector
    ↓ (file I/O)
Local DuckDB Files (.duckdb)
    ↓ (data loading)
CSV/Parquet/JSON Sources
```

## 📊 **Data Storage Types & Locations**

### **1. Persistent Storage (File System)**
- **Location**: `/data/demo.duckdb`
- **Type**: DuckDB database file
- **Size**: ~2-5MB for 1000+ records
- **Persistence**: Survives server restarts
- **Access**: SQL queries via DuckDB connector

### **2. Memory Storage (Runtime)**
- **Location**: Node.js process memory
- **Type**: JavaScript objects/arrays
- **Size**: ~1-2MB serialized JSON
- **Persistence**: Lost on page refresh
- **Access**: Direct object property access

### **3. Cache Storage (Redis - Planned)**
- **Location**: Redis server (localhost:6379)
- **Type**: Query result caching
- **Size**: Configurable TTL
- **Persistence**: Configurable
- **Access**: Key-value lookups

## 🔍 **Query Execution Flow**

### **Real DuckDB Flow:**
```
1. Client Request → /api/query
2. Query Engine validates SQL
3. DuckDB Connector executes query
4. Results formatted as JSON
5. HTTP response with data + metadata
```

### **Demo Simulation Flow:**
```
1. Button Click → simulateLoading()
2. JavaScript generates realistic data
3. Chart.js renders visualizations
4. Performance metrics simulated
5. UI updates with "query results"
```

## 💾 **Data Persistence Strategies**

### **1. File-based (Current)**
```javascript
// DuckDB file storage
const DB_PATH = path.join(DATA_DIR, 'demo.duckdb');
db = new Database(DB_PATH);  // Persistent across restarts
```

### **2. Memory-based (Fast)**
```javascript
// In-memory DuckDB
db = new Database(':memory:');  // Lost on restart, faster queries
```

### **3. Hybrid (Recommended)**
```javascript
// Memory + periodic file sync
db = new Database(':memory:');
setInterval(() => db.backup('demo.duckdb'), 300000); // 5min backups
```

## 🔧 **How to Access Real Data**

### **Start DuckDB Server:**
```bash
# Install dependencies
cd demo/standalone && npm install

# Start DuckDB server with data generation
node ../../scripts/start-live-demo.js

# Server starts on http://localhost:3001
# Creates /data/demo.duckdb with 1000+ records
```

### **Query Real Data:**
```bash
# Test API endpoint
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT product_category, SUM(total_amount) as revenue FROM ecommerce_sales GROUP BY product_category",
    "dataSourceId": "demo-duckdb"
  }'
```

### **Browse Database:**
```bash
# Install DuckDB CLI
brew install duckdb

# Connect to database
duckdb data/demo.duckdb

# Run queries
.tables
SELECT COUNT(*) FROM ecommerce_sales;
DESCRIBE ecommerce_sales;
```

## 🎯 **Next Steps for Full Integration**

1. **Connect Frontend to Real API**: Replace simulated data with actual HTTP calls
2. **Add Redis Caching**: Cache frequent query results
3. **Implement CSV Loading**: Load external datasets via API
4. **Add Real-time Updates**: WebSocket connections for live data
5. **Database Migrations**: Proper schema versioning and updates