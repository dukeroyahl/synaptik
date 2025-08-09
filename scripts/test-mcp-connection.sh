#!/bin/bash

# Synaptik MCP Connection Test Script
# Tests connectivity between MCP server and Synaptik API

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🔍 Synaptik MCP Connection Diagnostics"
echo "======================================"
echo ""

# Test 1: Check if Docker containers are running
log_info "Checking Docker containers..."
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(synaptik-api|synaptik-ui|synaptik-mongodb)" > /dev/null 2>&1; then
    log_success "Docker containers are running:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(synaptik-api|synaptik-ui|synaptik-mongodb)"
else
    log_error "Synaptik Docker containers are not running!"
    log_info "Start them with: docker compose -f docker/docker-compose.yml up -d"
    exit 1
fi

echo ""

# Test 2: Check API health endpoint
log_info "Testing API connectivity..."
API_URL="${SYNAPTIK_API_URL:-${SYNAPTIK_URL:-http://localhost:9001}}"
log_info "Using API URL: $API_URL"

if curl -f -s "$API_URL/q/health" > /dev/null 2>&1; then
    log_success "API is accessible at $API_URL"
    
    # Get API response
    HEALTH_RESPONSE=$(curl -s "$API_URL/q/health")
    echo "   Health check response: $HEALTH_RESPONSE"
else
    log_error "API is not accessible at $API_URL"
    
    # Try alternative URLs
    log_info "Trying alternative connection methods..."
    
    # Test with container IP
    CONTAINER_IP=$(docker inspect synaptik-api --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "")
    if [ -n "$CONTAINER_IP" ]; then
        log_info "Container IP: $CONTAINER_IP"
        if curl -f -s "http://$CONTAINER_IP:9001/q/health" > /dev/null 2>&1; then
            log_success "API accessible via container IP: http://$CONTAINER_IP:9001"
            log_warning "Set environment variable: export SYNAPTIK_API_URL=http://$CONTAINER_IP:9001"
        else
            log_error "API not accessible via container IP"
        fi
    fi
    
    # Test with host.docker.internal (if available)
    if curl -f -s "http://host.docker.internal:9001/q/health" > /dev/null 2>&1; then
        log_success "API accessible via host.docker.internal:9001"
        log_warning "Set environment variable: export SYNAPTIK_API_URL=http://host.docker.internal:9001"
    fi
fi

echo ""

# Test 3: Check port binding
log_info "Checking port bindings..."
PORT_BINDING=$(docker port synaptik-api 9001 2>/dev/null || echo "")
if [ -n "$PORT_BINDING" ]; then
    log_success "API port binding: $PORT_BINDING"
else
    log_error "No port binding found for synaptik-api:9001"
fi

echo ""

# Test 4: Network connectivity
log_info "Testing network connectivity..."
if ping -c 1 localhost > /dev/null 2>&1; then
    log_success "localhost is reachable"
else
    log_error "localhost is not reachable"
fi

# Test 5: Check if MCP binary exists and is executable
echo ""
log_info "Checking MCP binary..."

MCP_PATHS=(
    "./synaptik-mcp"
    "./mcp/build/synaptik-mcp-server-*-runner"
    "./build/synaptik-mcp-server-*-runner"
)

MCP_FOUND=false
for path in "${MCP_PATHS[@]}"; do
    if ls $path > /dev/null 2>&1; then
        MCP_BINARY=$(ls $path | head -1)
        if [ -x "$MCP_BINARY" ]; then
            log_success "Found executable MCP binary: $MCP_BINARY"
            MCP_FOUND=true
            
            # Test MCP binary with timeout
            log_info "Testing MCP binary (5 second timeout)..."
            if timeout 5s "$MCP_BINARY" --help > /dev/null 2>&1; then
                log_success "MCP binary responds to --help"
            else
                log_warning "MCP binary may not be working properly"
            fi
            break
        else
            log_warning "Found MCP binary but it's not executable: $MCP_BINARY"
            log_info "Make it executable with: chmod +x $MCP_BINARY"
        fi
    fi
done

if [ "$MCP_FOUND" = false ]; then
    log_error "No MCP binary found"
    log_info "Build it with: cd mcp && ./gradlew build -Dquarkus.package.type=native"
fi

echo ""
echo "🔧 Recommended Solutions:"
echo "========================"

if curl -f -s "$API_URL/q/health" > /dev/null 2>&1; then
    log_success "Your setup looks good! MCP should be able to connect."
    echo ""
    echo "Claude Desktop configuration:"
    echo "{"
    echo "  \"mcpServers\": {"
    echo "    \"synaptik\": {"
    echo "      \"command\": \"$MCP_BINARY\""
    echo "    }"
    echo "  }"
    echo "}"
else
    echo ""
    echo "1. Restart Docker services:"
    echo "   docker compose -f docker/docker-compose.yml restart"
    echo ""
    echo "2. Set API URL environment variable:"
    echo "   export SYNAPTIK_API_URL=http://localhost:9001"
    echo ""
    echo "3. Test API manually:"
    echo "   curl http://localhost:9001/q/health"
    echo ""
    echo "4. Check Docker logs:"
    echo "   docker logs synaptik-api"
fi

echo ""
log_info "For more help, see: https://github.com/dukeroyahl/synaptik/wiki"
