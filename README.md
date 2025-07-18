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

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🤖 AI Integration](#-ai-integration) • [🛠️ Development](#-development)

</div>

---

## 🌟 Overview

Synaptik is a comprehensive task management application that combines the power of TaskWarrior with modern web technologies and AI integration. The name "Synaptik" merges "synapse" (neural connections) with "tactic" (strategic planning), representing how ideas and projects interconnect in your mind.

### ✨ What Makes Synaptik Special

- **🧠 TaskWarrior DNA**: Built on proven task management principles with natural language capture
- **⚡ Modern Architecture**: Java 21 + Quarkus backend with React 18 frontend for enterprise-grade performance
- **🤖 AI-First Design**: Native AI integration through Model Context Protocol (MCP)
- **🔄 Reactive Everything**: Non-blocking, reactive programming throughout the stack
- **📱 Cross-Platform**: Web-based with mobile-responsive design
- **🎨 Beautiful UI**: Material Design with sophisticated dark/light themes

## 🎯 Features

### Core Task Management
- **📊 Smart Dashboard**: Comprehensive overview with analytics and insights
- **📝 TaskWarrior Integration**: Natural language task capture and management
- **🎯 Intelligent Prioritization**: Automatic urgency calculation based on multiple factors
- **📅 Advanced Scheduling**: Due dates, recurring tasks, and time blocking
- **🏷️ Flexible Organization**: Tags, projects, and custom filtering
- **📈 Progress Tracking**: Visual progress indicators and completion analytics

### TaskWarrior-Inspired Features
- **🔢 Automatic Urgency**: Smart calculation based on priority, due dates, age, and tags
- **📋 Multiple Views**: Pending, active, overdue, today, and custom filtered views
- **🎯 Natural Language**: "Buy groceries due:tomorrow +shopping priority:high"
- **📊 Advanced Filtering**: Complex queries with multiple criteria
- **🔄 State Management**: Proper task lifecycle with validation
- **📝 Annotations**: Rich task history and notes

### Modern Web Features
- ** Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **⚡ Real-time Updates**: Live synchronization across all devices
- **🔍 Powerful Search**: Full-text search across tasks and projects
- **📊 Visual Analytics**: Charts, graphs, and productivity insights

### AI Integration & Automation
- **🤖 MCP Server**: Model Context Protocol for AI assistant integration
- **🗣️ Voice Commands**: Natural language task creation through AI
- **🧠 Smart Suggestions**: AI-powered task prioritization and scheduling
- **📧 Email Integration**: Convert emails to tasks automatically
- **📋 Meeting Notes**: Extract action items from meeting transcripts
- **🔄 Workflow Automation**: Custom rules and automated task management

### Project & Mindmap Management
- **📁 Project Hierarchy**: Organize tasks into projects and sub-projects
- **🗺️ Visual Mindmaps**: D3.js-powered interactive project visualization
- **👥 Collaboration**: Multi-user support with role-based permissions
- **📊 Project Analytics**: Progress tracking and milestone management
- **🔗 Task Dependencies**: Manage complex project relationships
- **📈 Gantt Charts**: Timeline visualization for project planning

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Java 21 + Quarkus + Reactive Programming
- **Database**: MongoDB + Panache (Reactive)
- **UI Framework**: Material-UI + Custom components
- **State Management**: Zustand
- **API**: RESTful API with JAX-RS and OpenAPI
- **MCP Server**: Node.js + TypeScript (AI integration)

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Node.js 18+ (for client and MCP server)
- npm
- MongoDB Community Server or Docker

### MongoDB Setup

#### Option 1: Using Homebrew (macOS)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Install MongoDB Compass (GUI tool - optional)
brew install --cask mongodb-compass
```

#### Option 2: Using Docker
```bash
# Run MongoDB in a container
docker run --name synaptik-mongo -p 27017:27017 -d mongo:latest
```

#### Option 3: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get your connection string
3. Update `MONGODB_URI` in your `.env` file

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
cp server/.env.example server/.env
# Edit server/.env and update MONGODB_URI if needed
```

3. Set up MongoDB (see [MONGODB.md](./MONGODB.md) for detailed instructions):
```bash
# Using Homebrew (recommended for macOS)
npm run mongo:start

# Or using Docker
npm run docker:up
```

4. Start development servers:
```bash
npm run dev
```

This will start both the client (React) and server (Java/Quarkus) concurrently.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

### 🤖 AI Integration

The MCP (Model Context Protocol) server allows AI assistants to interact with Synaptik's APIs:

1. Build the MCP server:
```bash
npm run mcp:build
```

2. Start the MCP server in development:
```bash
npm run mcp:dev
```

3. Configure with Claude Desktop by adding to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
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

Available MCP tools:
- Task CRUD operations (create, read, update, delete)
- Task actions (start, stop, mark done/undone)
- Task filtering (by status, priority, project, assignee, dates)
- Quick capture with TaskWarrior syntax
- Project and mindmap management

See `mcp-server/README.md` for detailed documentation.

### 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/your-username/synaptik.git
cd synaptik

# Automatic setup
npm run setup

# Start development
npm run dev
```

📚 **See [Quick Start Guide](docs/user-guide/QUICK_START.md) for detailed setup**

### Building for Production

```bash
# Build individual components
npm run build              # Frontend
npm run build:server       # Backend

# Full Docker deployment
npm run docker:full:build
```

## 📁 Project Structure

```
synaptik/
├── 📁 .github/             # GitHub workflows & templates
├── 📁 client/              # React 18 + TypeScript frontend
├── 📁 server/              # Java 21 + Quarkus backend
├── 📁 mcp-server/          # AI integration server
├── 📁 config/              # Docker Compose & environment files
├── 📁 scripts/             # Management & utility scripts
├── 📁 docs/                # Comprehensive documentation
│   ├── api/                # API documentation
│   ├── deployment/         # Deployment guides
│   ├── development/        # Development guides
│   └── user-guide/         # User documentation
├── 📁 tools/               # Development utilities
├── 📄 CONTRIBUTING.md      # Contribution guidelines
├── 📄 LICENSE              # MIT License
└── 📄 PROJECT_STRUCTURE.md # Detailed structure guide
```

📋 **See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed organization**

## 🔌 API Documentation

### Core Endpoints

#### Tasks (`/api/tasks`)
```http
GET    /api/tasks              # List all tasks with filtering
POST   /api/tasks              # Create new task
GET    /api/tasks/{id}         # Get specific task
PUT    /api/tasks/{id}         # Update task
DELETE /api/tasks/{id}         # Delete task

# TaskWarrior-style actions
POST   /api/tasks/{id}/start   # Start working on task
POST   /api/tasks/{id}/stop    # Stop working on task
POST   /api/tasks/{id}/done    # Mark task complete
POST   /api/tasks/capture      # Quick capture with natural language

# Filtering endpoints
GET    /api/tasks/pending      # Get pending tasks
GET    /api/tasks/active       # Get active tasks
GET    /api/tasks/overdue      # Get overdue tasks
GET    /api/tasks/today        # Get today's tasks
```

#### Projects (`/api/projects`)
```http
GET    /api/projects           # List all projects
POST   /api/projects           # Create new project
GET    /api/projects/{id}      # Get specific project
PUT    /api/projects/{id}      # Update project
DELETE /api/projects/{id}      # Delete project
GET    /api/projects/{id}/tasks # Get project tasks
```

#### Mindmaps (`/api/mindmaps`)
```http
GET    /api/mindmaps           # List all mindmaps
POST   /api/mindmaps           # Create new mindmap
GET    /api/mindmaps/{id}      # Get specific mindmap
PUT    /api/mindmaps/{id}      # Update mindmap
DELETE /api/mindmaps/{id}      # Delete mindmap
```

### Interactive API Documentation
- **Swagger UI**: http://localhost:8080/q/swagger-ui
- **Health Checks**: http://localhost:8080/q/health
- **Metrics**: http://localhost:8080/q/metrics

## 🛠️ Development

### Development Commands

```bash
# Start all services concurrently
npm run dev

# Individual services
npm run client:dev          # Frontend only
npm run server:dev          # Backend only  
npm run mcp:dev            # MCP server only

# Database management
npm run mongo:start        # Start MongoDB
npm run mongo:stop         # Stop MongoDB
npm run mongo:connect      # Connect to MongoDB shell

# Building
npm run build              # Build frontend
npm run build:server       # Build backend
npm run mcpbuild          # Build MCP server

# Testing
cd server && ./gradlew test    # Backend tests
cd client && npm run lint      # Frontend linting
```

### Environment Configuration

#### Backend Configuration (`server/.env`)
```bash
MONGODB_URI=mongodb://localhost:27017/synaptik
QUARKUS_HTTP_PORT=8080
QUARKUS_HTTP_CORS=true
QUARKUS_LOG_LEVEL=INFO
```

#### Frontend Configuration (`client/.env.local`)
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_PORT=5173
```

### TaskWarrior Integration

Synaptik supports TaskWarrior's natural language syntax for quick task creation:

```bash
# Examples of supported syntax
"Buy groceries due:tomorrow +shopping priority:high"
"Review code project:synaptik due:friday"
"Call dentist +health priority:medium"
"Deploy website project:work due:2024-01-15"
```

## 🎨 Screenshots

### Dashboard Overview
*Coming soon - comprehensive task dashboard with analytics*

### Task Management
*Coming soon - TaskWarrior-inspired task interface*

### Project Mindmaps
*Coming soon - D3.js powered visual project organization*

### AI Integration
*Coming soon - Claude Desktop integration in action*

## 🚀 Deployment

### Development Deployment
```bash
# Start all services
npm run dev

# Verify services are running
curl http://localhost:8080/q/health
curl http://localhost:5173
```

### Production Deployment
```bash
# Build all components
npm run build
npm run build:server

# Start production server
cd server && ./gradlew quarkusRun
```

### Docker Deployment
```bash
# Start MongoDB
docker-compose up -d

# Build and run application (if Docker configuration exists)
docker-compose up --build
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Java formatting with Google Java Style
- **TypeScript**: Strict mode enabled
- **Commits**: Conventional commit messages

## 📚 Documentation

- [AI Integration Guide](AI-README.md) - Comprehensive guide for AI assistants
- [MCP Server Documentation](mcp-server/README.md) - Model Context Protocol integration
- [API Documentation](http://localhost:8080/q/swagger-ui) - Interactive API docs
- [Migration Guide](MIGRATION_PLAN.md) - Backend migration details

## 🔧 Troubleshooting

### Common Issues

**Port Conflicts**
- Frontend: 5173 (Vite)
- Backend: 8080 (Quarkus)
- MongoDB: 27017

**MongoDB Connection Issues**
```bash
# Check MongoDB status
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb-community
```

**Java Version Issues**
```bash
# Verify Java 21+
java -version

# Set JAVA_HOME if needed
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

**Build Issues**
```bash
# Clean rebuild
cd server && ./gradlew clean build
cd client && rm -rf node_modules && npm install
```

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] TaskWarrior-inspired task management
- [x] Java/Quarkus backend migration
- [x] React frontend with Material-UI
- [x] MongoDB integration
- [x] MCP server for AI integration

### Phase 2: Enhanced Features 🚧
- [ ] Advanced project management
- [ ] D3.js mindmap visualization
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)

### Phase 3: AI & Automation 🔮
- [ ] Advanced AI task prioritization
- [ ] Voice command integration
- [ ] Email-to-task conversion
- [ ] Meeting notes extraction
- [ ] Workflow automation engine

### Phase 4: Enterprise Features 🏢
- [ ] Multi-tenant support
- [ ] Advanced analytics dashboard
- [ ] Team management
- [ ] Custom integrations
- [ ] Enterprise security features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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

[Report Bug](https://github.com/your-username/synaptik/issues) • [Request Feature](https://github.com/your-username/synaptik/issues) • [Documentation](AI-README.md)

</div>
