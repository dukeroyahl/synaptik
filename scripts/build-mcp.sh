#!/usr/bin/env bash
# Unified Synaptik MCP Build Script
# Consolidates multiplatform, native, and test builds into one script
# Usage: ./scripts/build-mcp.sh [OPTIONS] [TARGET]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CLEAN=1
VERBOSE=0
SKIP_TESTS=1
BUILD_MODE="current"
OUTPUT_DIR=""
INTERACTIVE=1
WATCH_LOGS=0
LOG_ACTION=""

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$REPO_ROOT/mcp"
LOG_DIR="$HOME/.synaptik/logs"
LOG_FILE="$LOG_DIR/mcp-server.log"

# Usage function
usage() {
    cat << EOF
🧠 Synaptik MCP Build Script

USAGE:
    $0 [OPTIONS] [TARGET]

TARGETS:
    current         Build for current platform (default)
    all             Build for all supported platforms
    test            Build and deploy to ~/Test for development
    release         Build release binaries for distribution
    <platform>      Build for specific platform:
                    - darwin-arm64 (macOS Apple Silicon)
                    - darwin-x86_64 (macOS Intel)
                    - linux-x86_64 (Linux x86_64)
                    - linux-arm64 (Linux ARM64)
                    - windows-x86_64 (Windows)

LOG ACTIONS (can be used standalone):
    logs            Monitor MCP server logs in real-time
    logs-show       Show recent log entries
    logs-analyze    Analyze log patterns and statistics
    logs-clear      Clear the log file

OPTIONS:
    --no-clean      Skip gradle clean
    --verbose       Enable verbose native compilation
    --run-tests     Run tests during build (default: skip)
    --skip-tests    Skip tests during build
    --output-dir    Custom output directory
    --non-interactive  Skip interactive prompts
    --watch-logs    Monitor logs after successful build
    --help, -h      Show this help

EXAMPLES:
    $0                          # Interactive build for current platform
    $0 test --verbose           # Build for testing with verbose output
    $0 test --watch-logs        # Build for testing and monitor logs
    $0 all --no-clean           # Build all platforms without cleaning
    $0 darwin-arm64 --output-dir ./dist  # Build specific platform to custom dir
    $0 release --non-interactive # Build release binaries without prompts
    
    # Log monitoring (standalone)
    $0 logs                     # Monitor logs in real-time
    $0 logs-show                # Show recent log entries
    $0 logs-analyze             # Analyze log patterns
    $0 logs-clear               # Clear log file

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-clean)
                CLEAN=0
                shift
                ;;
            --verbose)
                VERBOSE=1
                shift
                ;;
            --run-tests)
                SKIP_TESTS=0
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=1
                shift
                ;;
            --output-dir)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --non-interactive)
                INTERACTIVE=0
                shift
                ;;
            --watch-logs)
                WATCH_LOGS=1
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            current|all|test|release|darwin-arm64|darwin-x86_64|linux-x86_64|linux-arm64|windows-x86_64)
                BUILD_MODE="$1"
                shift
                ;;
            logs|logs-show|logs-analyze|logs-clear)
                LOG_ACTION="$1"
                shift
                ;;
            *)
                echo -e "${RED}❌ Unknown argument: $1${NC}" >&2
                usage
                exit 1
                ;;
        esac
    done
}

# Platform detection
detect_platform() {
    local os=$(uname -s)
    local arch=$(uname -m)
    
    case "$os" in
        Darwin*)
            case "$arch" in
                arm64) echo "darwin-arm64" ;;
                x86_64) echo "darwin-x86_64" ;;
                *) echo "unknown" ;;
            esac
            ;;
        Linux*)
            case "$arch" in
                aarch64|arm64) echo "linux-arm64" ;;
                x86_64) echo "linux-x86_64" ;;
                *) echo "unknown" ;;
            esac
            ;;
        MINGW*|CYGWIN*|MSYS*)
            echo "windows-x86_64"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Check Docker availability
