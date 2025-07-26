#!/usr/bin/env python3

"""
Simple Netflix Analytics API - Python Flask + DuckDB
"""

import json
import duckdb
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

db_conn = None

def get_db_connection():
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
    start_time = datetime.now()
    
    try:
        conn = get_db_connection()
        result = conn.execute(sql).fetchall()
        
        columns = [desc[0] for desc in conn.description] if conn.description else []
        rows = [dict(zip(columns, row)) for row in result]
        
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds() * 1000
        
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
    return jsonify({
        'status': 'healthy',
        'service': 'netflix-analytics-api',
        'database': 'netflix.duckdb',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/query', methods=['POST'])
def execute_query():
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
    sql = """
        SELECT 
            type,
            COUNT(*) as count,
            ROUND(AVG(imdb_score), 2) as avg_imdb_score
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

if __name__ == '__main__':
    print("🎬 Starting Netflix Analytics API Server")
    print("=" * 50)
    
    try:
        conn = get_db_connection()
        count_result = conn.execute("SELECT COUNT(*) FROM netflix_shows").fetchone()
        record_count = count_result[0]
        
        print(f"✅ Database connected: {record_count:,} Netflix records loaded")
        print(f"🚀 Starting server on http://localhost:3001")
        print(f"\n📋 Available Endpoints:")
        print(f"  - GET  /health")
        print(f"  - POST /api/query") 
        print(f"  - GET  /api/netflix/content-types")
        
        print(f"\n🧪 Test Commands:")
        print(f"  curl http://localhost:3001/health")
        print(f"  curl http://localhost:3001/api/netflix/content-types")
        
        print(f"\n🎉 Real DaaS services ready with Netflix data!")
        
        app.run(host='0.0.0.0', port=3001, debug=False)
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        exit(1)