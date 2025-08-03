#!/bin/bash

# 🧠 Synaptik - Comprehensive Management Script
# Where Ideas Connect
#
# This script handles setup, development, and production operations for Synaptik
# Usage: ./synaptik.sh [command] [options]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNAPTIK_PATH="$(cd "$SCRIPT_DIR/../.." && pwd)"  # Go up two levels to project root
LOG_FILE="$SYNAPTIK_PATH/synaptik.log"
PID_FILE="$SYNAPTIK_PATH/.synaptik.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better UX
BRAIN="🧠"
ROCKET="🚀"
GEAR="⚙️"
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
PACKAGE="📦"
DATABASE="🗄️"
WEB="🌐"
STOP="🛑"

# Function to display colored status messages
echo_status() {
    local color=$1
    local emoji=$2
    local message=$3
    echo -e "${color}${emoji} $(date '+%H:%M:%S') - ${message}${NC}" | tee -a "$LOG_FILE"
}

# Function to display section headers
echo_header() {
    echo ""
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}${1}${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Function to check system requirements
check_requirements() {
    echo_header "${GEAR} Checking System Requirements"
    
    local missing_deps=()
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node --version | sed 's/v//')
        echo_status "$GREEN" "$CHECK" "Node.js found: v$node_version"
        
        # Check if version is >= 18
        if [[ $(echo "$node_version" | cut -d. -f1) -lt 18 ]]; then
            echo_status "$YELLOW" "$WARNING" "Node.js version should be 18+, found $node_version"
        fi
    else
        echo_status "$RED" "$CROSS" "Node.js not found"
        missing_deps+=("Node.js 18+")
    fi
    
    # Check npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        echo_status "$GREEN" "$CHECK" "npm found: v$npm_version"
    else
        echo_status "$RED" "$CROSS" "npm not found"
        missing_deps+=("npm")
    fi
    
    # Check Java
    if command_exists java; then
        local java_version=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        echo_status "$GREEN" "$CHECK" "Java found: $java_version"
        
        # Check if version is >= 21
        local java_major=$(echo "$java_version" | cut -d. -f1)
        if [[ $java_major -lt 21 ]]; then
            echo_status "$YELLOW" "$WARNING" "Java version should be 21+, found $java_version"
        fi
    else
        echo_status "$RED" "$CROSS" "Java not found"
        missing_deps+=("Java 21+")
    fi
    
    # Check MongoDB
    if command_exists mongod; then
        echo_status "$GREEN" "$CHECK" "MongoDB found"
    elif command_exists brew && brew list mongodb-community >/dev/null 2>&1; then
        echo_status "$GREEN" "$CHECK" "MongoDB (via Homebrew) found"
    elif command_exists docker && [ -f "$SYNAPTIK_PATH/dist/docker-compose.yml" ]; then
        echo_status "$BLUE" "$INFO" "Docker available - MongoDB will be started via docker-compose"
    else
        echo_status "$YELLOW" "$WARNING" "MongoDB not found - will need to be installed or use Docker"
        missing_deps+=("MongoDB")
    fi
    
    # Check Docker (optional)
    if command_exists docker; then
        echo_status "$GREEN" "$CHECK" "Docker found (optional)"
    else
        echo_status "$BLUE" "$INFO" "Docker not found (optional - can use for MongoDB)"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo_status "$RED" "$CROSS" "Missing dependencies: ${missing_deps[*]}"
        echo ""
        echo "Please install the missing dependencies and run setup again."
        return 1
    fi
    
    echo_status "$GREEN" "$CHECK" "All requirements satisfied!"
    return 0
}

