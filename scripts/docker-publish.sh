#!/bin/bash

# Synaptik Docker Publish Script
set -e

echo "🐳 Publishing Synaptik Docker Image..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"dukeroyahl"}
IMAGE_NAME="synaptik"
REGISTRY=${REGISTRY:-"docker.io"}

# Get version from package.json or use input
VERSION=${1:-$(node -p "require('./package.json').version" 2>/dev/null || echo "latest")}
FULL_IMAGE_NAME="${REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}"

echo -e "${BLUE}📋 Publish Configuration:${NC}"
echo -e "  Registry: ${GREEN}${REGISTRY}${NC}"
echo -e "  Image: ${GREEN}${FULL_IMAGE_NAME}:${VERSION}${NC}"
echo -e "  Also tagging as: ${GREEN}${FULL_IMAGE_NAME}:latest${NC}"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check if user is logged in to Docker registry
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo -e "${YELLOW}⚠️  Not logged in to Docker registry.${NC}"
    echo -e "${BLUE}Please run: docker login${NC}"
    exit 1
fi

# Build the image using new docker folder structure
echo -e "${YELLOW}📦 Building image...${NC}"
docker build -f ./docker/Dockerfile -t "${FULL_IMAGE_NAME}:${VERSION}" .

# Tag the image for latest if not already latest
if [ "${VERSION}" != "latest" ]; then
    echo -e "${YELLOW}🏷️  Tagging as latest...${NC}"
    docker tag "${FULL_IMAGE_NAME}:${VERSION}" "${FULL_IMAGE_NAME}:latest"
fi

# Push the specific version
echo -e "${YELLOW}📤 Pushing ${FULL_IMAGE_NAME}:${VERSION}...${NC}"
docker push "${FULL_IMAGE_NAME}:${VERSION}"

# Push latest tag
if [ "${VERSION}" != "latest" ]; then
    echo -e "${YELLOW}📤 Pushing ${FULL_IMAGE_NAME}:latest...${NC}"
    docker push "${FULL_IMAGE_NAME}:latest"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully published Docker image!${NC}"
    echo ""
    echo -e "${BLUE}📊 Published Images:${NC}"
    echo -e "  • ${GREEN}${FULL_IMAGE_NAME}:${VERSION}${NC}"
    if [ "${VERSION}" != "latest" ]; then
        echo -e "  • ${GREEN}${FULL_IMAGE_NAME}:latest${NC}"
    fi
    echo ""
    echo -e "${BLUE}🚀 Quick Start Commands:${NC}"
    echo ""
    echo -e "${YELLOW}Pull and run:${NC}"
    echo "  docker run -d --name synaptik-app \\"
    echo "    -p 80:80 \\"
    echo "    -v \$HOME/.synaptik/data:/data/db \\"
    echo "    -v \$HOME/.synaptik/logs:/var/log/synaptik \\"
    echo "    --restart unless-stopped \\"
    echo "    ${FULL_IMAGE_NAME}:${VERSION}"
    echo ""
    echo -e "${YELLOW}Using Docker Compose:${NC}"
    echo "  # Update docker-compose.production.yml to use:"
    echo "  # image: ${FULL_IMAGE_NAME}:${VERSION}"
    echo "  docker-compose -f ./docker/docker-compose.production.yml up -d"
    echo ""
    echo -e "${GREEN}🎉 Ready for deployment!${NC}"
else
    echo -e "${RED}❌ Failed to publish Docker image!${NC}"
    exit 1
fi