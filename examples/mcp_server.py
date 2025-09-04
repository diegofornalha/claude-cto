#!/usr/bin/env python3
"""
MCP Server for Claude CTO Monitor
Provides Model Context Protocol integration for CTO monitoring and dashboard
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# MCP imports
try:
    from mcp.server import Server
    from mcp.server.models import InitializationOptions
    from mcp.types import Tool, Resource
    import mcp.server.stdio as stdio_server
except ImportError:
    print("Installing MCP SDK...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "mcp"])
    from mcp.server import Server
    from mcp.server.models import InitializationOptions
    from mcp.types import Tool, Resource
    import mcp.server.stdio as stdio_server

# Import CTO components
try:
    from claude_cto.monitor import InfiniteTaskMonitor
    from claude_cto.core import ClaudeCTO
except ImportError:
    print("CTO modules not found in expected location")
    InfiniteTaskMonitor = None
    ClaudeCTO = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize MCP server
server = Server("claude-cto-monitor")

# Global state
monitor_instance = None
cto_instance = None
dashboard_state = {
    "status": "idle",
    "sessions": [],
    "metrics": {
        "total_requests": 0,
        "total_tokens": 0,
        "error_count": 0,
        "success_count": 0,
        "avg_response_time": 0
    },
    "alerts": [],
    "logs": []
}

def log_activity(message: str, level: str = "info"):
    """Log activity to dashboard logs"""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message
    }
    dashboard_state["logs"].append(entry)
    # Keep only last 100 logs
    if len(dashboard_state["logs"]) > 100:
        dashboard_state["logs"] = dashboard_state["logs"][-100:]

@server.list_tools()
async def list_tools() -> List[Tool]:
    """List available CTO Monitor tools"""
    return [
        Tool(
            name="cto_status",
            description="Get current CTO and monitor status",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="start_monitor",
            description="Start the infinite task monitor",
            inputSchema={
                "type": "object",
                "properties": {
                    "mode": {
                        "type": "string",
                        "enum": ["auto", "manual", "scheduled"],
                        "description": "Monitoring mode",
                        "default": "auto"
                    }
                }
            }
        ),
        Tool(
            name="stop_monitor",
            description="Stop the infinite task monitor",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_metrics",
            description="Get detailed metrics and statistics",
            inputSchema={
                "type": "object",
                "properties": {
                    "metric_type": {
                        "type": "string",
                        "enum": ["all", "requests", "tokens", "errors", "performance"],
                        "description": "Type of metrics to retrieve",
                        "default": "all"
                    }
                }
            }
        ),
        Tool(
            name="get_sessions",
            description="Get list of CTO sessions",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of sessions to return",
                        "default": 10
                    },
                    "status": {
                        "type": "string",
                        "enum": ["all", "active", "completed", "failed"],
                        "description": "Filter by session status",
                        "default": "all"
                    }
                }
            }
        ),
        Tool(
            name="manage_alerts",
            description="Manage alerts and notifications",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["list", "clear", "acknowledge"],
                        "description": "Alert action to perform"
                    },
                    "alert_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Alert IDs to act on (for clear/acknowledge)"
                    },
                    "severity": {
                        "type": "string",
                        "enum": ["all", "critical", "warning", "info"],
                        "description": "Filter alerts by severity (for list)",
                        "default": "all"
                    }
                }
            }
        ),
        Tool(
            name="execute_task",
            description="Execute a specific CTO task",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_type": {
                        "type": "string",
                        "description": "Type of task to execute"
                    },
                    "parameters": {
                        "type": "object",
                        "description": "Task parameters"
                    }
                }
            }
        ),
        Tool(
            name="get_logs",
            description="Get recent activity logs",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of log entries to retrieve",
                        "default": 50
                    },
                    "level": {
                        "type": "string",
                        "enum": ["all", "error", "warning", "info", "debug"],
                        "description": "Filter by log level",
                        "default": "all"
                    }
                }
            }
        ),
        Tool(
            name="export_data",
            description="Export monitoring data",
            inputSchema={
                "type": "object",
                "properties": {
                    "format": {
                        "type": "string",
                        "enum": ["json", "csv", "html"],
                        "description": "Export format"
                    },
                    "data_types": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": ["metrics", "sessions", "alerts", "logs"]
                        },
                        "description": "Data types to export"
                    }
                }
            }
        ),
        Tool(
            name="open_dashboard",
            description="Open the web dashboard in browser",
            inputSchema={
                "type": "object",
                "properties": {
                    "port": {
                        "type": "integer",
                        "description": "Port for dashboard server",
                        "default": 8080
                    }
                }
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> Any:
    """Handle tool calls"""
    global monitor_instance, cto_instance
    
    try:
        if name == "cto_status":
            return {
                "monitor_status": dashboard_state["status"],
                "monitor_active": monitor_instance is not None,
                "cto_active": cto_instance is not None,
                "metrics_summary": dashboard_state["metrics"],
                "active_sessions": len(dashboard_state["sessions"]),
                "pending_alerts": len([a for a in dashboard_state["alerts"] if not a.get("acknowledged")])
            }
        
        elif name == "start_monitor":
            mode = arguments.get("mode", "auto")
            
            if InfiniteTaskMonitor and not monitor_instance:
                monitor_instance = InfiniteTaskMonitor()
                dashboard_state["status"] = "monitoring"
                log_activity(f"Monitor started in {mode} mode", "info")
                
                return {
                    "success": True,
                    "message": f"Monitor started in {mode} mode",
                    "status": "monitoring"
                }
            else:
                return {
                    "success": False,
                    "message": "Monitor already running or module not available"
                }
        
        elif name == "stop_monitor":
            if monitor_instance:
                monitor_instance = None
                dashboard_state["status"] = "idle"
                log_activity("Monitor stopped", "info")
                
                return {
                    "success": True,
                    "message": "Monitor stopped",
                    "status": "idle"
                }
            else:
                return {
                    "success": False,
                    "message": "Monitor not running"
                }
        
        elif name == "get_metrics":
            metric_type = arguments.get("metric_type", "all")
            
            if metric_type == "all":
                return dashboard_state["metrics"]
            else:
                # Return specific metric category
                metric_map = {
                    "requests": ["total_requests", "success_count", "error_count"],
                    "tokens": ["total_tokens"],
                    "errors": ["error_count"],
                    "performance": ["avg_response_time"]
                }
                
                keys = metric_map.get(metric_type, [])
                return {k: dashboard_state["metrics"].get(k, 0) for k in keys}
        
        elif name == "get_sessions":
            limit = arguments.get("limit", 10)
            status_filter = arguments.get("status", "all")
            
            sessions = dashboard_state["sessions"]
            
            if status_filter != "all":
                sessions = [s for s in sessions if s.get("status") == status_filter]
            
            return {
                "sessions": sessions[:limit],
                "total": len(sessions)
            }
        
        elif name == "manage_alerts":
            action = arguments.get("action")
            
            if action == "list":
                severity = arguments.get("severity", "all")
                alerts = dashboard_state["alerts"]
                
                if severity != "all":
                    alerts = [a for a in alerts if a.get("severity") == severity]
                
                return {
                    "alerts": alerts,
                    "count": len(alerts)
                }
            
            elif action == "clear":
                alert_ids = arguments.get("alert_ids", [])
                
                if not alert_ids:
                    cleared = len(dashboard_state["alerts"])
                    dashboard_state["alerts"] = []
                else:
                    new_alerts = []
                    cleared = 0
                    for alert in dashboard_state["alerts"]:
                        if alert.get("id") not in alert_ids:
                            new_alerts.append(alert)
                        else:
                            cleared += 1
                    dashboard_state["alerts"] = new_alerts
                
                log_activity(f"Cleared {cleared} alerts", "info")
                return {
                    "success": True,
                    "cleared": cleared,
                    "remaining": len(dashboard_state["alerts"])
                }
            
            elif action == "acknowledge":
                alert_ids = arguments.get("alert_ids", [])
                acknowledged = 0
                
                for alert in dashboard_state["alerts"]:
                    if alert.get("id") in alert_ids:
                        alert["acknowledged"] = True
                        acknowledged += 1
                
                return {
                    "success": True,
                    "acknowledged": acknowledged
                }
        
        elif name == "execute_task":
            task_type = arguments.get("task_type")
            parameters = arguments.get("parameters", {})
            
            log_activity(f"Executing task: {task_type}", "info")
            
            # Simulate task execution
            dashboard_state["metrics"]["total_requests"] += 1
            
            return {
                "success": True,
                "task_type": task_type,
                "result": f"Task {task_type} executed successfully"
            }
        
        elif name == "get_logs":
            limit = arguments.get("limit", 50)
            level = arguments.get("level", "all")
            
            logs = dashboard_state["logs"]
            
            if level != "all":
                logs = [l for l in logs if l.get("level") == level]
            
            return {
                "logs": logs[-limit:],
                "total": len(logs)
            }
        
        elif name == "export_data":
            format_type = arguments.get("format", "json")
            data_types = arguments.get("data_types", ["metrics", "sessions", "alerts"])
            
            export_data = {}
            for dtype in data_types:
                if dtype in dashboard_state:
                    export_data[dtype] = dashboard_state[dtype]
            
            if format_type == "json":
                return {
                    "format": "json",
                    "data": json.dumps(export_data, indent=2, default=str)
                }
            elif format_type == "csv":
                # Simplified CSV for metrics
                csv_data = "Type,Value\n"
                for key, value in dashboard_state["metrics"].items():
                    csv_data += f"{key},{value}\n"
                
                return {
                    "format": "csv",
                    "data": csv_data
                }
            elif format_type == "html":
                html = f"""
                <html>
                <head><title>CTO Monitor Export</title></head>
                <body>
                    <h1>CTO Monitor Data Export</h1>
                    <pre>{json.dumps(export_data, indent=2, default=str)}</pre>
                </body>
                </html>
                """
                return {
                    "format": "html",
                    "data": html
                }
        
        elif name == "open_dashboard":
            port = arguments.get("port", 8080)
            
            # Start dashboard server
            import subprocess
            import os
            
            dashboard_dir = Path(__file__).parent / "dashboard"
            
            if dashboard_dir.exists():
                # Start the backend server
                subprocess.Popen(
                    [sys.executable, str(dashboard_dir / "backend" / "server.py")],
                    cwd=str(dashboard_dir)
                )
                
                log_activity(f"Dashboard started on port {port}", "info")
                
                return {
                    "success": True,
                    "message": f"Dashboard available at http://localhost:{port}",
                    "url": f"http://localhost:{port}"
                }
            else:
                return {
                    "success": False,
                    "message": "Dashboard directory not found"
                }
        
        else:
            raise ValueError(f"Unknown tool: {name}")
            
    except Exception as e:
        logger.error(f"Error in tool {name}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@server.list_resources()
async def list_resources() -> List[Resource]:
    """List available resources"""
    return [
        Resource(
            uri="cto://config",
            name="CTO Configuration",
            description="Current CTO monitor configuration",
            mimeType="application/json"
        ),
        Resource(
            uri="cto://metrics",
            name="Current Metrics",
            description="Real-time metrics data",
            mimeType="application/json"
        ),
        Resource(
            uri="cto://logs",
            name="Activity Logs",
            description="Recent activity logs",
            mimeType="text/plain"
        ),
        Resource(
            uri="cto://dashboard",
            name="Dashboard URL",
            description="Web dashboard access information",
            mimeType="text/plain"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """Read resource content"""
    
    if uri == "cto://config":
        config = {
            "monitor_enabled": monitor_instance is not None,
            "cto_enabled": cto_instance is not None,
            "refresh_interval": 5000,
            "max_sessions": 100,
            "max_alerts": 50,
            "log_level": "info",
            "dashboard_port": 8080
        }
        return json.dumps(config, indent=2)
    
    elif uri == "cto://metrics":
        return json.dumps(dashboard_state["metrics"], indent=2)
    
    elif uri == "cto://logs":
        logs = dashboard_state["logs"][-20:]  # Last 20 logs
        log_text = ""
        for log in logs:
            log_text += f"[{log['timestamp']}] {log['level'].upper()}: {log['message']}\n"
        return log_text
    
    elif uri == "cto://dashboard":
        return "Dashboard URL: http://localhost:8080\nStatus: " + dashboard_state["status"]
    
    else:
        raise ValueError(f"Unknown resource: {uri}")

async def main():
    """Main entry point"""
    logger.info("Starting Claude CTO MCP Server")
    log_activity("MCP Server started", "info")
    
    # Run the stdio server
    async with stdio_server.stdio_server() as (read_stream, write_stream):
        init_options = InitializationOptions(
            server_name="claude-cto-monitor",
            server_version="1.0.0"
        )
        await server.run(
            read_stream,
            write_stream,
            init_options
        )

if __name__ == "__main__":
    asyncio.run(main())