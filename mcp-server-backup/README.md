# Synaptik MCP Server

A Model Context Protocol (MCP) server that exposes Synaptik task management APIs as tools for AI assistants.

## Features

This MCP server provides comprehensive access to Synaptik's task management capabilities through the following tools:

### Task Management Tools
- **get_tasks** - Get all tasks with optional filtering (status, priority, project, assignee, tags, dates)
- **get_task** - Get a specific task by ID
- **create_task** - Create a new task with full attributes
- **update_task** - Update an existing task
- **delete_task** - Delete a task
- **quick_capture** - Create tasks using TaskWarrior-style syntax

### Task Actions
- **mark_task_done** - Mark a task as completed
- **mark_task_undone** - Mark a completed task as pending
- **start_task** - Start a task (set status to active)
- **stop_task** - Stop an active task (set status to pending)

### Task Views
- **get_pending_tasks** - Get all pending tasks
- **get_active_tasks** - Get all active tasks
- **get_completed_tasks** - Get all completed tasks
- **get_overdue_tasks** - Get all overdue tasks
- **get_today_tasks** - Get tasks due today

### Project Management
- **get_projects** - Get all projects
- **create_project** - Create a new project

### Mindmap Management
- **get_mindmaps** - Get all mindmaps

## Installation

### Quick Setup (Recommended)
```bash
cd mcp-server
./setup.sh
```

### Manual Installation
1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Build the project:
```bash
npm run build
```

### Verification
Test that everything is working:
```bash
# Test the server startup and tools
npm test

# Validate API connectivity (requires Synaptik server running)
npm run validate
```

## Configuration

Set the API base URL using the environment variable:
```bash
export SYNAPTIK_API_URL=http://localhost:3001/api
```

Default: `http://localhost:3001/api`

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Watch Mode
```bash
npm run watch
```

### Testing & Validation
```bash
# Test MCP server functionality
npm test

# Validate API connectivity
npm run validate
```

## MCP Integration

To use this server with an MCP client (like Amazon Q CLI or Claude Desktop), add it to your MCP configuration:

```json
{
  "mcpServers": {
    "synaptik": {
      "command": "node",
      "args": ["/path/to/synaptik/mcp-server/dist/index.js"],
      "env": {
        "SYNAPTIK_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

## Examples

### Quick Task Capture
Use TaskWarrior-style syntax to quickly create tasks:
```
quick_capture: "Buy groceries due:tomorrow +shopping priority:H project:personal assignee:John"
```

### Filtered Task Retrieval
Get tasks with specific criteria:
```
get_tasks: {
  "status": "pending",
  "priority": "H",
  "project": "webapp",
  "dueBefore": "2024-12-31"
}
```

### Task Management Workflow
1. Create a task: `create_task`
2. Start working: `start_task`
3. Complete it: `mark_task_done`
4. Or update details: `update_task`

## API Schema

The server validates all inputs using Zod schemas that match the Synaptik task structure:

- Task fields: id, title, description, status, priority, project, assignee, dates, tags, dependencies
- Status values: pending, waiting, active, completed, deleted
- Priority values: H (High), M (Medium), L (Low), '' (None)

## Error Handling

The server provides detailed error messages including:
- API response status codes
- Validation errors for invalid inputs
- Network connectivity issues
- Missing required parameters
- **Type-safe parameter validation** - All ID parameters are validated as strings
- **Comprehensive error context** - Full error details for debugging

## Recent Improvements

### v1.0.1 - TypeScript Fixes
- ✅ **Fixed type safety issues** - All `args.id` parameters now properly validated
- ✅ **Enhanced error handling** - Better validation for required string parameters
- ✅ **Build success** - Zero TypeScript compilation errors
- ✅ **Added testing utilities** - `npm test` and `npm run validate` scripts
- ✅ **Improved setup script** - Better feedback and error detection

### Available Scripts
- `npm run build` - Build the TypeScript project
- `npm run dev` - Start in development mode with auto-reload
- `npm start` - Start the production server
- `npm test` - Test MCP server functionality
- `npm run validate` - Validate API connectivity to Synaptik server
- `npm run watch` - Watch mode for development

## Development

The server is built with:
- TypeScript for type safety
- Zod for input validation
- Axios for HTTP requests
- MCP SDK for protocol implementation

### Prerequisites
- Node.js 18+
- Running Synaptik server (for API connectivity)
- MongoDB (required by Synaptik server)

### Development Workflow
1. **Setup**: `./setup.sh` or manual installation
2. **Build**: `npm run build` (now completes without TypeScript errors)
3. **Test**: `npm test` to verify MCP functionality
4. **Validate**: `npm run validate` to check API connectivity
5. **Develop**: `npm run dev` for development with auto-reload

### Troubleshooting
- **Build fails**: Check TypeScript version and dependencies
- **Server won't start**: Verify Node.js version (18+ required)
- **API errors**: Ensure Synaptik server is running on correct port
- **Connection issues**: Check `SYNAPTIK_API_URL` environment variable

## License
To be decided
@roy
