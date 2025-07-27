<div align="center">

# 🧠 Synaptik

*Where Ideas Connect*

[![Java](https://img.shields.io/badge/Java-21+-orange.svg)](https://openjdk.java.net/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.6+-blue.svg)](https://quarkus.io/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://hub.docker.com/r/dukeroyahl/synaptik)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A next-generation task management application with TaskWarrior DNA and natural language task capture**

![Synaptik Application](https://via.placeholder.com/800x400/2D3748/FFFFFF?text=Synaptik+Dashboard+Screenshot)

[🚀 Quick Start](#-quick-start) • [📖 Wiki](WIKI.md) • [🤝 Contributing](CONTRIBUTING.md) • [📦 Docker Hub](https://hub.docker.com/r/dukeroyahl/synaptik)

</div>

---

## 🚀 Quick Start

Get Synaptik running in just 3 simple commands:

### Prerequisites
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)

### Installation (3 commands max!)

**Option 1: Super Quick Install**
```bash
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/install.sh | bash
```

**Option 2: Manual Install**
```bash
# Step 1: Download configuration
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/dist/docker-compose.yml -o docker-compose.yml

# Step 2: Create data directories and start
mkdir -p ~/.synaptik/{data,logs} && docker-compose up -d

# Step 3: Access your app at http://localhost
```

### 🌐 Access Your Application
- **Web App**: http://localhost
- **API Documentation**: http://localhost:8080/q/swagger-ui  
- **Data Location**: `~/.synaptik/` (safe from updates!)

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