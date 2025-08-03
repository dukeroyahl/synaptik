#!/bin/bash

# Synaptik Log Directory Setup Script
# Creates necessary log directories with proper permissions

set -e

# Default log directory
SYNAPTIK_LOGS_DIR="${SYNAPTIK_LOGS_DIR:-${HOME}/.synaptik/logs}"

echo "🔧 Setting up Synaptik log directories..."

# Create main log directory
echo "📁 Creating log directory: $SYNAPTIK_LOGS_DIR"
mkdir -p "$SYNAPTIK_LOGS_DIR"

# Create component-specific subdirectories
echo "📁 Creating component log directories..."
mkdir -p "$SYNAPTIK_LOGS_DIR/backend"
mkdir -p "$SYNAPTIK_LOGS_DIR/frontend" 
mkdir -p "$SYNAPTIK_LOGS_DIR/mongodb"

# Set appropriate permissions
echo "🔒 Setting directory permissions..."
chmod 755 "$SYNAPTIK_LOGS_DIR"
chmod 755 "$SYNAPTIK_LOGS_DIR"/*

# Create initial log files to ensure they exist
echo "📝 Creating initial log files..."
touch "$SYNAPTIK_LOGS_DIR/mcp-bridge.log"
touch "$SYNAPTIK_LOGS_DIR/backend/synaptik-backend.log"

# Set file permissions
chmod 644 "$SYNAPTIK_LOGS_DIR"/*.log
chmod 644 "$SYNAPTIK_LOGS_DIR/backend"/*.log 2>/dev/null || true

echo "✅ Log directory setup complete!"
echo ""
echo "📍 Log directories created at:"
echo "   Base: $SYNAPTIK_LOGS_DIR"
echo "   Backend: $SYNAPTIK_LOGS_DIR/backend/"
echo "   Frontend: $SYNAPTIK_LOGS_DIR/frontend/"
echo "   MongoDB: $SYNAPTIK_LOGS_DIR/mongodb/"
echo "   MCP: $SYNAPTIK_LOGS_DIR/mcp-bridge.log"
echo ""
echo "🚀 You can now start Synaptik with debug logging enabled!"
echo "   docker-compose -f dist/docker-compose.dev.yml up -d"
echo ""
echo "📊 Monitor logs with:"
echo "   tail -f $SYNAPTIK_LOGS_DIR/backend/synaptik-backend.log"
echo "   tail -f $SYNAPTIK_LOGS_DIR/mcp-bridge.log"
