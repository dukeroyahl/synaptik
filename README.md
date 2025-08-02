<div align="center">

# 🧠 Synaptik

[![Java](https://img.shields.io/badge/Java-21+-orange.svg)](https://openjdk.java.net/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.6+-blue.svg)](https://quarkus.io/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/docker/pulls/roudranil/synaptik?logo=docker&color=2496ED)](https://hub.docker.com/r/roudranil/synaptik)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[🚀 Quick Start](#-quick-start) • [� Wiki Documentation](https://github.com/Dukeroyahl/Synaptik/wiki) • [🤝 Contributing](CONTRIBUTING.md)

</div>

---

## 🎯 What is Synaptik?

**Synaptik** is where ideas connect—a next-generation task management application that combines TaskWarrior's powerful DNA with modern web technologies and AI integration. Built for productivity enthusiasts who need more than simple to-do lists, Synaptik offers natural language task capture, intelligent analytics, and seamless integration with AI assistants like Claude.

**Key Features:**
- 🧠 **TaskWarrior DNA**: Natural language task capture and powerful task management
- ⚡ **Modern Stack**: Java 21 + Quarkus + React 18 for blazing-fast performance
- 🤖 **AI-First**: Native Claude integration via Model Context Protocol (MCP)
- 📊 **Smart Analytics**: Productivity insights and intelligent dashboards
- 🐳 **Container-Ready**: Multi-architecture Docker images with semantic versioning

![Synaptik Application](https://via.placeholder.com/800x400/2D3748/FFFFFF?text=Synaptik+Dashboard+Screenshot)

---

## 🚀 Quick Start

Get Synaptik running in under 2 minutes with Docker:

### Prerequisites
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)

### Installation Options

**Option 1: One-Click Install (Recommended)**
```bash
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/install.sh | bash
```

**Option 2: Docker Compose (Production-Ready)**
```bash
# Create dedicated folder, download configuration files and start
mkdir synaptik && cd synaptik && \
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/dist/docker-compose.yml -o docker-compose.yml && \
curl -sSL https://raw.githubusercontent.com/Dukeroyahl/synaptik/main/.env.example -o .env && \
docker-compose up -d
```

### 🌐 Access Your Application
- **Web App**: http://localhost:3000
- **API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/q/swagger-ui


---

## 🤖 AI Integration

Connect Synaptik with Claude Desktop or other AI assistants using MCP (Model Context Protocol):

### Claude Desktop Setup
1. **Start Synaptik first** (using Option 1 or 2 from Quick Start above)
2. **Add this to your Claude Desktop MCP configuration:**

```json
{
  "mcpServers": {
    "synaptik": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "SYNAPTIK_URL",
        "roudranil/synaptik:mcp-server-latest"
      ],
      "env": {
        "SYNAPTIK_URL": "http://host.docker.internal:8080"
      }
    }
  }
}
```

3. **Restart Claude Desktop** to load the MCP server

### Available MCP Tools
- **Task Management**: Create, update, complete, and delete tasks
- **Smart Queries**: Get tasks by status, project, tags, or priority
- **Data Import**: Import tasks from external sources
- **Analytics**: Retrieve productivity insights and statistics

---

## 📖 Documentation

### 👥 For Users
- **[📚 Complete Wiki](https://github.com/Dukeroyahl/Synaptik/wiki)** - Comprehensive documentation hub
- **[User Guide](https://github.com/Dukeroyahl/Synaptik/wiki/User-Guide)** - Complete user documentation
- **[MCP Integration Guide](https://github.com/Dukeroyahl/Synaptik/wiki/MCP-Server)** - Claude Desktop setup

### 💻 For Developers  
- **[Developer Guide](https://github.com/Dukeroyahl/Synaptik/wiki/Developer-Guide)** - Technical documentation
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Docker Guide](https://github.com/Dukeroyahl/Synaptik/wiki/Docker-Guide)** - Container deployment

---

<div align="center">

**Built with ❤️ by the Synaptik team**

[🚀 Quick Start](#-quick-start) • [� Wiki Documentation](https://github.com/Dukeroyahl/Synaptik/wiki) • [🤝 Contributing](CONTRIBUTING.md) • [📝 Issues](https://github.com/Dukeroyahl/Synaptik/issues)

</div>