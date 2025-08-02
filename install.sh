#!/bin/bash

# Synaptik Installation & Update Script
# This script handles both fresh installations and updates
# Safe to run multiple times - automatically detects and handles both scenarios

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

# Configuration
SYNAPTIK_DIR="$HOME/.synaptik"
COMPOSE_URL="https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/dist/docker-compose.yml"
ENV_URL="https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/dist/docker/.env.example"
GITHUB_REPO="Dukeroyahl/synaptik"

echo "🚀 Welcome to Synaptik Installation & Update"
echo "============================================="
log_info "This script will install or update Synaptik to the latest version"

# Check if this is an update or fresh install
IS_UPDATE=false
if [ -d "$SYNAPTIK_DIR" ] && [ -f "$SYNAPTIK_DIR/docker-compose.yml" ]; then
    IS_UPDATE=true
    log_info "Existing installation detected - performing update"
else
    log_info "Fresh installation detected"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first:"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first:"
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Use docker compose if available, otherwise fall back to docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

log_success "Docker and Docker Compose are available"

# Function to check latest release version
get_latest_version() {
    local latest_version
    latest_version=$(curl -sSL "https://api.github.com/repos/$GITHUB_REPO/releases/latest" 2>/dev/null | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' || echo "unknown")
    echo "$latest_version"
}

# Function to get current installed version
get_current_version() {
    if [ -f "$SYNAPTIK_DIR/.version" ]; then
        cat "$SYNAPTIK_DIR/.version"
    else
        echo "unknown"
    fi
}

# Check versions if this is an update
if [ "$IS_UPDATE" = true ]; then
    CURRENT_VERSION=$(get_current_version)
    LATEST_VERSION=$(get_latest_version)
    
    log_info "Current version: $CURRENT_VERSION"
    log_info "Latest version: $LATEST_VERSION"
    
    if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ] && [ "$LATEST_VERSION" != "unknown" ]; then
        log_warning "You already have the latest version ($LATEST_VERSION)"
        log_info "Proceeding with re-download to ensure all files are up-to-date..."
    fi
fi

# Create or ensure Synaptik directory structure
log_info "Setting up Synaptik directory structure..."
mkdir -p "$SYNAPTIK_DIR"
cd "$SYNAPTIK_DIR"

# Create data directories
log_info "Setting up data directories..."
mkdir -p "$SYNAPTIK_DIR/data"
mkdir -p "$SYNAPTIK_DIR/logs"
mkdir -p "$SYNAPTIK_DIR/backups"
log_success "Data directories ready"

# Backup existing configuration if updating
if [ "$IS_UPDATE" = true ] && [ -f ".env" ]; then
    log_info "Backing up existing configuration..."
    cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
    log_success "Configuration backed up"
fi

# Stop existing services if running
if [ "$IS_UPDATE" = true ]; then
    log_info "Stopping existing services..."
    $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    log_success "Services stopped"
fi

# Always download latest docker-compose.yml
log_info "Downloading latest docker-compose.yml..."
if curl -sSL "$COMPOSE_URL" -o docker-compose.yml.tmp; then
    mv docker-compose.yml.tmp docker-compose.yml
    log_success "docker-compose.yml updated"
else
    log_error "Failed to download docker-compose.yml"
    exit 1
fi

# Download latest .env.example
log_info "Downloading latest environment template..."
if curl -sSL "$ENV_URL" -o .env.example.tmp; then
    mv .env.example.tmp .env.example
    log_success "Environment template updated"
else
    log_error "Failed to download .env.example"
    exit 1
fi

# Handle environment configuration
if [ ! -f ".env" ]; then
    log_info "Creating initial environment configuration..."
    cp .env.example .env
    log_success "Environment configuration created (.env)"
else
    log_info "Updating environment configuration..."
    # Merge new variables from .env.example that don't exist in .env
    while IFS= read -r line; do
        if [[ "$line" =~ ^[A-Z_]+= ]] && ! grep -q "^${line%%=*}=" .env 2>/dev/null; then
            echo "$line" >> .env
            log_info "Added new environment variable: ${line%%=*}"
        fi
    done < .env.example
    log_success "Environment configuration updated"
fi

# Save version information
LATEST_VERSION=$(get_latest_version)
if [ "$LATEST_VERSION" != "unknown" ]; then
    echo "$LATEST_VERSION" > .version
    log_success "Version information saved: $LATEST_VERSION"
fi

# Pull latest Docker images
log_info "Pulling latest Docker images..."
$DOCKER_COMPOSE_CMD pull

# Start the application
log_info "Starting Synaptik services..."
$DOCKER_COMPOSE_CMD up -d

# Wait for services to be ready
log_info "Waiting for services to start..."
sleep 5

# Check if services are running
if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    log_success "Services are running"
else
    log_warning "Some services may not have started properly"
    log_info "Check logs with: $DOCKER_COMPOSE_CMD logs"
fi

echo ""
if [ "$IS_UPDATE" = true ]; then
    echo "🎉 Synaptik successfully updated!"
    echo "==============================="
else
    echo "🎉 Synaptik installation completed!"
    echo "=================================="
fi
echo ""
echo "🌐 Access your application at:"
echo "   Frontend: http://localhost"
echo "   API:      http://localhost:9001"
echo "   API Docs: http://localhost:9001/q/swagger-ui"
echo ""
echo "📊 Management commands:"
echo "   Status:      cd $SYNAPTIK_DIR && $DOCKER_COMPOSE_CMD ps"
echo "   Logs:        cd $SYNAPTIK_DIR && $DOCKER_COMPOSE_CMD logs -f"
echo "   Stop:        cd $SYNAPTIK_DIR && $DOCKER_COMPOSE_CMD down"
echo "   Restart:     cd $SYNAPTIK_DIR && $DOCKER_COMPOSE_CMD restart"
echo "   Update:      curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/install.sh | bash"
echo ""
echo "💾 Data & Configuration:"
echo "   Installation: $SYNAPTIK_DIR"
echo "   Data:         $SYNAPTIK_DIR/data"
echo "   Logs:         $SYNAPTIK_DIR/logs"
echo "   Config:       $SYNAPTIK_DIR/.env"
echo ""
if [ "$IS_UPDATE" = true ]; then
    echo "📝 Update Notes:"
    echo "   - Configuration backed up automatically"
    echo "   - New environment variables added if needed"
    echo "   - Docker images updated to latest versions"
    echo ""
fi
echo "📖 Documentation: https://github.com/Dukeroyahl/synaptik/wiki"
echo "🐛 Issues: https://github.com/Dukeroyahl/synaptik/issues"
echo ""
log_success "Installation complete! Your data persists across updates."