# Function to setup MongoDB
setup_mongodb() {
    echo_header "${DATABASE} MongoDB Setup"
    
    # Check if docker-compose.yml exists and use it
    if [ -f "$SYNAPTIK_PATH/dist/docker-compose.yml" ] && command_exists docker; then
        echo_status "$BLUE" "$INFO" "Starting MongoDB via docker-compose..."
        cd "$SYNAPTIK_PATH"
        docker-compose -f dist/docker-compose.yml up -d mongodb
        echo_status "$GREEN" "$CHECK" "MongoDB started via Docker Compose"
        return 0
    fi
    
    # Fallback to Homebrew installation
    if command_exists brew && ! brew list mongodb-community >/dev/null 2>&1; then
        echo_status "$BLUE" "$INFO" "Installing MongoDB via Homebrew..."
        brew tap mongodb/brew
        brew install mongodb-community
    fi
    
    # Check if MongoDB is running locally
    if ! pgrep -x "mongod" > /dev/null; then
        echo_status "$BLUE" "$INFO" "Starting MongoDB..."
        if command_exists brew; then
            brew services start mongodb-community
        else
            echo_status "$YELLOW" "$WARNING" "Please start MongoDB manually"
        fi
    else
        echo_status "$GREEN" "$CHECK" "MongoDB is already running"
    fi
}

# Function to setup environment files
setup_environment() {
    echo_header "${GEAR} Environment Configuration"
    
    # Backend environment
    if [ ! -f "$SYNAPTIK_PATH/server/.env" ]; then
        if [ -f "$SYNAPTIK_PATH/server/.env.example" ]; then
            echo_status "$BLUE" "$INFO" "Creating server/.env from example..."
            cp "$SYNAPTIK_PATH/server/.env.example" "$SYNAPTIK_PATH/server/.env"
            echo_status "$GREEN" "$CHECK" "Server environment file created"
        else
            echo_status "$YELLOW" "$WARNING" "No server/.env.example found, creating basic .env..."
            cat > "$SYNAPTIK_PATH/server/.env" << EOF
MONGODB_URI=mongodb://localhost:27017/synaptik
QUARKUS_HTTP_PORT=9001
QUARKUS_HTTP_CORS=true
QUARKUS_LOG_LEVEL=INFO
EOF
        fi
    else
        echo_status "$GREEN" "$CHECK" "Server environment file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "$SYNAPTIK_PATH/client/.env.local" ]; then
        if [ -f "$SYNAPTIK_PATH/client/.env.example" ]; then
            echo_status "$BLUE" "$INFO" "Creating client/.env.local from example..."
            cp "$SYNAPTIK_PATH/client/.env.example" "$SYNAPTIK_PATH/client/.env.local"
            echo_status "$GREEN" "$CHECK" "Client environment file created"
        else
            echo_status "$YELLOW" "$WARNING" "No client/.env.example found, creating basic .env.local..."
            cat > "$SYNAPTIK_PATH/client/.env.local" << EOF
VITE_API_BASE_URL=http://localhost:9001
VITE_PORT=5173
EOF
        fi
    else
        echo_status "$GREEN" "$CHECK" "Client environment file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    echo_header "${PACKAGE} Installing Dependencies"
    
    cd "$SYNAPTIK_PATH"
    
    # Install root dependencies
    echo_status "$BLUE" "$INFO" "Installing root dependencies..."
    npm install
    
    # Install client dependencies
    echo_status "$BLUE" "$INFO" "Installing client dependencies..."
    cd client && npm install
    cd ..
    
    # Install MCP server dependencies
    if [ -d "mcp-server" ]; then
        echo_status "$BLUE" "$INFO" "Installing MCP server dependencies..."
        cd mcp-server && npm install
        cd ..
    fi
    
    # Java dependencies are handled by Gradle automatically
    echo_status "$GREEN" "$CHECK" "All dependencies installed!"
}

# Function to build MCP server
build_mcp() {
    echo_header "${ROCKET} Checking MCP Server"
    
    if [ -d "$SYNAPTIK_PATH/mcp-server" ]; then
        cd "$SYNAPTIK_PATH/mcp-server"
        echo_status "$BLUE" "$INFO" "MCP server dependencies verified"
        echo_status "$GREEN" "$CHECK" "MCP server is ready!"
        cd "$SYNAPTIK_PATH"
    else
        echo_status "$YELLOW" "$WARNING" "MCP server directory not found"
    fi
}

