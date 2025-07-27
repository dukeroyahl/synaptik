# 📋 Changelog

All notable changes to Synaptik will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Semantic versioning for Docker images
- Multi-architecture Docker support (amd64, arm64)
- Automated GitHub Actions for releases
- Comprehensive documentation structure

### Changed
- Moved documentation to `docs/` folder structure
- Updated README with better organization

## [1.0.0] - 2024-01-15

### Added
- Initial release of Synaptik
- TaskWarrior-inspired task management
- Natural language task capture
- React 18 + TypeScript frontend
- Java 21 + Quarkus backend
- MongoDB database integration
- Docker containerization
- MCP (Model Context Protocol) integration
- Claude Desktop AI assistant support
- Amazon Q integration
- Task urgency calculation algorithm
- Project hierarchy management
- Mindmap visualization
- RESTful API endpoints
- Health checks and monitoring
- Comprehensive user and developer documentation

### Features
- **Task Management**
  - Create, update, delete tasks
  - TaskWarrior syntax support
  - Priority and urgency calculation
  - Tag-based organization
  - Due date management
  - Task lifecycle (pending → active → completed)

- **Project Management**
  - Hierarchical project structure
  - Task assignment to projects
  - Project-based filtering
  - Milestone tracking

- **AI Integration**
  - MCP server for AI assistants
  - Claude Desktop integration
  - Natural language task creation
  - AI-powered task insights

- **User Interface**
  - Modern React-based web interface
  - Responsive design
  - Real-time updates
  - Interactive mindmaps
  - Task dashboard and analytics

- **Developer Experience**
  - Docker-based deployment
  - Hot reload development
  - Comprehensive API documentation
  - Testing framework
  - CI/CD pipeline

### Technical Stack
- **Frontend**: React 18, TypeScript, Vite, Material-UI
- **Backend**: Java 21, Quarkus 3.6+, JAX-RS
- **Database**: MongoDB with Panache
- **Containerization**: Docker, Docker Compose
- **AI Integration**: MCP, Node.js
- **Build Tools**: Gradle, npm
- **Testing**: JUnit, Jest, React Testing Library

---

## Docker Tag Selection Guide

### 🏷️ Choose the Docker tag that fits your needs:

| Tag Pattern | Example | Use Case | Update Frequency | Stability |
|-------------|---------|----------|------------------|-----------|
| `latest` | `roudranil/synaptik:latest` | Development, always latest | Every release | 🔄 Updates automatically |
| `X.Y.Z` | `roudranil/synaptik:1.2.3` | Production, exact version | Never (pinned) | 🔒 Immutable |
| `X.Y` | `roudranil/synaptik:1.2` | Stable, patch updates only | Patch releases | 🔄 Patch updates |
| `X` | `roudranil/synaptik:1` | Major version, minor updates | Minor releases | 🔄 Minor updates |

### 📋 Production Recommendations

**✅ Recommended for Production:**
```bash
# Pin to exact version for maximum stability
docker run -p 8080:8080 roudranil/synaptik:1.2.3
```

**⚠️ Use with Caution:**
```bash
# Gets patch updates automatically (security fixes)
docker run -p 8080:8080 roudranil/synaptik:1.2
```

**❌ Not Recommended for Production:**
```bash
# Can break with major updates
docker run -p 8080:8080 roudranil/synaptik:latest
```

---

## Version History

### Understanding Version Numbers

Synaptik uses [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, incompatible API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Docker Tag Strategy

Each release creates multiple Docker tags:

| Tag Pattern | Example | Description | Stability |
|-------------|---------|-------------|-----------|
| `X.Y.Z` | `1.0.0` | Exact version | 🔒 Immutable |
| `X.Y` | `1.0` | Latest patch | 🔄 Patch updates |
| `X` | `1` | Latest minor | 🔄 Minor updates |
| `latest` | `latest` | Newest release | 🔄 All updates |

### Release Process

1. **Development** → Feature branches and pull requests
2. **Testing** → Automated CI/CD pipeline
3. **Tagging** → `git tag vX.Y.Z && git push origin vX.Y.Z`
4. **Building** → GitHub Actions builds multi-arch images
5. **Publishing** → Docker Hub with semantic tags
6. **Documentation** → Auto-generated release notes

---

## Migration Guides

### Upgrading from 0.x to 1.0.0

This is the initial stable release. No migration needed.

### Future Upgrade Guides

Migration guides for future versions will be documented here.

---

## Links

- [📖 Documentation](WIKI.md) - Complete documentation
- [🐳 Docker Hub](https://hub.docker.com/r/roudranil/synaptik) - Published images
- [📝 Issues](https://github.com/roudranil/synaptik/issues) - Bug reports and features
- [🤝 Contributing](../CONTRIBUTING.md) - How to contribute
- [📋 Releases](https://github.com/roudranil/synaptik/releases) - GitHub releases
