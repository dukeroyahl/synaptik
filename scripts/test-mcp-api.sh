#!/bin/bash

# Test MCP server API connectivity
# This script tests if the MCP server can successfully connect to the Synaptik API

set -e

cd "$(dirname "$0")/.."

MCP_BINARY="./mcp/build/synaptik-mcp-server-0.0.5-runner"

if [ ! -x "$MCP_BINARY" ]; then
    echo "❌ MCP binary not found or not executable: $MCP_BINARY"
    echo "Build it with: cd mcp && ./gradlew build -Dquarkus.package.type=native -Dquarkus.native.container-build=false"
    exit 1
fi

echo "🧪 Testing MCP Server API Connectivity"
echo "======================================"
echo ""

# Create a temporary file for MCP communication
TEMP_DIR=$(mktemp -d)
INPUT_FIFO="$TEMP_DIR/input"
OUTPUT_FILE="$TEMP_DIR/output"

mkfifo "$INPUT_FIFO"

# Start MCP server in background
echo "🚀 Starting MCP server..."
"$MCP_BINARY" < "$INPUT_FIFO" > "$OUTPUT_FILE" 2>/dev/null &
MCP_PID=$!

# Function to cleanup
cleanup() {
    kill $MCP_PID 2>/dev/null || true
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Give MCP server time to start
sleep 1

# Send initialize message
echo "📡 Sending initialize message..."
echo '{"jsonrpc": "2.0", "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0"}}, "id": 1}' > "$INPUT_FIFO" &

# Wait for response
sleep 2

# Check if we got a response
if [ -s "$OUTPUT_FILE" ]; then
    echo "✅ MCP server responded to initialize"
    
    # Try to call list_tasks tool
    echo "📋 Testing list_tasks tool..."
    echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "list_tasks", "arguments": {}}, "id": 2}' > "$INPUT_FIFO" &
    
    # Wait for response
    sleep 3
    
    # Check the output
    if grep -q "error" "$OUTPUT_FILE"; then
        echo "⚠️  Got error response (this might be expected if no tasks exist)"
        echo "Response:"
        tail -1 "$OUTPUT_FILE"
    elif grep -q "result" "$OUTPUT_FILE"; then
        echo "✅ Successfully called list_tasks tool!"
        echo "Response:"
        tail -1 "$OUTPUT_FILE"
    else
        echo "❓ Unexpected response format"
        echo "Full output:"
        cat "$OUTPUT_FILE"
    fi
else
    echo "❌ No response from MCP server"
    echo "Check if the API is running: curl http://localhost:8060/q/health"
fi

echo ""
echo "🔍 For detailed diagnostics, run: ./scripts/test-mcp-connection.sh"
