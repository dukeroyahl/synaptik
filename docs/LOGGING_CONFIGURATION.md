# Synaptik Logging Configuration

This document describes how to configure logging levels and output for debugging and monitoring Synaptik in Docker environments.

## Overview

Synaptik now supports comprehensive debug logging across all components:
- **Backend API** (Quarkus/Java) - Application and business logic logs
- **Frontend UI** (React/Vite) - Client-side debugging and error tracking  
- **MCP Server** (Node.js) - AI assistant tool call tracing
- **MongoDB** - Database operation logs

All logs are written to both console output and configurable log files in the `.synaptik/logs` directory.

## Configuration

### Environment Variables

| Variable | Component | Default | Description |
|----------|-----------|---------|-------------|
| `SYNAPTIK_LOGS_DIR` | All | `$HOME/.synaptik/logs` | Base directory for all log files |
| `LOG_LEVEL` | Backend | `DEBUG` | Backend log level (DEBUG, INFO, WARN, ERROR) |
| `QUARKUS_LOG_LEVEL` | Backend | `DEBUG` | Quarkus framework log level |
| `VITE_LOG_LEVEL` | Frontend | `debug` | Frontend log level (debug, info, warn, error) |
| `VITE_LOG_TO_FILE` | Frontend | `true` | Enable frontend logging to localStorage |
| `MCP_LOG_LEVEL` | MCP Server | `debug` | MCP server log level |
| `MCP_LOG_FILE` | MCP Server | `$HOME/.synaptik/logs/mcp-bridge.log` | MCP log file path |

### Log File Locations

When using the default `SYNAPTIK_LOGS_DIR=$HOME/.synaptik/logs`:

```
~/.synaptik/logs/
├── backend/
│   └── synaptik-backend.log     # Backend API logs
├── frontend/                    # Frontend logs (localStorage)
├── mongodb/                     # MongoDB server logs
└── mcp-bridge.log              # MCP server logs
```

## Usage

### Development Environment

For development with debug logging enabled:

```bash
# Copy and customize environment file
cp dist/docker/.env.example .env

# Edit .env to set log levels (already set to DEBUG by default)
# LOG_LEVEL=DEBUG
# VITE_LOG_LEVEL=debug
# MCP_LOG_LEVEL=debug

# Start development environment
docker-compose -f dist/docker-compose.dev.yml up -d
```

### Production Environment

For production with INFO-level logging:

```bash
# Set production log levels in .env
LOG_LEVEL=INFO
VITE_LOG_LEVEL=info
MCP_LOG_LEVEL=info

# Start production stack
docker-compose -f dist/docker-compose.yml up -d
```

### Custom Log Directory

To use a custom log directory:

```bash
# Set custom log directory
export SYNAPTIK_LOGS_DIR="/var/log/synaptik"

# Ensure directory exists and is writable
mkdir -p /var/log/synaptik
sudo chown $USER:$USER /var/log/synaptik

# Start with custom log directory
docker-compose up -d
```

## Monitoring Logs

### Real-time Log Monitoring

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api          # Backend API logs
docker-compose logs -f ui           # Frontend logs  
docker-compose logs -f mongodb      # Database logs

# View log files directly
tail -f ~/.synaptik/logs/backend/synaptik-backend.log
tail -f ~/.synaptik/logs/mcp-bridge.log
```

### Log Analysis

#### Backend API Traces
Backend logs include:
- HTTP request/response details
- Database operations
- Business logic flow
- Error stack traces
- MCP tool executions

#### Frontend Debug Information
Frontend logs capture:
- API call requests and responses
- Component lifecycle events
- User interaction traces
- Error boundary catches
- State management changes

#### MCP Server Activity
MCP server logs track:
- Tool execution requests
- Claude AI interactions
- API communication
- Error handling

## Log Rotation

Backend logs are automatically rotated:
- Maximum file size: 10MB
- Backup files: 5 retained
- Format: `synaptik-backend.log.1`, `synaptik-backend.log.2`, etc.

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check directory permissions and volume mounts
2. **Log directory full**: Implement log rotation or cleanup scripts
3. **Performance impact**: Reduce log level from DEBUG to INFO in production

### Debug Specific Components

```bash
# Enable debug logging for specific Java packages
QUARKUS_LOG_CATEGORY_ORG_DUKEROYAHL_SYNAPTIK_LEVEL=DEBUG

# Enable detailed HTTP request logging
QUARKUS_LOG_CATEGORY_ORG_JBOSS_RESTEASY_LEVEL=DEBUG

# Enable MongoDB driver debugging  
QUARKUS_LOG_CATEGORY_ORG_MONGODB_LEVEL=DEBUG
```

### Export Frontend Logs

Frontend logs are stored in browser localStorage and can be exported:

```javascript
// In browser console
const logs = JSON.parse(localStorage.getItem('synaptik_logs') || '[]');
console.log(logs);

// Export as JSON file
const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
const downloadLink = document.createElement("a");
downloadLink.setAttribute("href", dataStr);
downloadLink.setAttribute("download", "synaptik-frontend-logs.json");
downloadLink.click();
```

## Security Considerations

- Log files may contain sensitive information - secure access appropriately
- Regularly rotate and archive log files to prevent disk space issues
- Consider log shipping to centralized logging systems for production deployments
- Ensure log directories have appropriate permissions (readable by Docker user)

## Integration Examples

### Centralized Logging

For production deployments, consider shipping logs to centralized systems:

```yaml
# Example: Ship logs to ELK stack
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=synaptik-api"
```

### Monitoring Integration

Logs are structured for easy parsing by monitoring tools:

```bash
# Example: Parse error rates
grep "ERROR" ~/.synaptik/logs/backend/synaptik-backend.log | wc -l

# Example: Monitor API response times  
grep "HTTP.*ms" ~/.synaptik/logs/backend/synaptik-backend.log
```
