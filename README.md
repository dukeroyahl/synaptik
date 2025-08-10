<div align="center">

# 🧠 Synaptik

[![Latest Release](https://img.shields.io/github/v/release/dukeroyahl/synaptik?logo=github&logoColor=white)](https://github.com/dukeroyahl/synaptik/releases/latest)
[![CI](https://github.com/dukeroyahl/synaptik/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dukeroyahl/synaptik/actions/workflows/ci.yml)
[![CD](https://github.com/dukeroyahl/synaptik/actions/workflows/cd.yml/badge.svg?branch=main)](https://github.com/dukeroyahl/synaptik/actions/workflows/cd.yml)
[![Java](https://img.shields.io/badge/Java-21+-orange.svg)](https://openjdk.java.net/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.6+-blue.svg)](https://quarkus.io/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![GitHub Packages](https://img.shields.io/badge/Docker-GitHub%20Packages-blue?logo=docker&logoColor=white)](https://github.com/dukeroyahl?tab=packages)
[![Frontend](https://img.shields.io/badge/Frontend-GHCR-blue?logo=github&logoColor=white)](https://github.com/dukeroyahl/synaptik/pkgs/container/synaptik%2Ffrontend)
[![Backend](https://img.shields.io/badge/Backend-GHCR-blue?logo=github&logoColor=white)](https://github.com/dukeroyahl/synaptik/pkgs/container/synaptik%2Fbackend)
[![Native Binaries](https://img.shields.io/badge/Binaries-GitHub%20Releases-green?logo=github&logoColor=white)](https://github.com/dukeroyahl/synaptik/releases/latest)
[![MCP Server](https://img.shields.io/badge/MCP%20Server-stdio-orange?logo=openai&logoColor=white)](https://github.com/dukeroyahl/synaptik/releases/latest)
[![macOS ARM64](https://img.shields.io/badge/macOS%20ARM64-Primary%20Platform-success?logo=apple&logoColor=white)](https://github.com/dukeroyahl/synaptik/releases/latest)

[🚀 Quick Start](#-quick-start) • [📚 Wiki Documentation](https://github.com/dukeroyahl/synaptik/wiki) • [🤝 Contributing](CONTRIBUTING.md)

</div>

---

## 🎯 What is Synaptik?

**Synaptik is your streamlined task management system.** Think of it as a clean, fast to-do app that focuses on getting things done without unnecessary complexity.

**Why Synaptik is Different:**
- 📝 **Simple task creation**: Type your task description - it becomes a task with medium priority, ready to work on
- 🤖 **Works with Claude**: Ask Claude to manage your tasks - it connects directly to Synaptik
- 📊 **Shows insights**: See patterns in your productivity and track progress
- ⚡ **Blazing fast**: Modern technology that won't slow you down
- 🌐 **Works anywhere**: Access from any device with a web browser

![Synaptik Application](docs/images/app-main.png)

---

## 🔄 How Tasks and Projects Work

### 📝 Task Status Cycle
Tasks in Synaptik follow a simple 3-step lifecycle:

```
📋 PENDING → ⚡ ACTIVE → ✅ COMPLETED
    ↑           ↓
    ←───────────
```

**What each status means:**
- **📋 PENDING** - Task is ready to work on (newly created or paused)
- **⚡ ACTIVE** - You're currently working on this task  
- **✅ COMPLETED** - Task is finished and done

**How to change task status:**
- **Start working**: Click "Start" → Task becomes ACTIVE
- **Take a break**: Click "Stop" → Task goes back to PENDING (you can resume later)
- **Finish task**: Click "Done" → Task becomes COMPLETED

### 📁 Project Status Cycle
Projects automatically update based on their tasks:

```
📋 PENDING → ⚡ STARTED → ✅ COMPLETED
```

**What each status means:**
- **📋 PENDING** - Project has tasks, but none are active yet
- **⚡ STARTED** - At least one task in the project is active
- **✅ COMPLETED** - All tasks in the project are completed

**Projects update automatically:**
- When you start any task → Project becomes STARTED
- When you complete all tasks → Project becomes COMPLETED
- Projects show progress (e.g., "3 of 5 tasks completed")

### 💡 Simple Example
1. Create task "Write report" → Task is PENDING, Project is PENDING
2. Click "Start" on the task → Task is ACTIVE, Project is STARTED  
3. Click "Done" when finished → Task is COMPLETED, Project is COMPLETED

**That's it!** Synaptik handles all the status updates automatically so you can focus on getting things done.

---

## 🚀 Get Started in 2 Minutes

**Step 1: Install Docker** (if you don't have it)
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop/) - it's free and easy to install

**Step 2: Install Synaptik**
Copy and paste this into your terminal:
```bash
curl -sSL https://raw.githubusercontent.com/dukeroyahl/synaptik/main/install.sh | bash
```

**Step 3: Start using Synaptik!**
- Open your browser and go to: **http://localhost:4000**
- Start adding tasks and see the magic happen ✨

> **That's it!** Synaptik is now running on your computer. The installer sets everything up automatically.

---

## 📦 GitHub Packages

<div align="left">

### 🐳 Docker Images 

**GitHub Container Registry:**
[![Frontend Image](https://img.shields.io/badge/ghcr.io%2Fdukeroyahl%2Fsynaptik%2Ffrontend-latest-blue?logo=docker&logoColor=white)](https://github.com/dukeroyahl/synaptik/pkgs/container/synaptik%2Ffrontend)
[![Backend Image](https://img.shields.io/badge/ghcr.io%2Fdukeroyahl%2Fsynaptik%2Fbackend-latest-blue?logo=docker&logoColor=white)](https://github.com/dukeroyahl/synaptik/pkgs/container/synaptik%2Fbackend)

**Docker Hub:**
[![Frontend Image](https://img.shields.io/badge/roudranil%2Fsynaptik%2Ffrontend-latest-blue?logo=docker&logoColor=white)](https://hub.docker.com/r/roudranil/synaptik)
[![Backend Image](https://img.shields.io/badge/roudranil%2Fsynaptik%2Fbackend-latest-blue?logo=docker&logoColor=white)](https://hub.docker.com/r/roudranil/synaptik)

```bash
# GitHub Container Registry
docker pull ghcr.io/dukeroyahl/synaptik/frontend:latest
docker pull ghcr.io/dukeroyahl/synaptik/backend:latest

# Docker Hub
docker pull roudranil/synaptik/frontend:latest
docker pull roudranil/synaptik/backend:latest
```

### 🔥 Native MCP Binaries (GitHub Releases)
[![macOS ARM64](https://img.shields.io/badge/macOS%20ARM64-Available-success?logo=apple&logoColor=white)](https://github.com/dukeroyahl/synaptik/releases/latest/download/synaptik-mcp-darwin-arm64)
[![Linux x86_64](https://img.shields.io/badge/Linux%20x86__64-Available-success?logo=linux&logoColor=white)](https://github.com/dukeroyahl/synaptik/releases/latest/download/synaptik-mcp-linux-amd64)

**Download pre-built binaries** from [GitHub Releases](https://github.com/dukeroyahl/synaptik/releases/latest) or **build from source**:

```bash
# Build MCP server binary for your platform
./scripts/build-mcp.sh current
# Binary will be available at: dist/native/synaptik-mcp

# For other build options (all platforms, testing, etc.)
./scripts/build-mcp.sh --help
```

</div>

---

## 🤖 Claude Desktop Integration

Enhance your productivity by connecting Synaptik with Claude Desktop. Once configured, you can ask Claude to manage your tasks directly!

### Setup Instructions

#### Step 1: Install Synaptik
```bash
# Quick install - sets up the full application
curl -sSL https://raw.githubusercontent.com/dukeroyahl/synaptik/main/install.sh | bash
```

This installs the complete Synaptik application with:
- **Web Interface**: http://localhost:4000
- **REST API**: http://localhost:8060  
- **API Documentation**: http://localhost:8060/q/swagger-ui
- **Docker Services**: Complete containerized backend

#### Step 2: Get MCP Server Binary
**Option A: Download pre-built binary** (recommended)
```bash
# Download from GitHub Releases (available for macOS ARM64, Linux x86_64)
# Visit: https://github.com/dukeroyahl/synaptik/releases/latest
```

**Option B: Build from source**
```bash
# Build MCP server binary for your platform
./scripts/build-mcp.sh current
# Binary will be available at: dist/native/synaptik-mcp

# For interactive build options
./scripts/build-mcp.sh
```

#### Step 3: Configure Claude Desktop
Add this to your Claude Desktop configuration:

**Configuration File Locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "synaptik": {
      "command": "java",
      "args": ["-jar", "/path/to/synaptik/mcp/build/quarkus-app/quarkus-run.jar"]
    }
  }
}
```

> **How it works**: The MCP server runs as a Java application in stdio mode and communicates with Claude Desktop directly, while making HTTP calls to your Dockerized Synaptik server on port 8060.

**Example paths:**
- **Linux**: `"/home/user/synaptik-mcp"`
- **macOS**: `"/Users/user/synaptik-mcp"`

#### Step 4: Ensure Synaptik is Running
Make sure your Synaptik Docker services are running:
```bash
# Check if Synaptik is running
curl http://localhost:8060/health || echo "Start Synaptik first!"
```

#### Step 5: Restart Claude Desktop
Restart Claude Desktop and you're ready to go!

### Available Claude Commands
- **Task Management**: Create, update, complete, and delete tasks
- **Smart Queries**: Get tasks by status, project, tags, or priority
- **Data Import**: Import tasks from external sources
- **Analytics**: Retrieve productivity insights and statistics

---

## 📖 Documentation

### 👥 For Users
- **[📚 Complete Wiki](https://github.com/dukeroyahl/synaptik/wiki)** - Comprehensive documentation hub
- **[User Guide](https://github.com/dukeroyahl/synaptik/wiki/User-Guide)** - Complete user documentation
- **[MCP Integration Guide](https://github.com/dukeroyahl/synaptik/wiki/MCP-Server)** - Claude Desktop setup

### 💻 For Developers  
- **[Developer Guide](https://github.com/dukeroyahl/synaptik/wiki/Developer-Guide)** - Technical documentation
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Branching Strategy](docs/BRANCHING_STRATEGY.md)** - Automated versioning and branch conventions
- **[Docker Guide](https://github.com/dukeroyahl/synaptik/wiki/Docker-Guide)** - Container deployment

---

<div align="center">

**Built with ❤️ by the Synaptik team**

[🚀 Quick Start](#-quick-start) • [📚 Wiki Documentation](https://github.com/dukeroyahl/synaptik/wiki) • [🤝 Contributing](CONTRIBUTING.md) • [📝 Issues](https://github.com/dukeroyahl/synaptik/issues)

</div>