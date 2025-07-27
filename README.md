<div align="center">

# 🧠 Synaptik

*Where Ideas Connect*

[![Java](https://img.shields.io/badge/Java-21+-orange.svg)](https://openjdk.java.net/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.6+-blue.svg)](https://quarkus.io/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://hub.docker.com/r/dukeroyahl/synaptik)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A next-generation task management application with AI integration**

![Synaptik Application](https://via.placeholder.com/800x400/2D3748/FFFFFF?text=Synaptik+Dashboard+Screenshot)

[🚀 Quick Start](#-quick-start) • [📖 Wiki](WIKI.md) • [🤝 Contributing](CONTRIBUTING.md) • [📦 Docker Hub](https://hub.docker.com/r/dukeroyahl/synaptik)

</div>

---

## 🚀 Quick Start

Get Synaptik running in 30 seconds with Docker:

### Prerequisites
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)

### One-Command Setup
```bash
# Pull and run from Docker Hub
docker run -d \
  --name synaptik \
  -p 80:80 \
  -v $HOME/.synaptik/data:/data/db \
  -v $HOME/.synaptik/logs:/var/log/synaptik \
  --restart unless-stopped \
  dukeroyahl/synaptik:latest
```

### Access Your Application
- **Web App**: http://localhost
- **API Documentation**: http://localhost/q/swagger-ui
- **Health Check**: http://localhost/health
- **MCP Server**: http://localhost/mcp (for Claude Desktop)
- **Data Location**: `~/.synaptik/` (in your home directory)

---

## 📖 Documentation

### 👥 For Users
- **[Wiki - User Guide](WIKI.md#user-guide)** - Complete user documentation
- **[Docker Usage Guide](docs/deployment/DOCKER_HUB_USAGE.md)** - Using published Docker images
- **[Quick Start Tutorial](WIKI.md#quick-start)** - Get started in minutes

### 💻 For Contributors  
- **[Wiki - Developer Guide](WIKI.md#developer-guide)** - Technical documentation
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Development Setup](DEVELOPMENT.md)** - Local development environment

---

## 🎯 What is Synaptik?

Synaptik combines **TaskWarrior's power** with **modern web technologies** and **AI integration**:

- 🧠 **TaskWarrior DNA**: Natural language task capture
- ⚡ **Modern Stack**: Java 21 + Quarkus + React 18
- 🤖 **AI-First**: Native Claude integration via MCP
- 📊 **Smart Analytics**: Productivity insights and dashboards

---

<div align="center">

**Built with ❤️ by the Synaptik team**

[📖 Wiki](WIKI.md) • [🐳 Docker Hub](https://hub.docker.com/r/dukeroyahl/synaptik) • [📝 Issues](https://github.com/dukeroyahl/synaptik/issues) • [🤝 Contributing](CONTRIBUTING.md)

</div>