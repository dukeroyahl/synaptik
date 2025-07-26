# 🛠️ Development Guide

This guide covers local development setup for Synaptik, including native installations and detailed development workflows.

## 📋 Prerequisites for Local Development

- **Java 21+** - Required for backend development
- **Node.js 18+** - Required for frontend and MCP server
- **npm** - Package manager
- **MongoDB Community Server** - Database (or use Docker)
- **Git** - Version control

## 🗄️ Database Setup Options

### Option 1: Using Homebrew (macOS - Recommended for Local Dev)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Install MongoDB Compass (GUI tool - optional)
brew install --cask mongodb-compass
```

### Option 2: Using Docker (Cross-platform)
```bash
# Run MongoDB in a container
docker run --name synaptik-mongo -p 27017:27017 -d mongo:latest

# Or use docker-compose
npm run docker:up
```

### Option 3: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get your connection string
3. Update `MONGODB_URI` in your `.env` file

## 🚀 Local Development Setup

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/Dukeroyahl/synaptik.git
cd synaptik

# Install all dependencies
npm run install:all
```

### 2. Environment Configuration

#### Backend Configuration (`server/.env`)
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```bash
MONGODB_URI=mongodb://localhost:27017/synaptik
QUARKUS_HTTP_PORT=8080
QUARKUS_HTTP_CORS=true
QUARKUS_LOG_LEVEL=INFO
```

#### Frontend Configuration (`client/.env.local`)
```bash
cp client/.env.example client/.env.local
```

Edit `client/.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_PORT=5173
```

### 3. Start MongoDB
```bash
# Using Homebrew (macOS)
npm run mongo:start

# Using Docker
npm run docker:up

# Check MongoDB status
npm run mongo:status
```

### 4. Start Development Servers
```bash
# Start all services concurrently
npm run dev

# Or start services individually
npm run client:dev          # Frontend only (port 5173)
npm run server:dev          # Backend only (port 8080)  
npm run mcp:dev            # MCP server only (stdio)
```

## 🔧 Development Commands

### Service Management
```bash
# Start all services
npm run dev

# Individual services
npm run client:dev          # React frontend
npm run server:dev          # Quarkus backend
npm run mcp:dev            # MCP server

# Database management
npm run mongo:start        # Start MongoDB
npm run mongo:stop         # Stop MongoDB
npm run mongo:connect      # Connect to MongoDB shell
npm run mongo:status       # Check MongoDB status
```

### Building & Testing
```bash
# Frontend
cd client
npm run build              # Production build
npm run lint               # ESLint check
npm run preview            # Preview production build

# Backend
cd server
./gradlew build            # Build JAR
./gradlew test             # Run tests
./gradlew quarkusDev       # Development mode

# MCP Server
cd mcp-server
npm run build              # TypeScript compilation
npm run dev                # Development mode
npm run test               # Run tests
```

### Code Quality
```bash
# Frontend linting and formatting
cd client
npm run lint               # ESLint
npm run lint:fix           # Auto-fix ESLint issues

# Backend formatting (Google Java Style)
cd server
./gradlew spotlessApply    # Format code
```

## 🤖 AI Integration Development

### MCP Server Setup
```bash
# Build the MCP server
npm run mcpbuild

# Start in development mode
npm run mcp:dev
```

### Claude Desktop Integration
Configure Claude Desktop by adding to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Available MCP Tools
- Task CRUD operations (create, read, update, delete)
- Task actions (start, stop, mark done/undone)
- Task filtering (by status, priority, project, assignee, dates)
- Quick capture with TaskWarrior syntax
- Project and mindmap management

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
Default ports used:
- **Frontend**: 5173 (Vite)
- **Backend**: 8080 (Quarkus)
- **MongoDB**: 27017

Check for conflicts:
```bash
lsof -i :5173
lsof -i :8080
lsof -i :27017
```

#### MongoDB Connection Issues
```bash
# Check MongoDB status
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb-community

# Check MongoDB logs
brew services start mongodb-community
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

#### Java Version Issues
```bash
# Verify Java 21+
java -version

# List available Java versions (macOS)
/usr/libexec/java_home -V

# Set JAVA_HOME if needed
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

#### Build Issues
```bash
# Clean rebuild - Backend
cd server
./gradlew clean build

# Clean rebuild - Frontend
cd client
rm -rf node_modules dist
npm install
npm run build

# Clean rebuild - MCP Server
cd mcp-server
rm -rf node_modules dist
npm install
npm run build
```

#### Development Server Issues
```bash
# Check if services are running
npm run status

# Stop all services
npm run stop

# View logs
tail -f synaptik.log

# Restart development environment
npm run stop && npm run dev
```

## 📊 Monitoring & Debugging

### Health Checks
- **Backend Health**: http://localhost:8080/q/health
- **Backend Metrics**: http://localhost:8080/q/metrics
- **API Documentation**: http://localhost:8080/q/swagger-ui

### Logging
```bash
# View application logs
tail -f synaptik.log

# Backend logs (when running individually)
cd server && ./gradlew quarkusDev

# Frontend logs (when running individually)
cd client && npm run dev
```

### Database Inspection
```bash
# Connect to MongoDB shell
npm run mongo:connect

# Basic MongoDB commands
use synaptik
db.tasks.find().pretty()
db.projects.find().pretty()
show collections
```

## 🔄 Git Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git add .
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

### Commit Message Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new task filtering capability
fix: resolve MongoDB connection timeout
docs: update API documentation
style: format code according to style guide
refactor: simplify task urgency calculation
test: add unit tests for task service
chore: update dependencies
```

## 🧪 Testing

### Backend Testing
```bash
cd server

# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests TaskServiceTest

# Generate test report
./gradlew test jacocoTestReport
```

### Frontend Testing
```bash
cd client

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Production Builds

### Frontend Production Build
```bash
cd client
npm run build
npm run preview              # Test production build locally
```

### Backend Production Build
```bash
cd server
./gradlew build             # Creates JAR in build/
./gradlew quarkusRun        # Run production JAR
```

### Docker Development
```bash
# Build and run full stack with Docker
docker-compose -f config/docker-compose.full.yml up --build

# View logs
docker-compose -f config/docker-compose.full.yml logs -f

# Stop services
docker-compose -f config/docker-compose.full.yml down
```

## 🎯 Performance Optimization

### Backend Performance
- Use reactive programming patterns
- Optimize database queries
- Enable GraalVM native compilation for faster startup

### Frontend Performance
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size with tree shaking

### Database Optimization
- Create appropriate indexes
- Use MongoDB aggregation pipelines
- Monitor query performance with MongoDB Compass

## 🔧 IDE Setup

### VS Code (Recommended)
Install these extensions:
- Java Extension Pack
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- MongoDB for VS Code

### IntelliJ IDEA
- Import Gradle project
- Enable annotation processing
- Install React/TypeScript plugins

## 📚 Additional Resources

- [Quarkus Development Guide](https://quarkus.io/guides/)
- [React Development Documentation](https://react.dev/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [TaskWarrior Documentation](https://taskwarrior.org/docs/)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