check_docker() {
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Check GraalVM availability
check_graalvm() {
    if command -v native-image &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Log monitoring functions (integrated from watch-mcp-logs.sh)
show_recent_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        echo -e "${BLUE}📋 Recent log entries:${NC}"
        echo "====================="
        tail -20 "$LOG_FILE"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Log file doesn't exist yet: $LOG_FILE${NC}"
    fi
}

monitor_logs() {
    echo -e "${BLUE}👀 Monitoring logs in real-time (Ctrl+C to stop)...${NC}"
    echo "=================================================="
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Show recent logs first
    show_recent_logs
    
    # Follow the log file
    tail -f "$LOG_FILE" 2>/dev/null || {
        echo "Waiting for log file to be created..."
        while [[ ! -f "$LOG_FILE" ]]; do
            sleep 1
        done
        tail -f "$LOG_FILE"
    }
}

analyze_logs() {
    if [[ ! -f "$LOG_FILE" ]]; then
        echo -e "${RED}❌ No log file found: $LOG_FILE${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📊 Log Analysis${NC}"
    echo "==============="
    
    echo "Total log entries: $(wc -l < "$LOG_FILE")"
    echo ""
    
    echo "Log levels:"
    grep -o '\(DEBUG\|INFO\|WARN\|ERROR\)' "$LOG_FILE" 2>/dev/null | sort | uniq -c || echo "No log levels found"
    echo ""
    
    echo "Recent errors:"
    grep -i error "$LOG_FILE" 2>/dev/null | tail -5 || echo "No errors found"
    echo ""
    
    echo "MCP-related entries:"
    grep -i mcp "$LOG_FILE" 2>/dev/null | tail -10 || echo "No MCP entries found"
    echo ""
    
    echo "Tool registration entries:"
    grep -i tool "$LOG_FILE" 2>/dev/null | tail -10 || echo "No tool entries found"
}

clear_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        echo -e "${BLUE}🗑️  Clearing log file...${NC}"
        > "$LOG_FILE"
        echo -e "${GREEN}✅ Log file cleared${NC}"
    else
        echo -e "${YELLOW}ℹ️  No log file to clear${NC}"
    fi
}

handle_log_action() {
    case "$LOG_ACTION" in
        logs)
            monitor_logs
            ;;
        logs-show)
            show_recent_logs
            ;;
        logs-analyze)
            analyze_logs
            ;;
        logs-clear)
            clear_logs
            ;;
    esac
}

# Setup build environment
setup_environment() {
    echo -e "${BLUE}🔧 Setting up build environment...${NC}"
    
    # Check MCP directory
    if [[ ! -d "$MCP_DIR" ]]; then
        echo -e "${RED}❌ MCP directory not found: $MCP_DIR${NC}" >&2
        exit 1
    fi
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Check GraalVM for native builds
    if ! check_graalvm; then
        echo -e "${YELLOW}⚠️  GraalVM native-image not found${NC}"
        if command -v sdk &> /dev/null; then
            echo "Consider installing with SDKMAN: sdk install java 21.0.1-graal"
        else
            echo "Visit: https://www.graalvm.org/downloads/"
        fi
        echo "Will use container builds where possible..."
    fi
    
    cd "$MCP_DIR"
}

