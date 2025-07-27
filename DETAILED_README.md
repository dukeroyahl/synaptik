# 🧠 Synaptik - Detailed Documentation

*This file contains the detailed documentation that was previously in README.md*

## 🌟 Overview

Synaptik combines the power of TaskWarrior with modern web technologies and AI integration. Built with Java 21 + Quarkus backend, React 18 frontend, and native AI integration through Model Context Protocol.

### ✨ Key Highlights

- **🧠 TaskWarrior DNA**: Natural language task capture - `"Buy groceries due:tomorrow +shopping priority:high"`
- **⚡ Modern Stack**: Java 21 + Quarkus reactive backend with React 18 frontend
- **🤖 AI-First**: Native Claude integration through Model Context Protocol (MCP)
- **🎨 Responsive**: Beautiful Material Design with dark/light themes
- **⚡ Real-time**: Live synchronization and reactive updates

## 🎯 Core Features

- **📊 Smart Dashboard** with productivity analytics
- **🎯 Intelligent Prioritization** using TaskWarrior's urgency algorithm  
- **📅 Advanced Scheduling** with due dates and time blocking
- **🏷️ Flexible Organization** through tags, projects, and filtering
- **🗺️ Visual Mindmaps** for project visualization
- **🤖 AI Integration** for voice commands and smart suggestions

## 🤖 AI Integration

Connect Synaptik with Claude Desktop for AI-powered task management:

### Quick MCP Setup
```bash
# Start Synaptik with Docker (includes MCP server)
./scripts/docker-build.sh
docker-compose -f docker/docker-compose.production.yml up -d

# Add to Claude Desktop config (~/.config/claude/claude_desktop_config.json)
{
  "mcpServers": {
    "synaptik": {
      "command": "curl",
      "args": ["-N", "-H", "Accept: text/event-stream", "http://localhost/mcp"],
      "env": {}
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
├── 📁 server/              # Java backend (Quarkus + MongoDB + MCP)
├── 📁 docker/              # Docker configurations and builds
├── 📁 docs/                # Documentation
├── 📁 scripts/             # Build and deployment utilities
└── 📁 dist/                # Runtime data (MongoDB, logs)
```

## 🔌 API Highlights

### Quick Examples

#### Create Task with TaskWarrior Syntax
```bash
curl -X POST http://localhost/api/tasks/capture \
  -H "Content-Type: text/plain" \
  -d "Buy groceries due:tomorrow priority:high +shopping"
```

#### List Pending Tasks
```bash
curl http://localhost/api/tasks?status=pending
```

#### Start Working on Task
```bash
curl -X POST http://localhost/api/tasks/{id}/start
```

📚 **Full API documentation**: http://localhost/q/swagger-ui

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