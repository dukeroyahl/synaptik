# Synaptik MCP Server

🧠 **Where Ideas Connect** - MCP server for integrating Synaptik task management with Claude Desktop.

## 🚀 Quick Setup

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Synaptik backend** running on `http://localhost:9001`

### Installation

**Option 1: Global Installation (Recommended)**
```bash
npm install -g synaptik-mcp-server
```

**Option 2: Local Installation**
```bash
# Clone or download this directory
cd synaptik/mcp-server
npm install
```

## 🔧 Claude Desktop Configuration

Add this to your Claude Desktop MCP configuration file:

**For Global Installation:**
```json
{
  "mcpServers": {
    "synaptik": {
      "command": "synaptik-mcp",
      "env": {
        "SYNAPTIK_URL": "http://localhost:9001",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**For Local Installation:**
```json
{
  "mcpServers": {
    "synaptik": {
      "command": "node",
      "args": ["/path/to/synaptik/mcp-server/mcp-bridge.js"],
      "env": {
        "SYNAPTIK_URL": "http://localhost:9001", 
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Configuration File Locations
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## 🛠️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SYNAPTIK_URL` | `http://localhost:9001` | Synaptik backend URL |
| `LOG_LEVEL` | `info` | Logging level (`debug`, `info`, `error`) |
| `MCP_LOG_FILE` | `~/.synaptik/logs/mcp-bridge.log` | Log file path |

## 🔍 Available Tools

The MCP server provides these tools for Claude:

- **createTask** - Create a new task
- **getTasks** - Get all tasks with optional filtering  
- **getActiveTasks** - Get all active tasks
- **getPendingTasks** - Get all pending tasks
- **startTask** - Start a task (set to active)
- **markTaskDone** - Mark task as completed
- **getDashboard** - Get dashboard overview

## 🐛 Troubleshooting

### Enable Debug Logging
```json
{
  "mcpServers": {
    "synaptik": {
      "command": "synaptik-mcp",
      "env": {
        "SYNAPTIK_URL": "http://localhost:9001",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Check Logs
- **Default log location**: `~/.synaptik/logs/mcp-bridge.log`
- **Custom log location**: Set `MCP_LOG_FILE` environment variable

### Common Issues

1. **"Command not found"** - Make sure Node.js is installed and in PATH
2. **"Connection refused"** - Ensure Synaptik backend is running on the configured URL
3. **"No tools available"** - Check Claude Desktop console for MCP startup errors

### Test MCP Server Manually
```bash
# Test the server directly
synaptik-mcp

# Or with custom settings
SYNAPTIK_URL=http://localhost:9001 LOG_LEVEL=debug synaptik-mcp
```

## 📝 Example Usage in Claude

Once configured, you can ask Claude things like:
- "Show me my active tasks"
- "Create a task to review the quarterly report"
- "Mark task 12345 as completed"
- "What's on my dashboard?"

## 🔗 Links

- [Synaptik GitHub](https://github.com/Dukeroyahl/Synaptik)
- [Claude Desktop MCP Documentation](https://docs.anthropic.com/claude/docs/tool-use)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 📄 License

MIT License - see the [LICENSE](../LICENSE) file for details.