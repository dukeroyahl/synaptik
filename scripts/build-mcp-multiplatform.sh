#!/bin/bash

# Multi-platform MCP native binary build script
# Builds for Linux (x86_64, ARM64), macOS (x86_64, Apple Silicon), and Windows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧠 Building Synaptik MCP for Multiple Platforms${NC}"
echo "=================================================="

# Check if we're on macOS with Apple Silicon
detect_platform() {
    local os=$(uname -s)
    local arch=$(uname -m)
    
    echo -e "${BLUE}Detected platform: $os $arch${NC}"
    
    case "$os" in
        Darwin*)
            case "$arch" in
                arm64)
                    echo "🍎 macOS Apple Silicon (ARM64)"
                    PLATFORM="darwin-arm64"
                    ;;
                x86_64)
                    echo "🍎 macOS Intel (x86_64)"
                    PLATFORM="darwin-x86_64"
                    ;;
            esac
            ;;
        Linux*)
            case "$arch" in
                aarch64|arm64)
                    echo "🐧 Linux ARM64"
                    PLATFORM="linux-arm64"
                    ;;
                x86_64)
                    echo "🐧 Linux x86_64"
                    PLATFORM="linux-x86_64"
                    ;;
            esac
            ;;
        MINGW*|CYGWIN*|MSYS*)
            echo "🪟 Windows"
            PLATFORM="windows-x86_64"
            ;;
    esac
}

# Check Docker availability for cross-compilation
check_docker() {
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✅ Docker available for cross-compilation${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Docker not available - native compilation only${NC}"
        return 1
    fi
}

# Build for specific platform
build_for_platform() {
    local target_platform=$1
    local output_name=$2
    local use_container=${3:-false}
    
    echo -e "${BLUE}📦 Building for $target_platform...${NC}"
    
    cd mcp-quarkus-server
    ./gradlew clean
    
    local build_args="build -Dquarkus.package.type=native"
    
    case "$target_platform" in
        "darwin-arm64")
            if [[ "$PLATFORM" == "darwin-arm64" ]]; then
                # Native build on Apple Silicon
                build_args="$build_args -Dquarkus.native.container-build=false"
                echo -e "${GREEN}Using native Apple Silicon GraalVM${NC}"
            else
                echo -e "${RED}❌ Cannot cross-compile for Apple Silicon from other platforms${NC}"
                return 1
            fi
            ;;
        "darwin-x86_64")
            if [[ "$PLATFORM" == "darwin-x86_64" ]]; then
                # Native build on Intel Mac
                build_args="$build_args -Dquarkus.native.container-build=false"
                echo -e "${GREEN}Using native Intel Mac GraalVM${NC}"
            else
                echo -e "${RED}❌ Cannot cross-compile for Intel Mac from other platforms${NC}"
                return 1
            fi
            ;;
        "linux-x86_64")
            # Use container for Linux x86_64
            build_args="$build_args -Dquarkus.native.container-build=true"
            build_args="$build_args -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-graalvmce-builder-image:jdk-21"
            echo -e "${GREEN}Using container build for Linux x86_64${NC}"
            ;;
        "linux-arm64")
            # Use container for Linux ARM64
            build_args="$build_args -Dquarkus.native.container-build=true"
            build_args="$build_args -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-graalvmce-builder-image:jdk-21-arch-arm64"
            echo -e "${GREEN}Using container build for Linux ARM64${NC}"
            ;;
        "windows-x86_64")
            # Use container for Windows
            build_args="$build_args -Dquarkus.native.container-build=true"
            build_args="$build_args -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-graalvmce-builder-image:jdk-21"
            echo -e "${GREEN}Using container build for Windows x86_64${NC}"
            ;;
    esac
    
    # Add common native arguments
    build_args="$build_args -Dquarkus.native.additional-build-args=--no-fallback,--verbose"
    
    echo -e "${BLUE}Executing: ./gradlew $build_args${NC}"
    
    if ./gradlew $build_args; then
        # Find the built binary
        if [ -f "build/synaptik-mcp-server-*-runner" ]; then
            BINARY_PATH=$(find build -name "synaptik-mcp-server-*-runner" | head -1)
            
            # Create release directory
            mkdir -p ../dist/release
            
            # Copy with platform-specific name
            cp "$BINARY_PATH" "../dist/release/$output_name"
            chmod +x "../dist/release/$output_name"
            
            # Get binary size
            BINARY_SIZE=$(du -h "../dist/release/$output_name" | cut -f1)
            
            echo -e "${GREEN}✅ Successfully built $output_name (${BINARY_SIZE})${NC}"
            return 0
        else
            echo -e "${RED}❌ Binary not found after build${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Build failed for $target_platform${NC}"
        return 1
    fi
    
    cd ..
}

