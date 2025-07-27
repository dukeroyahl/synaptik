#!/bin/bash

# Synaptik Docker Build Script
set -e

echo "🐳 Building Synaptik All-in-One Docker Image..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from package.json or use default
VERSION=${1:-latest}
IMAGE_NAME="synaptik:${VERSION}"

echo -e "${BLUE}📋 Build Configuration:${NC}"
echo -e "  Image Name: ${GREEN}${IMAGE_NAME}${NC}"
echo -e "  Build Context: ${PWD}${NC}"
echo ""

# Create data directories if they don't exist
echo -e "${YELLOW}📂 Setting up data directories...${NC}"
if [ ! -d "dist/data/mongodb" ] || [ -z "$(ls -A dist/data/mongodb 2>/dev/null)" ]; then
    mkdir -p dist/data/mongodb
    chmod 755 dist/data/mongodb
    echo -e "  Created: dist/data/mongodb"
else
    echo -e "  Exists (with data): dist/data/mongodb"
fi

if [ ! -d "dist/data/logs" ] || [ -z "$(ls -A dist/data/logs 2>/dev/null)" ]; then
    mkdir -p dist/data/logs
    chmod 755 dist/data/logs
    echo -e "  Created: dist/data/logs"
else
    echo -e "  Exists (with data): dist/data/logs"
fi

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -f ./docker/Dockerfile -t "${IMAGE_NAME}" .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Quick Start Commands:${NC}"
    echo ""
    echo -e "${YELLOW}Option 1: Using Docker Compose (Recommended)${NC}"
    echo "  docker-compose -f ./docker/docker-compose.production.yml up -d"
    echo ""
    echo -e "${YELLOW}Option 2: Using Docker directly${NC}"
    echo "  docker run -d --name synaptik-app \\"
    echo "    -p 80:80 \\"
    echo "    -v \$HOME/.synaptik/data:/data/db \\"
    echo "    -v \$HOME/.synaptik/logs:/var/log/synaptik \\"
    echo "    --restart unless-stopped \\"
    echo "    ${IMAGE_NAME}"
    echo ""
    echo -e "${BLUE}📊 Access Points:${NC}"
    echo "  • Web App: http://localhost"
    echo "  • API Docs: http://localhost/q/swagger-ui"
    echo "  • Health: http://localhost/health"
    echo "  • MCP Server: http://localhost/mcp"
    echo ""
    echo -e "${BLUE}🤖 MCP Configuration for Claude Desktop:${NC}"
    echo '  {'
    echo '    "mcpServers": {'
    echo '      "synaptik": {'
    echo '        "command": "curl",'
    echo '        "args": ["-N", "-H", "Accept: text/event-stream", "http://localhost/mcp"],'
    echo '        "env": {}'
    echo '      }'
    echo '    }'
    echo '  }'
    echo ""
    echo -e "${GREEN}🎉 Ready to deploy!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi