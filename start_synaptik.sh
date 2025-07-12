#!/bin/bash

# Script to start Synaptik server and client
# Auto-detects current directory

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNAPTIK_PATH="$SCRIPT_DIR"
LOG_FILE="$SYNAPTIK_PATH/synaptik.log"

# Function to check if a port is in use
check_port() {
  lsof -i :$1 >/dev/null 2>&1
  return $?
}

# Function to display status messages
echo_status() {
  echo "$(date '+%H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to start Synaptik (both server and client)
start_synaptik() {
  echo_status "Starting Synaptik (server and client)..."
  cd "$SYNAPTIK_PATH" || { echo_status "Error: Synaptik directory not found"; exit 1; }
  
  if check_port 3001 || check_port 5173; then
    echo_status "Port 3001 or 5173 is already in use. Synaptik might be running."
  else
    echo_status "Starting Synaptik with npm run dev"
    npm run dev > "$SYNAPTIK_PATH/synaptik.log" 2>&1 &
    SYNAPTIK_PID=$!
    echo "$SYNAPTIK_PID" > "$SYNAPTIK_PATH/.synaptik.pid"
    echo_status "Synaptik started with PID: $SYNAPTIK_PID"
    sleep 2
  fi
}

# Function to check status
check_status() {
  echo_status "Checking Synaptik status..."
  
  # Check Synaptik process
  if [ -f "$SYNAPTIK_PATH/.synaptik.pid" ]; then
    SYNAPTIK_PID=$(cat "$SYNAPTIK_PATH/.synaptik.pid")
    if ps -p "$SYNAPTIK_PID" > /dev/null; then
      echo_status "Synaptik is running (PID: $SYNAPTIK_PID)"
    else
      echo_status "Synaptik is not running (stale PID file)"
    fi
  else
    echo_status "Synaptik is not running (no PID file)"
  fi
  
  # Check ports
  if check_port 3001; then
    echo_status "Port 3001 is in use (Synaptik server port)"
  else
    echo_status "Port 3001 is free"
  fi
  
  if check_port 5173; then
    echo_status "Port 5173 is in use (Synaptik client port)"
  else
    echo_status "Port 5173 is free"
  fi
}

# Function to stop services
stop_services() {
  echo_status "Stopping Synaptik services..."
  
  # Stop Synaptik
  if [ -f "$SYNAPTIK_PATH/.synaptik.pid" ]; then
    SYNAPTIK_PID=$(cat "$SYNAPTIK_PATH/.synaptik.pid")
    if ps -p "$SYNAPTIK_PID" > /dev/null; then
      echo_status "Stopping Synaptik (PID: $SYNAPTIK_PID)"
      kill -15 "$SYNAPTIK_PID"
      sleep 2
      if ps -p "$SYNAPTIK_PID" > /dev/null; then
        echo_status "Synaptik still running, using force kill"
        kill -9 "$SYNAPTIK_PID"
      fi
    fi
    rm "$SYNAPTIK_PATH/.synaptik.pid"
  fi
  
  # Kill any processes on the relevant ports just to be sure
  PORT_3001_PID=$(lsof -ti:3001 2>/dev/null)
  if [ -n "$PORT_3001_PID" ]; then
    echo_status "Killing process on port 3001 (PID: $PORT_3001_PID)"
    kill -15 "$PORT_3001_PID" 2>/dev/null || kill -9 "$PORT_3001_PID" 2>/dev/null
  fi
  
  PORT_5173_PID=$(lsof -ti:5173 2>/dev/null)
  if [ -n "$PORT_5173_PID" ]; then
    echo_status "Killing process on port 5173 (PID: $PORT_5173_PID)"
    kill -15 "$PORT_5173_PID" 2>/dev/null || kill -9 "$PORT_5173_PID" 2>/dev/null
  fi
  
  echo_status "Synaptik services stopped"
}

# Main execution
case "$1" in
  start)
    start_synaptik
    echo_status "Synaptik started. Client available at: http://localhost:5173, Server at: http://localhost:3001"
    ;;
  stop)
    stop_services
    ;;
  restart)
    stop_services
    sleep 2
    start_synaptik
    echo_status "Synaptik restarted. Client available at: http://localhost:5173, Server at: http://localhost:3001"
    ;;
  status)
    check_status
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0
