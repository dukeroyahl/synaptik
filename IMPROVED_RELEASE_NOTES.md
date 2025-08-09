# 🚀 Synaptik v0.0.3 Release Notes

## ✨ What's New

### 🎯 **Key Features**
- 🤖 **Enhanced Claude Desktop Integration** - Native MCP server binaries for seamless AI task management
- 📝 **File-based Logging** - Comprehensive logging system for better debugging and monitoring  
- 🍎 **macOS Apple Silicon Support** - Optimized native binary for Apple Silicon Macs
- 🔧 **Improved MCP Tools** - Enhanced reflection configuration and API connectivity

### 🐛 **Bug Fixes**
- Fixed MCP server Docker connectivity issues
- Resolved task domain alignment between MCP server and backend
- Enhanced reflection configuration for native compilation

### 🏗️ **Technical Improvements** 
- Aligned Task and TaskAnnotation classes with server domain
- Added comprehensive unit tests for task tools
- Updated MCP server with comprehensive API tools
- Added MCP API connectivity test script

---

## 📦 Installation Options

*Choose the installation method that works best for you:*

### 🚀 **Option 1: Quick Install** *(Recommended for most users)*

**Perfect for:** First-time users who want to get started immediately

```bash
curl -sSL https://raw.githubusercontent.com/dukeroyahl/synaptik/main/install.sh | bash
```

**What you get:**
- ✅ Full Synaptik application running on `http://localhost:4000`
- ✅ REST API available on `http://localhost:9001` 
- ✅ Docker containers managed automatically
- ✅ Persistent data storage

**Time to setup:** ~2 minutes

---

### 🤖 **Option 2: Claude Desktop Integration**

**Perfect for:** Users who want AI-powered task management

**Step 1:** Install Synaptik (use Quick Install above)

**Step 2:** Get the MCP server
```bash
# Download native binary (fastest)
curl -sSL https://github.com/dukeroyahl/synaptik/releases/latest/download/synaptik-mcp-darwin-arm64 -o synaptik-mcp
chmod +x synaptik-mcp

# OR build from source
cd mcp && ./gradlew quarkusBuild
```

**Step 3:** Configure Claude Desktop
Add to your Claude config file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "synaptik": {
      "command": "/path/to/synaptik-mcp"
    }
  }
}
```

**Step 4:** Restart Claude Desktop

**What you can do:**
- *"Show me my active tasks"*
- *"Create a task to review the quarterly report"*  
- *"Mark the database backup task as complete"*

---

### 🐳 **Option 3: Docker Images**

**Perfect for:** Developers and advanced users who need customization

```bash
# GitHub Container Registry (recommended)
docker pull ghcr.io/dukeroyahl/synaptik/frontend:latest
docker pull ghcr.io/dukeroyahl/synaptik/backend:latest

# Docker Hub (alternative)
docker pull roudranil/synaptik/frontend:latest
docker pull roudranil/synaptik/backend:latest
```

**Use case:** Custom deployments, development environments, CI/CD pipelines

---

### ⚡ **Option 4: Native Binaries**

**Perfect for:** Performance-focused users and system integrators

**Available Platforms:**
- 🍎 **macOS Apple Silicon** *(Primary platform - fully tested)*
- 🐧 **Linux x86_64** 
- 🐧 **Linux ARM64**

**Downloads:**
- [synaptik-mcp-darwin-arm64](https://github.com/dukeroyahl/synaptik/releases/latest/download/synaptik-mcp-darwin-arm64)
- [synaptik-mcp-linux-amd64](https://github.com/dukeroyahl/synaptik/releases/latest/download/synaptik-mcp-linux-amd64)
- [synaptik-mcp-linux-arm64](https://github.com/dukeroyahl/synaptik/releases/latest/download/synaptik-mcp-linux-arm64)

**Benefits:** Faster startup, lower memory usage, no Java runtime required

---

## 🔗 **Purpose of Installation Options**

The Installation Options section serves to:

1. **🎯 Guide User Choice** - Help users pick the right installation method for their needs and technical level
2. **⏱️ Set Expectations** - Show setup time and complexity upfront  
3. **🔄 Support Different Workflows** - From quick trials to production deployments
4. **📈 Progressive Complexity** - Start simple, offer advanced options for power users

### **Decision Matrix:**
| Your Goal | Recommended Option | Time | Requirements |
|-----------|-------------------|------|-------------|
| Try Synaptik quickly | Quick Install | 2 min | Docker |
| AI task management | Claude Integration | 5 min | Docker + Claude Desktop |
| Development/customization | Docker Images | 5 min | Docker knowledge |
| Production deployment | Native Binaries | 10 min | System admin skills |

---

## 📚 **Resources**

- 📖 [Full Documentation](https://github.com/dukeroyahl/synaptik/wiki)
- 🤝 [Contributing Guide](https://github.com/dukeroyahl/synaptik/blob/main/CONTRIBUTING.md)
- 🐛 [Report Issues](https://github.com/dukeroyahl/synaptik/issues)
- 📦 [Docker Hub](https://hub.docker.com/r/roudranil/synaptik)

---

**Full Changelog**: https://github.com/dukeroyahl/synaptik/compare/v0.0.2...v0.0.3