# 🚀 Synaptik Quick Start Guide

Get up and running with Synaptik in minutes!

## 📋 Prerequisites

- **Java 21+** for backend
- **Node.js 18+** for frontend and MCP server  
- **Docker** for database (recommended)
- **Git** for source control

## ⚡ Quick Setup

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/your-username/synaptik.git
cd synaptik

# Run automatic setup
npm run setup
```

### 2. Start Development
```bash
# Start all services
npm run dev
```

### 3. Access Applications
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/q/swagger-ui
- **Database Admin**: http://localhost:8081

## 🎯 First Steps

### Create Your First Task
1. Open http://localhost:5173
2. Click "Add Task" or use quick capture
3. Try TaskWarrior syntax: `"Buy groceries due:tomorrow +shopping priority:high"`

### Explore Features
- **Dashboard**: Overview of all tasks
- **Calendar**: Visual task scheduling
- **Matrix**: Eisenhower prioritization
- **Projects**: Group related tasks

### AI Integration
1. Build MCP server: `npm run mcpbuild`
2. Configure Claude Desktop (see [AI Integration Guide](../development/AI-README.md))
3. Use natural language with AI: "Create a task to review code tomorrow"

## 🐳 Docker Deployment

### Full Stack (Production-like)
```bash
# Build and start everything in containers
npm run docker:full:build

# Access at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8080
```

### Development (MongoDB only)
```bash
# Start just MongoDB for local development
npm run docker:up

# Then run apps locally
npm run dev
```

## 🔧 Troubleshooting

### Port Conflicts
```bash
# Check what's running
npm run status

# Stop services
npm run stop
```

### MongoDB Issues
```bash
# Restart database
npm run docker:down
npm run docker:up
```

### Build Issues
```bash
# Clean install
rm -rf node_modules client/node_modules mcp-server/node_modules
npm run install:all
```

## 📚 Next Steps

- Read the [Contributing Guide](../../CONTRIBUTING.md)
- Check out [Deployment Options](../deployment/DEPLOYMENT.md)
- Explore [API Documentation](../api/)
- Join our [Community Discussions](https://github.com/your-username/synaptik/discussions)

## 🆘 Need Help?

- **Documentation**: Check `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/your-username/synaptik/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/synaptik/discussions)

---

**Happy task managing! 🧠✨**