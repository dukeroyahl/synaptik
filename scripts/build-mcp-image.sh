#!/bin/bash

# Build and push Synaptik MCP Server Docker image
# This creates the image that can be used as now let me build doMCP server

set -e

# Configuration
IMAGE_NAME="synaptik/mcp-server"
TAG="${1:-latest}"
FULL_IMAGE="$IMAGE_NAME:$TAG"

echo "🔨 Building Synaptik MCP Server image: $FULL_IMAGE"

# Build the image
docker build -f mcp-server/Dockerfile -t "$FULL_IMAGE" .

echo "✅ Built $FULL_IMAGE successfully!"
echo ""
echo "🐳 Image ready for Claude Desktop configuration:"
echo ""
echo '"synaptik": {'
echo '  "command": "docker",'
echo '  "args": ['
echo '    "run",'
echo '    "-i",'
echo '    "--rm",'
echo '    "-e",'
echo '    "SYNAPTIK_URL",'
echo "    \"$FULL_IMAGE\""
echo '  ],'
echo '  "env": {'
echo '    "SYNAPTIK_URL": "http://host.docker.internal:8080"'
echo '  }'
echo '}'
echo ""

# Optional: Push to registry (uncomment if you want to publish)
# echo "📤 Push to registry? (y/N)"
# read -r response
# if [[ "$response" =~ ^[Yy]$ ]]; then
#     docker push "$FULL_IMAGE"
#     echo "✅ Pushed $FULL_IMAGE to registry!"
# fi