#!/bin/bash

# Synaptik MCP Server Log Monitor
# Monitors the MCP server log file in real-time

LOG_FILE="$HOME/.synaptik/logs/mcp-server.log"

echo "🔍 Synaptik MCP Server Log Monitor"
echo "=================================="
echo "Log file: $LOG_FILE"
echo ""

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo "⚠️  Log file doesn't exist yet. It will be created when MCP server starts."
    echo "   Waiting for log file to be created..."
    echo ""
fi

# Function to show recent logs
show_recent_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📋 Recent log entries:"
        echo "====================="
        tail -20 "$LOG_FILE"
        echo ""
    fi
}

# Function to monitor logs in real-time
monitor_logs() {
    echo "👀 Monitoring logs in real-time (Ctrl+C to stop)..."
    echo "=================================================="
    
    # Show recent logs first
    show_recent_logs
    
    # Follow the log file
    tail -f "$LOG_FILE" 2>/dev/null || {
        echo "Waiting for log file to be created..."
        while [ ! -f "$LOG_FILE" ]; do
            sleep 1
        done
        tail -f "$LOG_FILE"
    }
}

# Function to analyze logs
analyze_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "❌ No log file found"
        return 1
    fi
    
    echo "📊 Log Analysis"
    echo "==============="
    
    echo "Total log entries: $(wc -l < "$LOG_FILE")"
    echo ""
    
    echo "Log levels:"
    grep -o '\(DEBUG\|INFO\|WARN\|ERROR\)' "$LOG_FILE" | sort | uniq -c
    echo ""
    
    echo "Recent errors:"
    grep -i error "$LOG_FILE" | tail -5
    echo ""
    
    echo "MCP-related entries:"
    grep -i mcp "$LOG_FILE" | tail -10
    echo ""
    
    echo "Tool registration entries:"
    grep -i tool "$LOG_FILE" | tail -10
}

# Function to clear logs
clear_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "🗑️  Clearing log file..."
        > "$LOG_FILE"
        echo "✅ Log file cleared"
    else
        echo "ℹ️  No log file to clear"
    fi
}

# Main menu
case "${1:-monitor}" in
    "monitor"|"watch"|"tail")
        monitor_logs
        ;;
    "show"|"recent")
        show_recent_logs
        ;;
    "analyze"|"stats")
        analyze_logs
        ;;
    "clear"|"clean")
        clear_logs
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  monitor, watch, tail  - Monitor logs in real-time (default)"
        echo "  show, recent         - Show recent log entries"
        echo "  analyze, stats       - Analyze log file"
        echo "  clear, clean         - Clear log file"
        echo "  help                 - Show this help"
        echo ""
        echo "Examples:"
        echo "  $0                   # Monitor logs in real-time"
        echo "  $0 show              # Show recent entries"
        echo "  $0 analyze           # Analyze log patterns"
        echo "  $0 clear             # Clear log file"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
