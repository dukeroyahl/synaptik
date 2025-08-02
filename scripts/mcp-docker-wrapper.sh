#!/bin/bash

# Docker MCP Wrapper for Synaptik
# This script runs the MCP server in a Docker container

set -e

# Configuration
DOCKER_IMAGE="synaptik-mcp:latest"
CONTAINER_NAME="synaptik-mcp-$$"  # Use PID for unique names
SYNAPTIK_URL="${SYNAPTIK_URL:-http://host.docker.internal:8080}"

# Cleanup function
cleanup() {
    if [ ! -z "$CONTAINER_ID" ]; then
        docker rm -f "$CONTAINER_ID" >/dev/null 2>&1 || true
    fi
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Build the Docker image if it doesn't exist
if ! docker image inspect "$DOCKER_IMAGE" >/dev/null 2>&1; then
    echo "Building MCP Docker image..." >&2
    cd "$(dirname "$0")/.." # Go to project root
    docker build -f mcp-server/Dockerfile -t "$DOCKER_IMAGE" .
fi

# Run the container with stdio
CONTAINER_ID=$(docker run -i --rm \
    --name "$CONTAINER_NAME" \
    -e SYNAPTIK_URL="$SYNAPTIK_URL" \
    "$DOCKER_IMAGE")

echo "Container ID: $CONTAINER_ID" >&2