# Build for specific platform
build_for_platform() {
    local target_platform=$1
    local output_name=$2
    local output_path=$3
    
    echo -e "${BLUE}📦 Building for $target_platform...${NC}"
    
    if [[ $CLEAN -eq 1 ]]; then
        ./gradlew clean
    fi
    
    # Determine build strategy
    local current_platform=$(detect_platform)
    local use_container=true
    local gradle_args=(build -Dquarkus.native.enabled=true)
    
    # Native build conditions
    if [[ "$target_platform" == "$current_platform" && "$target_platform" == darwin-* ]]; then
        if check_graalvm; then
            use_container=false
            echo -e "${GREEN}🍎 Using native GraalVM build${NC}"
        fi
    fi
    
    # Configure build args
    if [[ "$use_container" == true ]]; then
        gradle_args+=(-Dquarkus.native.container-build=true)
        
        # Platform-specific container images
        case "$target_platform" in
            linux-arm64)
                gradle_args+=(-Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-graalvmce-builder-image:jdk-21-arch-arm64)
                ;;
            *)
                gradle_args+=(-Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-graalvmce-builder-image:jdk-21)
                ;;
        esac
        echo -e "${GREEN}🐳 Using container build${NC}"
    else
        gradle_args+=(-Dquarkus.native.container-build=false)
    fi
    
    # Additional build args
    local extra_build_args=(--no-fallback)
    if [[ $VERBOSE -eq 1 ]]; then
        extra_build_args+=(--verbose)
    fi
    local additional_args=$(IFS=,; echo "${extra_build_args[*]}")
    gradle_args+=(-Dquarkus.native.additional-build-args="$additional_args")
    
    # Test configuration
    if [[ $SKIP_TESTS -eq 1 ]]; then
        gradle_args+=(-x test)
    fi
    
    echo -e "${BLUE}Executing: ./gradlew ${gradle_args[*]}${NC}"
    
    # Execute build
    if ./gradlew "${gradle_args[@]}"; then
        # Find the built binary
        local binary_path=$(find build -maxdepth 3 -type f -name '*-runner' -print -quit)
        
        if [[ -n "$binary_path" && -f "$binary_path" ]]; then
            # Ensure output directory exists
            mkdir -p "$(dirname "$output_path")"
            
            # Copy binary
            cp "$binary_path" "$output_path"
            chmod +x "$output_path"
            
            # Get binary size
            local binary_size=$(du -h "$output_path" | cut -f1)
            
            echo -e "${GREEN}✅ Successfully built $output_name (${binary_size})${NC}"
            echo -e "${BLUE}📍 Location: $output_path${NC}"
            return 0
        else
            echo -e "${RED}❌ Binary not found after build${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Build failed for $target_platform${NC}"
        return 1
    fi
}

# Interactive mode
interactive_build() {
    local current_platform=$(detect_platform)
    local docker_available=$(check_docker && echo "true" || echo "false")
    
    echo -e "${BLUE}🎯 Build Options:${NC}"
    echo "1. Current platform only ($current_platform)"
    echo "2. All supported platforms (requires Docker)"
    echo "3. Test build (deploy to ~/Test)"
    echo "4. Release build (all platforms for distribution)"
    echo "5. Specific platform"
    echo "6. Monitor logs only"
    echo ""
    
    read -p "Choose build option (1-6): " choice
    
    case $choice in
        1) BUILD_MODE="current" ;;
        2) BUILD_MODE="all" ;;
        3) BUILD_MODE="test" ;;
        4) BUILD_MODE="release" ;;
        5)
            echo "Available platforms:"
            echo "  darwin-arm64 (macOS Apple Silicon)"
            echo "  darwin-x86_64 (macOS Intel)"
            echo "  linux-x86_64 (Linux x86_64)"
            echo "  linux-arm64 (Linux ARM64)"
            echo "  windows-x86_64 (Windows)"
            echo ""
            read -p "Enter platform: " BUILD_MODE
            ;;
        6)
            LOG_ACTION="logs"
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
}

# Main build logic
main_build() {
    local current_platform=$(detect_platform)
    
    case "$BUILD_MODE" in
        current)
            local output_dir="${OUTPUT_DIR:-$REPO_ROOT/dist/native}"
            build_for_platform "$current_platform" "synaptik-mcp" "$output_dir/synaptik-mcp"
            
            echo ""
            echo -e "${BLUE}🚀 Usage Instructions:${NC}"
            echo "1. Start Synaptik: docker-compose up -d"
            echo "2. Configure Claude Desktop:"
            echo "   \"synaptik\": { \"command\": \"$output_dir/synaptik-mcp\" }"
            echo "3. Restart Claude Desktop"
            
            # Offer to watch logs
            if [[ $WATCH_LOGS -eq 1 ]]; then
                echo ""
                echo -e "${BLUE}📝 Starting log monitoring...${NC}"
                monitor_logs
            fi
            ;;
            
        test)
            local test_dir="$HOME/Test"
            build_for_platform "$current_platform" "synaptik-mcp" "$test_dir/synaptik-mcp"
            
            echo ""
            echo -e "${BLUE}🧪 Test Instructions:${NC}"
            cat << 'EOF'
Run MCP test:
  (printf 'Content-Length: 85\r\n\r\n{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities":{}}}' \
   ; printf 'Content-Length: 53\r\n\r\n{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}') | \
   ~/Test/synaptik-mcp