# Main build function
main() {
    detect_platform
    DOCKER_AVAILABLE=$(check_docker && echo "true" || echo "false")
    
    echo ""
    echo -e "${BLUE}🎯 Build Options:${NC}"
    echo "1. Current platform only ($PLATFORM)"
    echo "2. All supported platforms (requires Docker)"
    echo "3. Specific platform"
    echo ""
    
    read -p "Choose build option (1-3): " choice
    
    case $choice in
        1)
            echo -e "${BLUE}Building for current platform: $PLATFORM${NC}"
            case "$PLATFORM" in
                "darwin-arm64")
                    build_for_platform "darwin-arm64" "synaptik-mcp-macos-arm64"
                    ;;
                "darwin-x86_64")
                    build_for_platform "darwin-x86_64" "synaptik-mcp-macos-x86_64"
                    ;;
                "linux-arm64")
                    build_for_platform "linux-arm64" "synaptik-mcp-linux-arm64"
                    ;;
                "linux-x86_64")
                    build_for_platform "linux-x86_64" "synaptik-mcp-linux"
                    ;;
                "windows-x86_64")
                    build_for_platform "windows-x86_64" "synaptik-mcp-windows.exe"
                    ;;
            esac
            ;;
        2)
            if [[ "$DOCKER_AVAILABLE" == "true" ]]; then
                echo -e "${BLUE}Building for all platforms...${NC}"
                
                # Build for current platform natively
                case "$PLATFORM" in
                    "darwin-arm64")
                        build_for_platform "darwin-arm64" "synaptik-mcp-macos-arm64"
                        ;;
                    "darwin-x86_64")
                        build_for_platform "darwin-x86_64" "synaptik-mcp-macos-x86_64"
                        ;;
                esac
                
                # Build others with containers
                if [[ "$PLATFORM" != "linux-x86_64" ]]; then
                    build_for_platform "linux-x86_64" "synaptik-mcp-linux"
                fi
                if [[ "$PLATFORM" != "linux-arm64" ]]; then
                    build_for_platform "linux-arm64" "synaptik-mcp-linux-arm64"
                fi
                
            else
                echo -e "${RED}❌ Docker required for multi-platform builds${NC}"
                exit 1
            fi
            ;;
        3)
            echo "Available platforms:"
            echo "  darwin-arm64 (macOS Apple Silicon)"
            echo "  darwin-x86_64 (macOS Intel)" 
            echo "  linux-x86_64 (Linux x86_64)"
            echo "  linux-arm64 (Linux ARM64)"
            echo "  windows-x86_64 (Windows)"
            echo ""
            read -p "Enter platform: " target_platform
            
            case "$target_platform" in
                "darwin-arm64")
                    build_for_platform "darwin-arm64" "synaptik-mcp-macos-arm64"
                    ;;
                "darwin-x86_64") 
                    build_for_platform "darwin-x86_64" "synaptik-mcp-macos-x86_64"
                    ;;
                "linux-x86_64")
                    build_for_platform "linux-x86_64" "synaptik-mcp-linux"
                    ;;
                "linux-arm64")
                    build_for_platform "linux-arm64" "synaptik-mcp-linux-arm64"
                    ;;
                "windows-x86_64")
                    build_for_platform "windows-x86_64" "synaptik-mcp-windows.exe"
                    ;;
                *)
                    echo -e "${RED}❌ Unknown platform: $target_platform${NC}"
                    exit 1
                    ;;
            esac
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Build complete!${NC}"
    echo ""
    echo -e "${BLUE}📁 Built binaries:${NC}"
    ls -lh dist/release/ 2>/dev/null || echo "No binaries found"
    
    echo ""
    echo -e "${BLUE}📦 Next steps for release:${NC}"
    echo "1. Test binaries on target platforms"
    echo "2. Create GitHub release: https://github.com/Dukeroyahl/synaptik/releases/new"
    echo "3. Upload binaries to release"
    echo "4. Update documentation with download links"
}

# Run main function
main