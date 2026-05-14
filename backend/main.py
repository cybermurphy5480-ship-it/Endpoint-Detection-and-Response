from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
import psycopg2.extras

# ============================================
# FASTAPI APP
# ============================================

app = FastAPI()

# ============================================
# CORS
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# DATABASE CONFIG
# ============================================

DB_CONFIG = {
    "host": "localhost",
    "database": "soclab",
    "user": "postgres",
    "password": "password123"
}

# ============================================
# REQUEST MODEL
# ============================================

class ActionRequest(BaseModel):
    hostname: str
    action: str
    target: str

# ============================================
# DATABASE CONNECTION
# ============================================

def get_connection():
    """Get database connection - keeping original name for compatibility"""
    return psycopg2.connect(**DB_CONFIG)

# ============================================
# ROOT
# ============================================

@app.get("/")
async def root():
    return {
        "message": "SOC/EDR Backend Running"
    }

# ============================================
# GET LOGS
# ============================================

@app.get("/logs")
async def get_logs():
    """Get security logs from database"""
    try:
        conn = get_connection()
        
        # FIXED: Added RealDictCursor
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        query = """
        SELECT
            id,
            timestamp,
            hostname,
            event_code,
            process_name,
            command_line,
            message
        FROM logs
        ORDER BY timestamp DESC
        LIMIT 500
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        logs = []
        for row in rows:
            logs.append({
                "id": row["id"],
                "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None,
                "hostname": row["hostname"],
                "event_code": row["event_code"],
                "process_name": row["process_name"],
                "command_line": row["command_line"],
                "message": row["message"],
                # Frontend compatibility
                "user": row["process_name"],
                "username": row["process_name"]
            })

        cursor.close()
        conn.close()

        # Return in format expected by frontend
        return {
            "total": len(logs),
            "logs": logs
        }

    except Exception as e:
        print(f"Error getting logs: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "total": 0,
            "logs": [],
            "error": str(e)
        }

# ============================================
# GET ENDPOINTS
# ============================================

@app.get("/endpoints")
async def get_endpoints():
    """Get list of endpoints with their status"""
    try:
        conn = get_connection()
        
        # FIXED: Added RealDictCursor
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        query = """
        SELECT
            hostname,
            MAX(timestamp) as last_seen,
            COUNT(*) as total_events
        FROM logs
        WHERE hostname IS NOT NULL
        GROUP BY hostname
        ORDER BY last_seen DESC
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        endpoints = []
        for row in rows:
            # Determine status based on last_seen
            import datetime
            last_seen = row["last_seen"]
            if last_seen:
                time_diff = datetime.datetime.now() - last_seen
                is_online = time_diff.total_seconds() < 300  # 5 minutes
            else:
                is_online = False
            
            endpoints.append({
                "hostname": row["hostname"],
                "last_seen": row["last_seen"].isoformat() if row["last_seen"] else None,
                "total_events": int(row["total_events"]),
                "status": "online" if is_online else "offline"
            })

        cursor.close()
        conn.close()

        # Count active endpoints
        active_count = sum(1 for ep in endpoints if ep["status"] == "online")

        return {
            "endpoints": endpoints,
            "total_count": len(endpoints),
            "active_count": active_count
        }

    except Exception as e:
        print(f"Error getting endpoints: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "endpoints": [],
            "total_count": 0,
            "active_count": 0,
            "error": str(e)
        }

# ============================================
# CREATE ACTION
# ============================================

