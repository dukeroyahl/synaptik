# Synaptik MCP Server

Model Context Protocol server for Synaptik task management system.

## 🚀 Quick Start

### 1. Build the MCP Server Image
```bash
./scripts/build-mcp-image.sh
```

### 2. Configure Claude Desktop

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "synaptik": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "SYNAPTIK_URL",
        "synaptik/mcp-server:latest"
      ],
      "env": {
        "SYNAPTIK_URL": "http://host.docker.internal:8080"
      }
    }
  }
}
```

### 3. Start Synaptik Server
```bash
./synaptik.sh dev
```

## 🔧 Configuration

### Environment Variables
- `SYNAPTIK_URL` - URL of your Synaptik API server (default: `http://host.docker.internal:8080`)

### For Different Setups
- **Local development**: `http://host.docker.internal:8080`
- **Remote server**: `https://your-synaptik-server.com`
- **Custom port**: `http://host.docker.internal:3000`

## 🛠️ Available Tools

### Task Management
- `createTask` - Create a new task
- `getTasks` - Get all tasks with filtering
- `getTask` - Get specific task by ID
- `updateTask` - Update existing task
- `deleteTask` - Delete task
- `startTask` - Start task (set to active)
- `stopTask` - Stop active task
- `markTaskDone` - Mark task as completed

### Task Queries
- `getPendingTasks` - Get pending tasks
- `getActiveTasks` - Get active tasks
- `getCompletedTasks` - Get completed tasks
- `getOverdueTasks` - Get overdue tasks
- `getTodayTasks` - Get tasks due today

### Project Management
- `getProjects` - Get all projects
- `createProject` - Create new project

### Dashboard
- `getDashboard` - Get overview with statistics
- `quickCapture` - Create task with TaskWarrior syntax

## 📝 Example Usage

Ask Claude:
- "Create a high priority task to review the quarterly report due tomorrow"
- "Show me all my active tasks"
- "What tasks are overdue?"
- "Give me a dashboard overview"

## 🐳 Docker Commands

### Build Image
```bash
docker build -f mcp-server/Dockerfile -t synaptik/mcp-server:latest .
```

### Test Locally
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | \
docker run -i --rm -e SYNAPTIK_URL=http://host.docker.internal:8080 synaptik/mcp-server:latest
```

### Run Interactively
```bash
docker run -it --rm -e SYNAPTIK_URL=http://host.docker.internal:8080 synaptik/mcp-server:latest
```