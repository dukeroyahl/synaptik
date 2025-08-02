<div align="center">

# 🧠 Synaptik

*Where Ideas Connect*

[![Java](https://img.shields.io/badge/Java-21+-orange.svg)](https://openjdk.java.net/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.6+-blue.svg)](https://quarkus.io/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/docker/pulls/roudranil/synaptik?logo=docker&color=2496ED)](https://hub.docker.com/r/roudranil/synaptik)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A next-generation task management application with TaskWarrior DNA and natural language task capture**

![Synaptik Application](https://via.placeholder.com/800x400/2D3748/FFFFFF?text=Synaptik+Dashboard+Screenshot)

[🚀 Quick Start](#-quick-start) • [📖 Documentation](docs/WIKI.md) • [🤝 Contributing](CONTRIBUTING.md) • [📦 Docker Hub](https://hub.docker.com/r/roudranil/synaptik)

</div>

---

## 🎯 What is Synaptik?

Synaptik combines **TaskWarrior's power** with **modern web technologies** and **AI integration**:

- 🧠 **TaskWarrior DNA**: Natural language task capture
- ⚡ **Modern Stack**: Java 21 + Quarkus + React 18
- 🤖 **AI-First**: Native Claude integration via MCP
- 📊 **Smart Analytics**: Productivity insights and dashboards
- 🐳 **Container-Ready**: Multi-architecture Docker images with semantic versioning

---

## 🚀 Quick Start

Get Synaptik running in just 3 simple commands:

### Prerequisites
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)

### Installation Options

**Option 1: Super Quick Install (Recommended for Users)**
```bash
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/install.sh | bash
```

**Option 2: Manual Install (Stable Version for Users)**
```bash
# Step 1: Download configuration
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/dist/docker-compose.yml -o docker-compose.yml

# Step 2: Create data directories and start
mkdir -p ~/.synaptik/{data,logs} && docker-compose up -d
```

**Option 3: Development Install (For Developers)**
```bash
# Download development configuration (builds from source)
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/dist/docker-compose.dev.yml -o docker-compose.dev.yml

# Start development environment with hot reload
mkdir -p ~/.synaptik/{data,logs} && docker-compose -f docker-compose.dev.yml up -d
```

**Option 4: Production Install (For Production Deployments)**
```bash
# Download production configuration with resource limits
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/dist/docker-compose.prod.yml -o docker-compose.prod.yml

# Edit the version in docker-compose.prod.yml to your desired version
# Then start the application
mkdir -p ~/.synaptik/{data,logs} && docker-compose -f docker-compose.prod.yml up -d
```

### 🏷️ Version Selection

📋 **[View Docker Tag Selection Guide & Changelog](docs/CHANGELOG.md#docker-tag-selection-guide)** - Choose the right version for your needs

**Quick Reference:**
- **Production**: Use exact versions (e.g., `roudranil/synaptik:1.2.3`)
- **Development**: Use `roudranil/synaptik:latest`
- **Stable**: Use minor versions (e.g., `roudranil/synaptik:1.2`) for patch updates

### 🌐 Access Your Application
- **Web App**: http://localhost
- **API Documentation**: http://localhost:8080/q/swagger-ui  
- **Data Location**: `~/.synaptik/` (safe from updates!)

---

## 🐳 Docker Usage

### Quick Commands
```bash
# Run latest version
docker run -p 8080:8080 roudranil/synaptik:latest

# Run specific version (recommended for production)
docker run -p 8080:8080 roudranil/synaptik:1.2.3

# Run with persistent data
docker run -p 8080:8080 -v ~/.synaptik:/opt/synaptik roudranil/synaptik:1.2.3
```

### Available Tags
Visit [Docker Hub](https://hub.docker.com/r/roudranil/synaptik/tags) to see all available versions.

### Version History
- **Latest**: Always the most recent stable release
- **1.x**: Current major version with latest features
- **1.2.x**: Latest patch releases for version 1.2
- **1.2.3**: Exact version 1.2.3 (example)

---

## 🤖 AI Integration

Connect Synaptik with Claude Desktop or Amazon Q using MCP (Model Context Protocol):

**Claude Desktop Setup** - Add to MCP settings:
```json
{
  "mcpServers": {
    "synaptik": {
      "command": "docker",
      "args": ["exec", "-i", "synaptik-backend", "java", "-cp", "/opt/synaptik", "org.dukeroyahl.synaptik.mcp.SynaptikMcpService"],
      "env": {}
    }
  }
}
```

**Amazon Q / Other MCP Assistants** - Use endpoint: `http://localhost:8080/mcp`

---

## 📖 Documentation

### 👥 For Users
- **[User Guide](docs/WIKI.md#user-guide)** - Complete user documentation
- **[Docker Usage](docs/WIKI.md#docker-usage)** - Using published Docker images
- **[Quick Start Tutorial](docs/WIKI.md#quick-start)** - Get started in minutes

### 💻 For Contributors  
- **[Developer Guide](docs/WIKI.md#developer-guide)** - Technical documentation
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Development Setup](DEVELOPMENT.md)** - Local development environment

---

## 🛠️ Development & Deployment

### Building Docker Images

**For Developers:**
```bash
# Build with semantic versioning
./scripts/build-docker.sh 1.2.3

# Push to Docker Hub
./scripts/push-docker.sh 1.2.3
```

**Automated Releases:**
- Push a git tag (e.g., `v1.2.3`) to trigger automated Docker builds
- GitHub Actions will build and push multi-architecture images
- Releases are automatically created with Docker Hub links

### Release Process
1. **Create a git tag**: `git tag v1.2.3 && git push origin v1.2.3`
2. **GitHub Actions builds**: Automatically builds and pushes Docker images
3. **Multiple tags created**: `1.2.3`, `1.2`, `1`, `latest`
4. **Release notes**: Auto-generated with Docker Hub links

---

<div align="center">

**Built with ❤️ by the Synaptik team**

[🚀 Quick Start](#-quick-start) • [📖 Documentation](docs/WIKI.md) • [🤝 Contributing](CONTRIBUTING.md) • [📦 Docker Hub](https://hub.docker.com/r/roudranil/synaptik) • [📝 Issues](https://github.com/roudranil/synaptik/issues)

</div>