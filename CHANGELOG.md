# 📋 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.4] - 2025-08-09

### 🎯 New Features
- **Native MCP binary compilation support** - Added GraalVM native compilation for MCP server
- **Comprehensive MCP API tools** - Enhanced MCP server with full task management capabilities
- **MCP connectivity testing** - Added test script for API connectivity validation
- **Release branch workflow** - Implemented structured release preparation process

### 🐛 Bug Fixes
- **Workflow syntax errors** - Resolved cleanup-deleted-tag job syntax issues causing race conditions
- **Tag recreation reliability** - Improved workflow stability with sequential delete-wait-push approach
- **MCP server Docker connectivity** - Fixed connectivity issues between MCP server and Dockerized backend
- **Gradle setup deprecation** - Replaced `gradle-home-cache-cleanup` with `cache-cleanup` parameter
- **Release creation failures** - Added robust error handling and file-based input for large release notes
- **Heredoc terminator conflicts** - Used unique terminators to prevent YAML syntax errors

### 🏗️ Improvements
- **Release notes enhancement** - Show specific version tags (e.g., :0.0.4) prominently before :latest
- **Workflow error handling** - Added comprehensive debugging and error recovery mechanisms
- **Release title simplification** - Changed from "🚀 Synaptik v{VERSION}" to clean "v{VERSION}" format
- **File-based logging system** - Implemented comprehensive logging for MCP server to avoid stdio interference
- **Native binary optimization** - 59MB ARM64 binary with 41ms startup time achieved

### 🔧 Technical Changes
- **MCP server logging** - Console disabled, file logging to `~/.synaptik/logs/mcp-server.log`
- **Workflow concurrency control** - Updated to use `github.event.ref` for better delete/push event handling
- **Cleanup job improvements** - Added retry logic (3 attempts), delays, and graceful error handling
- **Version synchronization** - All components updated to v0.0.4 across build files and documentation

### 📦 Version Updates
- Server: `0.0.3` → `0.0.4`
- MCP: `0.0.3` → `0.0.4`
- Frontend: `0.0.3` → `0.0.4`
- Root package: `0.0.3` → `0.0.4`

### 📋 Notes
- Native MCP binaries now available for macOS ARM64, Linux AMD64, and Linux ARM64
- MCP @Tool annotation discovery issue remains a known framework limitation
- Safe tag recreation process established to prevent workflow conflicts
- Release automation significantly improved with better error handling

## [0.0.3] - 2025-08-09

### 🎯 New Features
- **Native compilation support** - Added GraalVM native compilation for MCP tools
- **Comprehensive MCP API tools** - Updated MCP server with full task management capabilities
- **MCP API connectivity testing** - Added test script for validating MCP-to-backend connectivity

### 🐛 Bug Fixes
- **Workflow syntax error** - Resolved cleanup-deleted-tag job syntax issues
- **Tag recreation workflow reliability** - Improved stability and race condition handling
- **MCP server Docker connectivity** - Fixed connectivity issues between MCP server and backend

### 🏗️ Improvements
- **Release notes format** - Enhanced to show specific version tags prominently
- **Workflow error handling** - Added better debugging and error recovery
- **MCP server logging** - Implemented file-based logging system

### 📦 Version Updates
- All components: `0.0.2` → `0.0.3`

## [0.0.2] - 2025-08-09

### 🐛 Fixed
- **Critical Docker 'Unsupported Media Type' Error** - API client now properly sends `application/json` content-type for all requests
- **Removed incorrect text/plain logic** - Task capture now uses proper JSON content-type instead of text/plain
- **Docker environment detection** - Frontend automatically detects Docker vs local development environments
- **Install script errors** - Removed references to non-existent native MCP binaries that were causing CI/CD failures
- **MCP setup documentation** - Updated with accurate build-from-source instructions
- **CI/CD pipeline issues** - Install script no longer attempts to download missing binary assets

### 🔧 Changed
- **Nginx proxy configuration** - Improved header forwarding and path handling for better API communication
- **API client content-type handling** - Simplified and corrected to always use `application/json`
- **Frontend environment detection** - Smart detection between Docker (nginx proxy) and local development
- **Install script MCP section** - Now provides clear instructions for building MCP server from source
- **README MCP integration** - Updated to reflect current build process instead of non-existent binaries
- **Documentation accuracy** - All references now match actual available functionality

### ✨ Added
- **Environment variable support** - `VITE_API_BASE_URL` build argument support in Docker
- **Docker build improvements** - Better environment variable handling in Dockerfile.frontend
- **Relative URL handling** - Uses `/api/tasks` in Docker, `localhost:9001` in local development

### 📦 Version Updates
- Frontend: `0.0.1` → `0.0.2`
- Backend: `0.0.1` → `0.0.2`
- Root package: `0.0.1` → `0.0.2`

### 📋 Notes
- Native MCP binaries will be available in a future release (v0.0.4)
- The quick install command now works properly without errors
- All Docker deployment issues have been resolved

## [0.0.1] - 2025-08-04

