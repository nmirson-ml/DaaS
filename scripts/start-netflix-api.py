#!/usr/bin/env python3

"""
Netflix Analytics API - Python FastAPI + DuckDB
Real implementation of our DaaS query engine for testing services
"""

import json
import duckdb
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# Create Flask app
app = Flask(__name__)
CORS(app)

# Global database connection
db_conn = None

def get_db_connection():
    """Get or create DuckDB connection"""
    global db_conn
    if db_conn is None:
        project_root = Path(__file__).parent.parent
        db_path = project_root / "data" / "netflix.duckdb"
        
        if not db_path.exists():
            raise Exception(f"Netflix database not found: {db_path}")
        
        db_conn = duckdb.connect(str(db_path))
        print(f"✅ Connected to Netflix database: {db_path}")
    
    return db_conn

def execute_query_with_metrics(sql):
    """Execute SQL query and return results with performance metrics"""
    start_time = datetime.now()
    
    try:
        conn = get_db_connection()
        result = conn.execute(sql).fetchall()
        
        # Get column names
        columns = [desc[0] for desc in conn.description] if conn.description else []
        
        # Convert to list of dictionaries
        rows = [dict(zip(columns, row)) for row in result]
        
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds() * 1000  # milliseconds
        
        return {
            'rows': rows,
            'columns': [{'name': col, 'type': 'string', 'nullable': True} for col in columns],
            'metadata': {
                'executionTime': round(execution_time, 2),
                'rowCount': len(rows),
                'dataScanned': 0,
                'cached': False
            }
        }
        
    except Exception as e:
        raise Exception(f"Query execution failed: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'netflix-analytics-api',
        'database': 'netflix.duckdb',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def api_health():
    """Data source health check"""
    try:
        conn = get_db_connection()
        # Test query
        result = conn.execute("SELECT COUNT(*) as count FROM netflix_shows").fetchone()
        record_count = result[0]
        
        return jsonify({
            'netflix-duckdb': {
                'status': 'healthy',
                'details': {
                    'connected': True,
                    'recordCount': record_count,
                    'tableExists': True
                }
            }
        })
    except Exception as e:
        return jsonify({
            'netflix-duckdb': {
                'status': 'unhealthy',
                'details': {
                    'error': str(e)
                }
            }
        }), 500

@app.route('/api/query', methods=['POST'])
def execute_query():
    """Generic query execution endpoint"""
    try:
        data = request.get_json()
        sql = data.get('sql')
        data_source_id = data.get('dataSourceId')
        
        if not sql:
            return jsonify({'error': 'SQL query is required'}), 400
        
        if data_source_id != 'netflix-duckdb':
            return jsonify({'error': 'Invalid data source. Use "netflix-duckdb"'}), 400
        
        print(f"🔍 Executing query: {sql[:100]}...")
        
        result = execute_query_with_metrics(sql)
        
        print(f"✅ Query completed: {result['metadata']['rowCount']} rows in {result['metadata']['executionTime']}ms")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Query error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/netflix/content-types', methods=['GET'])
def content_types():
    """Get content type distribution"""
    sql = """
        SELECT 
            type,
            COUNT(*) as count,
            ROUND(AVG(imdb_score), 2) as avg_imdb_score,
            ROUND(AVG(runtime), 0) as avg_runtime
        FROM netflix_shows 
        WHERE imdb_score IS NOT NULL
        GROUP BY type
        ORDER BY count DESC
    """
    
    try:
        result = execute_query_with_metrics(sql)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/netflix/top-rated', methods=['GET'])
def top_rated():
    """Get top rated content"""
    limit = request.args.get('limit', 20)
    
    sql = f"""
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
        LIMIT {limit}
    """
    
    try:
        result = execute_query_with_metrics(sql)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/netflix/release-years', methods=['GET'])
def release_years():
    """Get content by release year"""
    sql = """
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
    """
    
    try:
        result = execute_query_with_metrics(sql)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/netflix/age-ratings', methods=['GET'])
def age_ratings():
    """Get content by age rating"""
    sql = """
        SELECT 
            COALESCE(age_certification, 'Not Rated') as age_certification,
            COUNT(*) as content_count,
            ROUND(AVG(imdb_score), 2) as avg_rating,
            ROUND(AVG(runtime), 0) as avg_runtime_minutes
        FROM netflix_shows 
        GROUP BY age_certification
        ORDER BY content_count DESC
    """
    
    try:
        result = execute_query_with_metrics(sql)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/netflix/runtime-distribution', methods=['GET'])
def runtime_distribution():
    """Get runtime distribution"""
    sql = """
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
    """
    
    try:
        result = execute_query_with_metrics(sql)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/netflix/highly-rated', methods=['GET'])
def highly_rated():
    """Get highly rated content"""
    min_score = request.args.get('minScore', 8.0)
    
    sql = f"""
        SELECT 
            title,
            type,
            release_year,
            age_certification,
            runtime,
            imdb_score,
            imdb_votes
        FROM netflix_shows 
        WHERE imdb_score >= {min_score}
        ORDER BY imdb_score DESC, imdb_votes DESC
    """
    
    try:
        result = execute_query_with_metrics(sql)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🎬 Starting Netflix Analytics API Server")
    print("=" * 50)
    
    try:
        # Test database connection
        conn = get_db_connection()
        count_result = conn.execute("SELECT COUNT(*) FROM netflix_shows").fetchone()
        record_count = count_result[0]
        
        print(f"✅ Database connected: {record_count:,} Netflix records loaded")
        print(f"🚀 Starting server on http://localhost:3001")
        print(f"\n📋 Available Endpoints:")
        print(f"  - GET  /health")
        print(f"  - GET  /api/health") 
        print(f"  - POST /api/query")
        print(f"  - GET  /api/netflix/content-types")
        print(f"  - GET  /api/netflix/top-rated?limit=10")
        print(f"  - GET  /api/netflix/release-years")
        print(f"  - GET  /api/netflix/age-ratings")
        print(f"  - GET  /api/netflix/runtime-distribution")
        print(f"  - GET  /api/netflix/highly-rated?minScore=8.5")
        
        print(f"\n🧪 Test Commands:")
        print(f"  curl http://localhost:3001/health")
        print(f"  curl http://localhost:3001/api/netflix/content-types")
        print(f"  curl -X POST http://localhost:3001/api/query \\")
        print(f"    -H 'Content-Type: application/json' \\")
        print(f"    -d '{\"sql\": \"SELECT title, imdb_score FROM netflix_shows WHERE imdb_score > 9.0 ORDER BY imdb_score DESC LIMIT 5\", \"dataSourceId\": \"netflix-duckdb\"}'")
        
        print(f"\n🎉 Real DaaS services ready with Netflix data!")
        
        # Start Flask server
        app.run(host='0.0.0.0', port=3001, debug=False)
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        exit(1)