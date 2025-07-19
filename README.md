<div align="center">

# 🧠 Synaptik

*Where Ideas Connect*

[![Java](https://img.shields.io/badge/Java-21+-orange.svg)](https://openjdk.java.net/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.6+-blue.svg)](https://quarkus.io/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-47A248.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A next-generation task management application that bridges the gap between powerful CLI tools and modern web interfaces**

[🚀 Quick Docker Setup](#-quick-docker-setup) • [📖 Documentation](#-documentation) • [🛠️ Development](DEVELOPMENT.md) • [📚 Wiki](WIKI.md)

</div>

---

## 🌟 Overview

Synaptik combines the power of TaskWarrior with modern web technologies and AI integration. Built with Java 21 + Quarkus backend, React 18 frontend, and native AI integration through Model Context Protocol.

### ✨ Key Highlights

- **🧠 TaskWarrior DNA**: Natural language task capture - `"Buy groceries due:tomorrow +shopping priority:high"`
- **⚡ Modern Stack**: Java 21 + Quarkus reactive backend with React 18 frontend
- **🤖 AI-First**: Native Claude integration through Model Context Protocol (MCP)
- **� Responsive**: Beautiful Material Design with dark/light themes
- **� Real-time**: Live synchronization and reactive updates

## 🎯 Core Features

- **� Smart Dashboard** with productivity analytics
- **🎯 Intelligent Prioritization** using TaskWarrior's urgency algorithm  
- **📅 Advanced Scheduling** with due dates and time blocking
- **🏷️ Flexible Organization** through tags, projects, and filtering
- **🗺️ Visual Mindmaps** for project visualization
- **🤖 AI Integration** for voice commands and smart suggestions

## 🚀 Quick Docker Setup

Get Synaptik running in minutes using Docker Desktop - no additional software installation required!

### Prerequisites
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)

### One-Command Setup
```bash
# Clone and start with Docker
git clone https://github.com/roudra/synaptik.git
cd synaptik

# Start all services with Docker Compose
docker-compose -f config/docker-compose.full.yml up -d
```

### Access Your Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/q/swagger-ui
- **Health Check**: http://localhost:8080/q/health

### Stop Services
```bash
docker-compose -f config/docker-compose.full.yml down
```

---

## 🤖 AI Integration

Connect Synaptik with Claude Desktop for AI-powered task management:

### Quick MCP Setup
```bash
# Build the MCP server
npm run mcpbuild

# Add to Claude Desktop config (~/.config/claude/claude_desktop_config.json)
{
  "mcpServers": {
    "synaptik": {
      "command": "node",
      "args": ["/path/to/synaptik/mcp-server/dist/index.js"],
      "env": {
        "SYNAPTIK_API_URL": "http://localhost:8080/api"
      }
    }
  }
}
```

### AI Capabilities
- **Natural Language Tasks**: "Create a task to review PR due tomorrow with high priority"
- **Smart Filtering**: "Show me all overdue tasks in the work project"
- **Quick Actions**: "Mark all today's completed tasks as done"
- **Project Management**: "Create a new project for website redesign"

## 📁 Project Structure

```
synaptik/
├── 📁 client/              # React frontend (TypeScript + Vite)
├── 📁 server/              # Java backend (Quarkus + MongoDB)
├── 📁 mcp-server/          # AI integration server (Node.js)
├── 📁 config/              # Docker Compose configurations
├── 📁 docs/                # Documentation
└── 📁 scripts/             # Management utilities
```

## 🔌 API Highlights

### Quick Examples

#### Create Task with TaskWarrior Syntax
```bash
curl -X POST http://localhost:8080/api/tasks/capture \
  -H "Content-Type: text/plain" \
  -d "Buy groceries due:tomorrow priority:high +shopping"
```

#### List Pending Tasks
```bash
curl http://localhost:8080/api/tasks?status=pending
```

#### Start Working on Task
```bash
curl -X POST http://localhost:8080/api/tasks/{id}/start
```

📚 **Full API documentation**: http://localhost:8080/q/swagger-ui

## 📚 Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete local development setup
- **[WIKI.md](WIKI.md)** - Comprehensive project documentation  
- **[MCP Server Guide](mcp-server/README.md)** - AI integration details
- **[API Documentation](http://localhost:8080/q/swagger-ui)** - Interactive API explorer

## 🛠️ Development

For local development with native tools (Java, Node.js, MongoDB):

```bash
# See DEVELOPMENT.md for complete setup
npm run setup  # Automated setup
npm run dev    # Start development servers
```

**Requirements**: Java 21+, Node.js 18+, MongoDB

📖 **See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed local setup**

## 🤝 Contributing

We welcome contributions! 

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit changes (`git commit -m 'feat: add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

📋 **See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines**

## 🗺️ Roadmap

### ✅ Current Release
- TaskWarrior-inspired task management
- Java/Quarkus reactive backend
- React frontend with Material-UI
- MongoDB integration  
- MCP server for AI integration

### 🚧 Next Release
- Real-time collaboration
- Advanced project management
- D3.js mindmap visualization
- Mobile responsive improvements

### 🔮 Future
- Native mobile apps
- Team management features
- Advanced analytics dashboard
- Workflow automation engine

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TaskWarrior** - Inspiration for task management principles
- **Quarkus** - Modern Java framework for cloud-native applications
- **React** - Frontend framework
- **Material-UI** - Component library
- **MongoDB** - Database solution
- **Model Context Protocol** - AI integration standard

---

<div align="center">

**Built with ❤️ by the Synaptik team**

[Report Bug](https://github.com/roudra/synaptik/issues) • [Request Feature](https://github.com/roudra/synaptik/issues) • [Documentation](WIKI.md) • [Dev Documentation](DEVELOPMENT.md)

</div>