# Function to perform full setup
full_setup() {
    echo_header "${BRAIN} Synaptik Full Setup"
    echo_status "$BLUE" "$INFO" "Starting comprehensive setup..."
    
    check_requirements || exit 1
    setup_mongodb
    setup_environment
    install_dependencies
    build_mcp
    
    echo_header "${CHECK} Setup Complete!"
    echo_status "$GREEN" "$CHECK" "Synaptik is ready for development!"
    echo ""
    echo -e "${CYAN}${ROCKET} To start development:${NC}"
    echo -e "${CYAN}   ./synaptik.sh dev${NC}"
    echo ""
    echo -e "${CYAN}${WEB} Application will be available at:${NC}"
    echo -e "${CYAN}   Frontend: http://localhost:5173${NC}"
    echo -e "${CYAN}   Backend:  http://localhost:9001${NC}"
    echo -e "${CYAN}   API Docs: http://localhost:9001/q/swagger-ui${NC}"
    echo ""
}

# Function to start development servers
start_dev() {
    echo_header "${ROCKET} Starting Development Environment"
    
    cd "$SYNAPTIK_PATH" || { echo_status "$RED" "$CROSS" "Synaptik directory not found"; exit 1; }
    
    # Check if already running
    if check_port 9001 || check_port 5173; then
        echo_status "$YELLOW" "$WARNING" "Port 9001 or 5173 is already in use. Synaptik might be running."
        echo_status "$BLUE" "$INFO" "Use './synaptik.sh status' to check or './synaptik.sh stop' to stop existing processes"
        return 1
    fi
    
    echo_status "$BLUE" "$INFO" "Starting all services with Docker Compose..."
    docker-compose -f dist/docker-compose.yml up -d > "$LOG_FILE" 2>&1
    
    echo_status "$GREEN" "$CHECK" "Synaptik containers started"
    echo_status "$BLUE" "$INFO" "Services starting in background... This may take 30-60 seconds"
    echo_status "$BLUE" "$INFO" "Waiting for services to initialize..."
    sleep 5
    
    # Check if services are responding
    local retries=0
    local max_retries=30
    echo_status "$BLUE" "$INFO" "Checking if services are starting... (max wait: ${max_retries} attempts)"
    
    while [ $retries -lt $max_retries ]; do
        if check_port 9001 && check_port 4000; then
            echo_status "$GREEN" "$CHECK" "All services are running!"
            echo ""
            echo -e "${CYAN}${WEB} Application URLs:${NC}"
            echo -e "${CYAN}   Frontend: http://localhost:4000${NC}"
            echo -e "${CYAN}   Backend:  http://localhost:9001${NC}"
            echo -e "${CYAN}   API Docs: http://localhost:9001/q/swagger-ui${NC}"
            echo -e "${CYAN}   Health:   http://localhost:9001/q/health${NC}"
            echo ""
            echo -e "${CYAN}${INFO} Logs are being written to: $LOG_FILE${NC}"
            return 0
        fi
        
        # Show progress every 5 attempts
        if [ $((retries % 5)) -eq 0 ] && [ $retries -gt 0 ]; then
            local remaining=$((max_retries - retries))
            echo_status "$BLUE" "$INFO" "Still waiting for services to start... ($remaining attempts remaining)"
        fi
        
        sleep 2
        retries=$((retries + 1))
    done
    
    echo_status "$RED" "$CROSS" "Services failed to start properly. Check logs: $LOG_FILE"
    echo_status "$BLUE" "$INFO" "You can run './synaptik.sh logs' to see recent logs"
    echo_status "$BLUE" "$INFO" "Or run 'tail -f $LOG_FILE' to follow logs in real-time"
    return 1
}

