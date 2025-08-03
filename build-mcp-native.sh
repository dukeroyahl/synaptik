#!/bin/bash

# Build script for Synaptik MCP native binary
# This creates a standalone executable for Claude Desktop integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧠 Building Synaptik MCP Native Binary${NC}"
echo "========================================"

# Check if GraalVM is available
if ! command -v native-image &> /dev/null; then
    echo -e "${YELLOW}⚠️  GraalVM native-image not found${NC}"
    echo "Installing GraalVM native-image..."
    
    if command -v sdk &> /dev/null; then
        echo "Using SDKMAN to install GraalVM..."
        sdk install java 21.0.1-graal
        sdk use java 21.0.1-graal
    else
        echo -e "${RED}❌ Please install GraalVM 21+ or SDKMAN first${NC}"
        echo "Visit: https://www.graalvm.org/downloads/"
        exit 1
    fi
fi

echo -e "${GREEN}✅ GraalVM native-image available${NC}"

echo -e "${BLUE}📦 Building MCP native binaries for release...${NC}"

# Change to MCP server directory
cd mcp-quarkus-server

# Create release directory
mkdir -p ../dist/release

# Function to build for specific platform
build_platform() {
    local platform=$1
    local output_name=$2
    
    echo -e "${BLUE}Building for $platform...${NC}"
    
    # Clean previous builds
    ./gradlew clean
    
    # Build native binary with container build for cross-platform
    ./gradlew build -Dquarkus.package.type=native \
        -Dquarkus.native.container-build=true \
        -Dquarkus.native.container-runtime=docker \
        -Dquarkus.native.additional-build-args=--verbose,--no-fallback
    
    # Find and copy the binary
    if [ -f "build/synaptik-mcp-server-*-runner" ]; then
        BINARY_PATH=$(find build -name "synaptik-mcp-server-*-runner" | head -1)
        cp "$BINARY_PATH" "../dist/release/$output_name"
        chmod +x "../dist/release/$output_name"
        echo -e "${GREEN}✅ Built $output_name${NC}"
    else
        echo -e "${RED}❌ Failed to build $output_name${NC}"
        return 1
    fi
}

# Build for current platform (for local testing)
echo -e "${BLUE}Building for current platform...${NC}"
./gradlew clean
./gradlew build -Dquarkus.package.type=native \
    -Dquarkus.native.container-build=false \
    -Dquarkus.native.additional-build-args=--verbose,--no-fallback

# Check if build was successful
if [ -f "build/synaptik-mcp-server-*-runner" ]; then
    BINARY_PATH=$(find build -name "synaptik-mcp-server-*-runner" | head -1)
    BINARY_NAME="synaptik-mcp"
    
    # Copy to dist directory with simpler name
    mkdir -p ../dist/native
    cp "$BINARY_PATH" "../dist/native/$BINARY_NAME"
    chmod +x "../dist/native/$BINARY_NAME"
    
    echo -e "${GREEN}✅ Native binary built successfully!${NC}"
    echo ""
    echo -e "${BLUE}📍 Binary location:${NC} dist/native/$BINARY_NAME"
    
    # Show binary info
    BINARY_SIZE=$(du -h "../dist/native/$BINARY_NAME" | cut -f1)
    echo -e "${BLUE}📊 Binary size:${NC} $BINARY_SIZE"
    
    echo ""
    echo -e "${BLUE}🚀 Usage:${NC}"
    echo "1. Start Synaptik Docker containers:"
    echo "   docker-compose -f dist/docker-compose.yml up -d"
    echo ""
    echo "2. Configure Claude Desktop:"
    echo '   {'
    echo '     "mcpServers": {'
    echo '       "synaptik": {'
    echo "         \"command\": \"$(pwd)/../dist/native/$BINARY_NAME\""
    echo '       }'
    echo '     }'
    echo '   }'
    echo ""
    echo "3. Restart Claude Desktop"
    
else
    echo -e "${RED}❌ Native binary build failed${NC}"
    echo "Check the build logs above for errors."
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Synaptik MCP native binary ready for distribution!${NC}"
echo ""
echo -e "${BLUE}📦 For GitHub Release:${NC}"
echo "To create cross-platform binaries for GitHub releases, use container builds:"
echo "This requires setting up CI/CD with different target platforms (linux/amd64, linux/arm64, darwin/amd64, etc.)"
echo ""
echo -e "${BLUE}🔗 Upload to GitHub Releases:${NC}"
echo "1. Create a new release: https://github.com/Dukeroyahl/synaptik/releases/new"
echo "2. Upload the binary as: synaptik-mcp-linux (or synaptik-mcp-macos, synaptik-mcp-windows.exe)"
echo "3. Customers can then download directly from releases"