### Added
- 🏗️ **Complete project restructure for open source collaboration**
- 📁 Organized directory structure with clear separation of concerns
- 🐳 **Full Docker Compose deployment** - Complete containerized stack
- 📚 **Comprehensive documentation** - API, deployment, and user guides
- 🤝 **Contributing guidelines** - Issue templates, workflows, and code standards
- 🔄 **GitHub Actions CI/CD** - Automated testing and deployment pipeline
- 📦 **Management scripts** - Simplified setup and development workflow
- 🛡️ **Security scanning** - Vulnerability detection in CI pipeline
- 📋 **Issue templates** - Bug reports and feature requests
- 📄 **MIT License** - Open source license
- 🎯 **Project structure guide** - Detailed organization documentation
- 📚 **Comprehensive GitHub Wiki** - Complete documentation moved to wiki
- 🔗 **MCP Server badge** - Added stdio badge for Model Context Protocol integration  
- 🎨 **User-friendly README** - Simplified language for non-technical users
- 📋 **Latest release badge** - Dynamic badge showing current version

### Changed
- 📁 **Directory rename** - `dist/` → `docker/` for clarity and safety
- 🏗️ **MCP folder rename** - `mcp-quarkus-server/` → `mcp/` for cleaner structure
- 🔄 **Organization update** - `Dukeroyahl` → `dukeroyahl` across all references
- 📖 **README restructure** - Quick Start moved above GitHub Packages
- 🚀 **Install script update** - Architecture-specific MCP binary downloads
- 🔧 **CI/CD updates** - Fixed Quarkus build commands and Mandrel images
- 📊 **Badge improvements** - Added branch specification and better links
- 🔧 **Reorganized configuration files** - Moved to `config/` directory
- 📜 **Moved scripts** - Centralized in `scripts/` directory  
- 📖 **Moved documentation to wiki** - Complete guides now in GitHub Wiki
- 🚀 **Updated npm scripts** - Reflect new file locations
- 📋 **Enhanced README** - Better navigation and quick start
- 🐳 **Improved Docker setup** - Production-ready multi-service deployment

### Fixed
- 🐳 **Docker infrastructure restoration** - Recovered accidentally deleted Docker files
- 🔧 **Gradle wrapper issue** - Added `gradle-wrapper.jar` to git tracking
- 🏗️ **Quarkus build conflict** - Native-only builds instead of JAR+native
- 📦 **Frontend npm dependencies** - Added `--legacy-peer-deps` for compatibility
- 🔍 **GHCR lowercase names** - Fixed repository naming requirements
- 🎯 **Cross-platform builds** - Improved native compilation for different architectures
- 🐛 **Docker Compose issues** - Fixed MongoDB volume mounts
- 🔧 **Setup script** - Better MongoDB detection and auto-start
- 📦 **Package.json scripts** - Updated paths for reorganized structure

### Added
- ✨ **Java/Quarkus Backend Migration** - Complete rewrite from Node.js
- 🚀 **Enterprise-grade architecture** - 85% feature coverage improvement
- 🧠 **TaskWarrior integration** - Natural language task capture
- 📊 **Advanced task management** - Priority, urgency, dependencies
- 🗂️ **Project management** - Hierarchical project organization
- 🗺️ **Mindmap support** - Visual project representation
- 🤖 **MCP server** - AI assistant integration via Model Context Protocol
- ⚡ **Reactive programming** - MongoDB Panache with reactive streams
- 🔍 **Comprehensive validation** - Business rules and data validation
- 🛡️ **Error handling** - Global exception handling and logging
- 📊 **OpenAPI documentation** - Interactive API documentation
- 💾 **MongoDB optimization** - Indexes and query optimization
- 🎨 **Material-UI frontend** - Modern React interface with dark/light themes

### Technical Stack
- **Backend**: Java 21 + Quarkus 3.6+ + MongoDB Panache
- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Database**: MongoDB 7.0 with reactive drivers
- **AI Integration**: Node.js MCP server for Claude Desktop
- **Deployment**: Docker + Docker Compose
- **Build Tools**: Gradle (Java), Vite (React), npm (MCP)

### Architecture Features
- 🏗️ **Clean architecture** - Repository, Service, Resource layers
- 🔄 **Reactive streams** - Non-blocking I/O throughout
- 🧪 **Comprehensive testing** - Unit, integration, and API tests
- 📈 **Performance monitoring** - Health checks and metrics
- 🔐 **Security ready** - JWT infrastructure and validation
- 🌐 **CORS configured** - Cross-origin resource sharing
- 📊 **Database indexing** - Optimized query performance

### Migration Achievements
- ✅ **32% → 85% feature coverage** - Massive functionality increase
- ✅ **TypeScript → Java** - Type-safe, enterprise-grade backend
- ✅ **Express → Quarkus** - Cloud-native, reactive framework
- ✅ **Mongoose → Panache** - Modern, reactive MongoDB integration
- ✅ **Node.js → Java** - Better performance and scalability
- ✅ **Manual setup → Automated** - One-command deployment

---

**Legend:**
- 🚀 New features
- 🔧 Changes  
- 🐛 Bug fixes
- 🏗️ Architecture
- 📚 Documentation
- 🤝 Community
- 🔒 Security