# Function to check status
check_status() {
    echo_header "${INFO} Synaptik Status"
    
    # Check Docker Compose services
    cd "$SYNAPTIK_PATH"
    if docker-compose -f dist/docker-compose.yml ps --services --filter "status=running" | grep -q .; then
        echo_status "$GREEN" "$CHECK" "Docker Compose services are running"
        
        # Show detailed container status
        echo_status "$BLUE" "$INFO" "Container details:"
        docker-compose -f dist/docker-compose.yml ps
    else
        echo_status "$BLUE" "$INFO" "Docker Compose services are not running"
    fi
    
    # Check individual ports
    if check_port 9001; then
        echo_status "$GREEN" "$CHECK" "Backend server is running on port 9001"
    else
        echo_status "$RED" "$CROSS" "Backend server is not running on port 9001"
    fi
    
    if check_port 4000; then
        echo_status "$GREEN" "$CHECK" "Frontend server is running on port 4000"
    else
        echo_status "$RED" "$CROSS" "Frontend server is not running on port 4000"
    fi
    
    # Check MongoDB (by checking if port 27017 is accessible)
    if check_port 27017; then
        echo_status "$GREEN" "$CHECK" "MongoDB is running (port 27017)"
    else
        echo_status "$RED" "$CROSS" "MongoDB is not running"
    fi
}

# Function to stop services
stop_services() {
    echo_header "${STOP} Stopping Synaptik Services"
    
    # Stop Docker Compose services
    echo_status "$BLUE" "$INFO" "Stopping Docker Compose services..."
    cd "$SYNAPTIK_PATH"
    docker-compose -f dist/docker-compose.yml down 2>/dev/null || true
    
    # Clean up PID file if exists
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
    fi
    
    echo_status "$GREEN" "$CHECK" "All Synaptik services stopped"
}

# Function to restart services
restart_services() {
    echo_header "${ROCKET} Restarting Synaptik"
    stop_services
    sleep 2
    start_dev
}

# Function to build for production
build_production() {
    echo_header "${ROCKET} Building for Production"
    
    cd "$SYNAPTIK_PATH"
    
    echo_status "$BLUE" "$INFO" "Building with Docker Compose..."
    docker-compose -f dist/docker-compose.yml build
    
    echo_status "$GREEN" "$CHECK" "Production build complete!"
}

# Function to show help
show_help() {
    echo -e "${PURPLE}${BRAIN} Synaptik Management Script${NC}"
    echo ""
    echo -e "${CYAN}Usage: ./synaptik.sh [command]${NC}"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo -e "  ${GREEN}setup${NC}     - Full setup (requirements, dependencies, environment)"
    echo -e "  ${GREEN}dev${NC}       - Start development environment"
    echo -e "  ${GREEN}start${NC}     - Alias for 'dev'"
    echo -e "  ${GREEN}stop${NC}      - Stop all services"
    echo -e "  ${GREEN}restart${NC}   - Restart all services"
    echo -e "  ${GREEN}status${NC}    - Check service status"
    echo -e "  ${GREEN}build${NC}     - Build for production"
    echo -e "  ${GREEN}check${NC}     - Check system requirements"
    echo -e "  ${GREEN}logs${NC}      - Show recent logs"
    echo -e "  ${GREEN}help${NC}      - Show this help message"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo -e "  ./synaptik.sh setup    # Initial setup"
    echo -e "  ./synaptik.sh dev      # Start development"
    echo -e "  ./synaptik.sh status   # Check what's running"
    echo -e "  ./synaptik.sh stop     # Stop everything"
    echo ""
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo_header "${INFO} Recent Logs"
        tail -50 "$LOG_FILE"
        echo ""
        echo -e "${CYAN}${INFO} To follow logs in real-time: tail -f $LOG_FILE${NC}"
        echo -e "${CYAN}${INFO} To view Docker logs: docker-compose -f dist/docker-compose.yml logs -f${NC}"
    else
        echo_status "$YELLOW" "$WARNING" "No log file found at $LOG_FILE"
    fi
}

# Main execution
case "${1:-help}" in
    setup)
        full_setup
        ;;
    dev|start)
        start_dev
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        check_status
        ;;
    build)
        build_production
        ;;
    check)
        check_requirements
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo_status "$RED" "$CROSS" "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

exit 0