@app.post("/action")
async def create_action(action: ActionRequest):
    """Create a new action for an endpoint"""
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Create actions table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actions (
                id SERIAL PRIMARY KEY,
                hostname VARCHAR(255) NOT NULL,
                action VARCHAR(50) NOT NULL,
                target VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Insert action
        query = """
        INSERT INTO actions
        (hostname, action, target)
        VALUES (%s, %s, %s)
        RETURNING id
        """

        cursor.execute(query, (
            action.hostname,
            action.action,
            action.target
        ))
        
        action_id = cursor.fetchone()[0]
        conn.commit()

        cursor.close()
        conn.close()

        print(f"[ACTION CREATED] ID: {action_id}, Hostname: {action.hostname}, Action: {action.action}, Target: {action.target}")

        return {
            "status": "success",
            "message": "Action created successfully",
            "action_id": action_id,
            "details": {
                "hostname": action.hostname,
                "action": action.action,
                "target": action.target
            }
        }

    except Exception as e:
        print(f"Error creating action: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "status": "error",
            "message": str(e)
        }

# ============================================
# GET ACTIONS FOR AGENT
# ============================================

@app.get("/actions/{hostname}")
async def get_actions(hostname: str):
    """Get pending actions for a specific hostname (called by agent)"""
    try:
        conn = get_connection()
        
        # FIXED: Added RealDictCursor
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        # Get all actions for this hostname
        query = """
        SELECT
            id,
            action,
            target,
            created_at
        FROM actions
        WHERE hostname = %s
        ORDER BY id ASC
        """

        cursor.execute(query, (hostname,))
        actions = cursor.fetchall()

        print(f"[ACTIONS RETRIEVED] Hostname: {hostname}, Count: {len(actions)}")
        
        # Convert to list of dicts with proper format
        action_list = []
        action_ids = []
        
        for row in actions:
            action_list.append({
                "id": row["id"],
                "action": row["action"],
                "target": row["target"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None
            })
            action_ids.append(row["id"])
            print(f"  - Action {row['id']}: {row['action']} on {row['target']}")

        # Delete retrieved actions so they're not re-executed
        if action_ids:
            delete_query = """
            DELETE FROM actions
            WHERE id = ANY(%s)
            """
            cursor.execute(delete_query, (action_ids,))
            conn.commit()
            print(f"[ACTIONS DELETED] IDs: {action_ids}")

        cursor.close()
        conn.close()

        return action_list

    except Exception as e:
        print(f"Error getting actions: {e}")
        import traceback
        traceback.print_exc()
        
        return []

# ============================================
# GET STATS (Optional but useful)
# ============================================

@app.get("/stats")
async def get_stats():
    """Get platform statistics"""
    try:
        conn = get_connection()
        
        # FIXED: Added RealDictCursor
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        # Total events
        cursor.execute("SELECT COUNT(*) as count FROM logs")
        total_events = cursor.fetchone()["count"]

        # Events last hour
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM logs 
            WHERE timestamp > NOW() - INTERVAL '1 hour'
        """)
        events_last_hour = cursor.fetchone()["count"]

        # Events last 24 hours
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM logs 
            WHERE timestamp > NOW() - INTERVAL '24 hours'
        """)
        events_last_24h = cursor.fetchone()["count"]

        # Total endpoints
        cursor.execute("""
            SELECT COUNT(DISTINCT hostname) as count 
            FROM logs 
            WHERE hostname IS NOT NULL
        """)
        total_endpoints = cursor.fetchone()["count"]

        # Active endpoints (last 5 minutes)
        cursor.execute("""
            SELECT COUNT(DISTINCT hostname) as count 
            FROM logs 
            WHERE timestamp > NOW() - INTERVAL '5 minutes'
            AND hostname IS NOT NULL
        """)
        active_endpoints = cursor.fetchone()["count"]

        cursor.close()
        conn.close()

        return {
            "total_events": int(total_events),
            "total_endpoints": int(total_endpoints),
            "active_endpoints": int(active_endpoints),
            "events_last_hour": int(events_last_hour),
            "events_last_24h": int(events_last_24h),
            "severity_breakdown": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "info": int(total_events)
            }
        }

    except Exception as e:
        print(f"Error getting stats: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "total_events": 0,
            "total_endpoints": 0,
            "active_endpoints": 0,
            "events_last_hour": 0,
            "events_last_24h": 0,
            "severity_breakdown": {}
        }

# ============================================
# HEALTH CHECK (Optional but useful)
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# ============================================
# DEBUG ENDPOINT (for troubleshooting)
# ============================================

@app.get("/debug/actions")
async def debug_actions():
    """Debug endpoint to see all pending actions"""
    try:
        conn = get_connection()
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        cursor.execute("""
            SELECT * FROM actions 
            ORDER BY created_at DESC 
            LIMIT 50
        """)
        
        actions = cursor.fetchall()
        
        result = []
        for row in actions:
            result.append({
                "id": row["id"],
                "hostname": row["hostname"],
                "action": row["action"],
                "target": row["target"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None
            })

        cursor.close()
        conn.close()

        return {
            "pending_actions": result,
            "count": len(result)
        }

    except Exception as e:
        return {
            "error": str(e),
            "pending_actions": [],
            "count": 0
        }
