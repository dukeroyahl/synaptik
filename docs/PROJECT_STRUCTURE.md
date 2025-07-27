# 📁 Synaptik Project Structure

This document outlines the organized structure of the Synaptik project, optimized for open source collaboration.

## 🏗️ Project Layout

```
synaptik/
├── 📁 .github/                   # GitHub configuration
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── workflows/                # CI/CD workflows
│       └── ci.yml
├── 📁 client/                    # React frontend application
│   ├── public/                   # Static assets
│   ├── src/                      # Source code
│   │   ├── components/           # Reusable React components
│   │   ├── pages/                # Page-level components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API and external services
│   │   ├── stores/               # State management (Zustand)
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Utility functions
│   ├── Dockerfile                # Frontend Docker build
│   ├── nginx.conf                # Nginx configuration for production
│   └── package.json              # Frontend dependencies
├── 📁 server/                    # Java/Quarkus backend
│   ├── src/
│   │   ├── main/java/com/synaptik/
│   │   │   ├── config/           # Configuration classes
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── exception/        # Exception handling
│   │   │   ├── model/            # Entity models
│   │   │   ├── repository/       # Data access layer
│   │   │   ├── resource/         # REST endpoints (JAX-RS)
│   │   │   ├── service/          # Business logic
│   │   │   ├── validation/       # Custom validators
│   │   │   └── util/             # Utility classes
│   │   └── test/                 # Test classes
│   ├── Dockerfile                # Backend Docker build
│   ├── build.gradle              # Gradle build configuration
│   └── src/main/resources/       # Configuration files
├── 📁 mcp-server/                # AI integration server
│   ├── src/                      # TypeScript source
│   ├── Dockerfile                # MCP server Docker build
│   └── package.json              # MCP dependencies
├── 📁 config/                    # Configuration files
│   ├── docker-compose.yml        # Development (MongoDB only)
│   ├── docker-compose.full.yml   # Production (full stack)
│   ├── docker-compose.dev.yml    # Alternative dev setup
│   └── .env.production           # Production environment template
├── 📁 scripts/                   # Utility scripts
│   └── synaptik.sh               # Main management script
├── 📁 docs/                      # Documentation
│   ├── api/                      # API documentation
│   ├── deployment/               # Deployment guides
│   │   └── DEPLOYMENT.md
│   ├── development/              # Development documentation
│   │   ├── AI-README.md          # AI integration guide
│   │   └── IMPROVEMENTS.md       # Implementation notes
│   └── user-guide/               # User guides
│       └── QUICK_START.md
├── 📁 tools/                     # Development tools
├── 📄 CONTRIBUTING.md            # Contribution guidelines
├── 📄 LICENSE                    # MIT License
├── 📄 README.md                  # Main project documentation
├── 📄 PROJECT_STRUCTURE.md       # This file
├── 📄 .gitignore                 # Git ignore patterns
└── 📄 package.json               # Root package configuration
```

## 🎯 Directory Purposes

### 📁 Core Application
- **`client/`**: React 18 + TypeScript frontend with Material-UI
- **`server/`**: Java 21 + Quarkus backend with MongoDB
- **`mcp-server/`**: Model Context Protocol server for AI integration

### ⚙️ Configuration
- **`config/`**: Docker Compose files and environment templates
- **`scripts/`**: Management and utility scripts
- **`.github/`**: GitHub-specific configuration (workflows, templates)

### 📚 Documentation
- **`docs/api/`**: API documentation and schemas
- **`docs/deployment/`**: Deployment guides and infrastructure docs
- **`docs/development/`**: Development setup and architecture guides
- **`docs/user-guide/`**: End-user documentation and tutorials

### 🛠️ Development
- **`tools/`**: Development utilities and helper scripts
- **Root files**: Project metadata, licenses, and main documentation

## 🔄 Development Workflow

### 1. **Setup**
```bash
npm run setup          # Initial setup
```

### 2. **Development**
```bash
npm run dev            # Start all services
npm run status         # Check service status
npm run stop           # Stop all services
```

### 3. **Docker Deployment**
```bash
npm run docker:up              # MongoDB only
npm run docker:full:build      # Full stack
npm run docker:full:down       # Stop full stack
```

### 4. **Individual Services**
```bash
npm run client:dev      # Frontend only
npm run server:dev      # Backend only
npm run mcp:dev         # MCP server only
```

## 📋 File Naming Conventions

### Java (Backend)
- **Classes**: PascalCase (`TaskService.java`)
- **Packages**: lowercase (`com.synaptik.model`)
- **Constants**: UPPER_SNAKE_CASE
- **Methods**: camelCase

### TypeScript/React (Frontend)
- **Components**: PascalCase (`TaskCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useTaskManager.ts`)
- **Utils**: camelCase (`dateUtils.ts`)
- **Types**: PascalCase (`Task.ts`)

### General
- **Config files**: kebab-case (`docker-compose.yml`)
- **Documentation**: UPPER_SNAKE_CASE (`README.md`)
- **Scripts**: kebab-case (`synaptik.sh`)

## 🏷️ Branch Strategy

### Main Branches
- **`main`**: Production-ready code
- **`develop`**: Development integration branch

### Feature Branches
- **`feature/task-management`**: New features
- **`bugfix/ui-rendering`**: Bug fixes
- **`hotfix/security-patch`**: Critical fixes
- **`docs/api-guide`**: Documentation updates

## 📦 Package Management

### Dependencies
- **Root**: Shared development tools
- **Client**: React, TypeScript, Vite, Material-UI
- **Server**: Managed by Gradle (Quarkus, MongoDB Panache)
- **MCP Server**: Node.js, TypeScript, MCP SDK

### Scripts Organization
- **Root `package.json`**: Orchestration scripts
- **Component `package.json`**: Component-specific scripts
- **Management script**: `scripts/synaptik.sh` for complex operations

## 🔍 Code Organization Principles

### 1. **Separation of Concerns**
- Clear boundaries between frontend, backend, and AI integration
- Dedicated directories for configuration, documentation, and scripts

### 2. **Scalability**
- Modular structure allows independent development
- Docker support for various deployment scenarios
- CI/CD ready with GitHub Actions

### 3. **Developer Experience**
- Comprehensive documentation
- Easy setup with automation scripts
- Clear contribution guidelines

### 4. **Open Source Best Practices**
- Standard project layout
- Proper licensing and contribution guides
- Issue templates and workflows
- Security and quality checks

## 🚀 Getting Started

For new developers:
1. **Read**: [Quick Start Guide](docs/user-guide/QUICK_START.md)
2. **Setup**: `npm run setup`
3. **Develop**: `npm run dev`
4. **Contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md)

For deployment:
1. **Development**: [Deployment Guide](docs/deployment/DEPLOYMENT.md)
2. **Production**: Docker Compose full stack
3. **AI Integration**: [AI Setup Guide](docs/development/AI-README.md)

---

**This structure is designed to support collaborative development while maintaining clear organization and easy navigation for both developers and users.**