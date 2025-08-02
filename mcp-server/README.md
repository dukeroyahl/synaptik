# Synaptik MCP Server

A Model Context Protocol (MCP) server that provides Claude with tools to manage Synaptik tasks through a unified interface.

## Overview

This MCP server acts as a bridge between Claude and the Synaptik task management system, allowing Claude to:
- Create, update, and manage tasks
- Start and complete tasks
- Query task status and dependencies
- Import tasks from external sources

## Docker Images

The MCP server is published as Docker images under the consolidated repository:

- `roudranil/synaptik:mcp-server-latest` - Latest stable version
- `roudranil/synaptik:mcp-server-{version}` - Specific version (e.g., `mcp-server-1.0.0`)

## Quick Start

### Using Docker (Recommended)

1. **Pull the image:**
   ```bash
   docker pull roudranil/synaptik:mcp-server-latest
   ```

2. **Run the MCP server:**
   ```bash
   docker run -i --rm \
     -e SYNAPTIK_URL=http://host.docker.internal:8080 \
     roudranil/synaptik:mcp-server-latest
   ```

### Claude Desktop Configuration

#### Recommended: Direct Docker Integration

1. **Start Synaptik API first:**
   ```bash
   # Start just the core app (no MCP server in compose)
   docker-compose -f dist/docker-compose.yml up -d
   ```

2. **Configure Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "synaptik": {
         "command": "docker",
         "args": [
           "run",
           "-i",
           "--rm",
           "--network=synaptik-network",
           "-e",
           "SYNAPTIK_URL=http://api:8080",
           "roudranil/synaptik:mcp-server-latest"
         ]
       }
     }
   }
   ```

#### Alternative: Self-Contained MCP Stack

If you prefer to run MCP with its own API instance:

1. **Use the standalone MCP stack:**
   ```bash
   docker-compose -f mcp-server/docker-compose.mcp.yml up -d
   ```

2. **Configure Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "synaptik": {
         "command": "docker",
         "args": [
           "exec",
           "-i",
           "synaptik-mcp-server",
           "node",
           "mcp-bridge.js"
         ]
       }
     }
   }
   ```

## Available Tools

The MCP server provides the following tools for Claude:

### Task Management
- **createTask** - Create a new task with title, description, and optional metadata
- **getTasks** - Retrieve tasks with optional filtering by status, project, or tags
- **updateTask** - Update existing task properties
- **deleteTask** - Delete a task by ID

### Task Operations  
- **startTask** - Mark a task as started/in-progress
- **completeTask** - Mark a task as completed
- **getTaskById** - Get detailed information about a specific task

### Data Import
- **importTasks** - Import tasks from external JSON data
- **getActiveTasks** - Get all currently active/in-progress tasks

## Environment Variables

- `SYNAPTIK_URL` - URL of the Synaptik API server (required)
- `NODE_ENV` - Environment mode (development/production)

## Development

### Building Locally

```bash
# Build the Docker image
docker build -f Dockerfile -t synaptik-mcp:local .

# Run locally
docker run -i --rm \
  -e SYNAPTIK_URL=http://localhost:8080 \
  synaptik-mcp:local
```

### Using the Build Script

```bash
# Build with default latest tag
./scripts/build-mcp-image.sh

# Build with specific version
./scripts/build-mcp-image.sh 1.0.0
```

## Architecture

The MCP server consists of:

- **mcp-bridge.js** - Main MCP server implementation using stdio transport
- **package.json** - Dependencies and build configuration  
- **Dockerfile** - Container build instructions

## Integration

The MCP server communicates with:
- **Synaptik API** - RESTful API for task management operations
- **Claude** - Through MCP stdio protocol for tool execution

## Troubleshooting

### Common Issues

1. **Connection refused to Synaptik API**
   - Ensure `SYNAPTIK_URL` points to a running Synaptik instance
   - Use `host.docker.internal` instead of `localhost` when running in Docker

2. **MCP server not responding**
   - Check that the container is running with `-i` flag for interactive mode
   - Verify Claude Desktop MCP configuration is correct

3. **Tool execution errors**
   - Check Synaptik API logs for authentication or validation errors
   - Ensure task data format matches expected schema

### Debugging

Enable debug logging:
```bash
docker run -i --rm \
  -e SYNAPTIK_URL=http://host.docker.internal:8080 \
  -e NODE_ENV=development \
  roudranil/synaptik:mcp-server-latest
```

## Related

- [Synaptik Main Documentation](../README.md)
- [Docker Compose Setup](../dist/docker-compose.yml)
- [API Documentation](../server/README.md)