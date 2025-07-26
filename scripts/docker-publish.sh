#!/bin/bash

# Docker Hub Publishing Script for Synaptik
# Usage: ./scripts/docker-publish.sh [version] [dockerhub-username]
# Example: ./scripts/docker-publish.sh v1.0.0 yourusername

set -e

# Configuration
VERSION=${1:-latest}
DOCKERHUB_USERNAME=${2:-""}
PROJECT_NAME="synaptik"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Synaptik Docker Hub Publishing Script${NC}"
echo "============================================"

# Check if Docker Hub username is provided
if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo -e "${RED}❌ Error: Docker Hub username required${NC}"
    echo "Usage: $0 [version] [dockerhub-username]"
    echo "Example: $0 v1.0.0 yourusername"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Configuration:${NC}"
echo "  Version: $VERSION"
echo "  Docker Hub Username: $DOCKERHUB_USERNAME"
echo "  Project: $PROJECT_NAME"
echo ""

# Login to Docker Hub
echo -e "${BLUE}🔐 Logging into Docker Hub...${NC}"
docker login

echo ""
echo -e "${BLUE}🏗️  Building and pushing images...${NC}"

# Function to build and push image
build_and_push() {
    local component=$1
    local context=$2
    local image_name="$DOCKERHUB_USERNAME/$PROJECT_NAME-$component"
    
    echo -e "${YELLOW}📦 Building $component...${NC}"
    docker build -t "$image_name:$VERSION" -t "$image_name:latest" "$context"
    
    echo -e "${YELLOW}🚀 Pushing $component...${NC}"
    docker push "$image_name:$VERSION"
    docker push "$image_name:latest"
    
    echo -e "${GREEN}✅ $component published successfully${NC}"
    echo ""
}

# Build and push each component
build_and_push "server" "./server"
build_and_push "client" "./client"
build_and_push "mcp-server" "./mcp-server"

echo -e "${GREEN}🎉 All images published successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Published Images:${NC}"
echo "  • $DOCKERHUB_USERNAME/$PROJECT_NAME-server:$VERSION"
echo "  • $DOCKERHUB_USERNAME/$PROJECT_NAME-client:$VERSION"
echo "  • $DOCKERHUB_USERNAME/$PROJECT_NAME-mcp-server:$VERSION"
echo ""
echo -e "${BLUE}🔗 Docker Hub URLs:${NC}"
echo "  • https://hub.docker.com/r/$DOCKERHUB_USERNAME/$PROJECT_NAME-server"
echo "  • https://hub.docker.com/r/$DOCKERHUB_USERNAME/$PROJECT_NAME-client"
echo "  • https://hub.docker.com/r/$DOCKERHUB_USERNAME/$PROJECT_NAME-mcp-server"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Update docker-compose files to use published images"
echo "  2. Test deployment with: docker-compose -f config/docker-compose.hub.yml up -d"
echo "  3. Share your Docker Hub repository URLs with others"