Claude VS Code settings:
"claude.mcpServers": {
  "synaptik": { "command": "~/Test/synaptik-mcp" }
}
EOF
            echo ""
            echo -e "${BLUE}📝 Logs: tail -f $LOG_FILE${NC}"
            
            # Offer to watch logs for test builds
            if [[ $WATCH_LOGS -eq 1 ]]; then
                echo ""
                echo -e "${BLUE}📝 Starting log monitoring...${NC}"
                monitor_logs
            elif [[ $INTERACTIVE -eq 1 ]]; then
                echo ""
                read -p "Monitor logs now? (y/N): " watch_choice
                if [[ "$watch_choice" =~ ^[Yy]$ ]]; then
                    monitor_logs
                fi
            fi
            ;;
            
        all|release)
            local output_dir="${OUTPUT_DIR:-$REPO_ROOT/dist/release}"
            local platforms=("linux-x86_64" "linux-arm64")
            
            # Add current platform if it's macOS
            if [[ "$current_platform" == darwin-* ]]; then
                platforms+=("$current_platform")
            fi
            
            # Check Docker for cross-compilation
            if ! check_docker; then
                echo -e "${RED}❌ Docker required for multi-platform builds${NC}"
                exit 1
            fi
            
            echo -e "${BLUE}Building for platforms: ${platforms[*]}${NC}"
            
            for platform in "${platforms[@]}"; do
                local output_name
                case "$platform" in
                    darwin-arm64) output_name="synaptik-mcp-macos-arm64" ;;
                    darwin-x86_64) output_name="synaptik-mcp-macos-x86_64" ;;
                    linux-x86_64) output_name="synaptik-mcp-linux" ;;
                    linux-arm64) output_name="synaptik-mcp-linux-arm64" ;;
                    windows-x86_64) output_name="synaptik-mcp-windows.exe" ;;
                esac
                
                build_for_platform "$platform" "$output_name" "$output_dir/$output_name"
            done
            
            echo ""
            echo -e "${BLUE}📦 Release binaries:${NC}"
            ls -lh "$output_dir"/ 2>/dev/null || echo "No binaries found"
            
            echo ""
            echo -e "${BLUE}🚀 Next steps:${NC}"
            echo "1. Test binaries on target platforms"
            echo "2. Create GitHub release: https://github.com/dukeroyahl/synaptik/releases/new"
            echo "3. Upload binaries to release"
            ;;
            
        darwin-arm64|darwin-x86_64|linux-x86_64|linux-arm64|windows-x86_64)
            local output_dir="${OUTPUT_DIR:-$REPO_ROOT/dist/platform}"
            local output_name
            case "$BUILD_MODE" in
                darwin-arm64) output_name="synaptik-mcp-macos-arm64" ;;
                darwin-x86_64) output_name="synaptik-mcp-macos-x86_64" ;;
                linux-x86_64) output_name="synaptik-mcp-linux" ;;
                linux-arm64) output_name="synaptik-mcp-linux-arm64" ;;
                windows-x86_64) output_name="synaptik-mcp-windows.exe" ;;
            esac
            
            build_for_platform "$BUILD_MODE" "$output_name" "$output_dir/$output_name"
            ;;
            
        *)
            echo -e "${RED}❌ Unknown build mode: $BUILD_MODE${NC}"
            exit 1
            ;;
    esac
}

# Main function
main() {
    echo -e "${BLUE}🧠 Synaptik MCP Build Script${NC}"
    echo "=================================="
    
    parse_args "$@"
    
    # Handle log actions first (standalone mode)
    if [[ -n "$LOG_ACTION" ]]; then
        handle_log_action
        return 0
    fi
    
    setup_environment
    
    # Handle log action from interactive mode
    if [[ -n "$LOG_ACTION" ]]; then
        handle_log_action
        return 0
    fi
    
    if [[ $INTERACTIVE -eq 1 && "$BUILD_MODE" == "current" && $# -eq 0 ]]; then
        interactive_build
        
        # Handle log action from interactive mode
        if [[ -n "$LOG_ACTION" ]]; then
            handle_log_action
            return 0
        fi
    fi
    
    main_build
    
    echo ""
    echo -e "${GREEN}🎉 Build complete!${NC}"
}

# Run main function
main "$@"
