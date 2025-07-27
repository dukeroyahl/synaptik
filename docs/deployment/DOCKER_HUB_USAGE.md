# 🐳 Using Synaptik Docker Image

Guide for end users who want to run the published Synaptik Docker image.

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** installed and running
- **5GB free disk space** (for application and data)

### One-Command Setup
```bash
# Download and run Synaptik
docker run -d \
  --name synaptik \
  -p 80:80 \
  -v $HOME/.synaptik/data:/data/db \
  -v $HOME/.synaptik/logs:/var/log/synaptik \
  --restart unless-stopped \
  dukeroyahl/synaptik:latest

# Access at http://localhost
```

## 📁 Data Storage

### Default Location
Synaptik stores all data in your home directory:
```
~/.synaptik/
├── data/     # MongoDB database files
└── logs/     # Application logs
```

### Platform-Specific Locations
| Platform | Data Location |
|----------|---------------|
| **Linux/Mac** | `/home/username/.synaptik/` |
| **Windows** | `C:\Users\username\.synaptik\` |
| **WSL** | `/home/username/.synaptik/` |

### Custom Data Location
```bash
# Use custom directory
docker run -d \
  --name synaptik \
  -p 80:80 \
  -v /path/to/your/data:/data/db \
  -v /path/to/your/logs:/var/log/synaptik \
  --restart unless-stopped \
  dukeroyahl/synaptik:latest
```

## 🎯 Common Scenarios

### Home Server Setup
```bash
# Store data on external drive
docker run -d \
  --name synaptik \
  -p 80:80 \
  -v /mnt/external/synaptik:/data/db \
  -v /mnt/external/synaptik-logs:/var/log/synaptik \
  --restart unless-stopped \
  dukeroyahl/synaptik:latest
```

### Development Setup
```bash
# Store data in project folder
docker run -d \
  --name synaptik-dev \
  -p 8080:80 \
  -v $(pwd)/dev-data:/data/db \
  -v $(pwd)/dev-logs:/var/log/synaptik \
  dukeroyahl/synaptik:latest
```

### Docker Compose (Recommended)
```yaml
# docker-compose.yml
version: '3.8'
services:
  synaptik:
    image: dukeroyahl/synaptik:latest
    container_name: synaptik
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ${HOME}/.synaptik/data:/data/db
      - ${HOME}/.synaptik/logs:/var/log/synaptik
    environment:
      - JAVA_OPTS=-Xmx1g -Xms512m  # Adjust memory as needed
```

```bash
# Run with docker-compose
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `JAVA_OPTS` | `-Xmx512m -Xms256m` | JVM memory settings |
| `QUARKUS_LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARN, ERROR) |
| `MONGODB_URI` | `mongodb://localhost:27017/synaptik` | Internal MongoDB connection |

### Memory Configuration
```bash
# For larger datasets (adjust based on your system)
docker run -d \
  --name synaptik \
  -p 80:80 \
  -v $HOME/.synaptik/data:/data/db \
  -v $HOME/.synaptik/logs:/var/log/synaptik \
  -e JAVA_OPTS="-Xmx2g -Xms1g" \
  --restart unless-stopped \
  dukeroyahl/synaptik:latest
```

## 🔍 Accessing Your Application

Once running, access Synaptik at:
- **Web App**: http://localhost
- **API Documentation**: http://localhost/q/swagger-ui  
- **Health Check**: http://localhost/health
- **MCP Server**: http://localhost/mcp (for Claude Desktop)

## 🤖 AI Integration (Claude Desktop)

Add to your Claude Desktop configuration (`~/.config/claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "synaptik": {
      "command": "curl",
      "args": ["-N", "-H", "Accept: text/event-stream", "http://localhost/mcp"],
      "env": {}
    }
  }
}
```

## 🛠️ Management Commands

### View Logs
```bash
# Application logs
docker logs synaptik -f

# MongoDB logs (from container)
docker exec synaptik tail -f /var/log/mongodb/mongod.log
```

### Backup Data
```bash
# Create backup
tar -czf synaptik-backup-$(date +%Y%m%d).tar.gz ~/.synaptik/data

# Restore backup
tar -xzf synaptik-backup-20241127.tar.gz -C ~/
```

### Update to Latest Version
```bash
# Stop current container
docker stop synaptik
docker rm synaptik

# Pull latest image
docker pull dukeroyahl/synaptik:latest

# Start new container (data persists in ~/.synaptik/)
docker run -d \
  --name synaptik \
  -p 80:80 \
  -v $HOME/.synaptik/data:/data/db \
  -v $HOME/.synaptik/logs:/var/log/synaptik \
  --restart unless-stopped \
  dukeroyahl/synaptik:latest
```

### Reset/Clean Installation
```bash
# ⚠️ WARNING: This deletes all your data!
docker stop synaptik
docker rm synaptik
rm -rf ~/.synaptik/

# Start fresh
docker run -d --name synaptik -p 80:80 \
  -v $HOME/.synaptik/data:/data/db \
  -v $HOME/.synaptik/logs:/var/log/synaptik \
  dukeroyahl/synaptik:latest
```

## 🚨 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs synaptik

# Check if port is in use
netstat -tulpn | grep :80
# or
lsof -i :80
```

### Permission Issues (Linux)
```bash
# Fix data directory permissions
sudo chown -R $(id -u):$(id -g) ~/.synaptik/
```

### Out of Memory
```bash
# Increase memory allocation
docker stop synaptik
docker rm synaptik
docker run -d --name synaptik -p 80:80 \
  -v $HOME/.synaptik/data:/data/db \
  -v $HOME/.synaptik/logs:/var/log/synaptik \
  -e JAVA_OPTS="-Xmx2g -Xms1g" \
  dukeroyahl/synaptik:latest
```

### Data Corruption
```bash
# Stop container
docker stop synaptik

# Check/repair MongoDB data (advanced)
docker run --rm -v $HOME/.synaptik/data:/data/db \
  mongo:7.0 mongod --dbpath /data/db --repair

# Restart container
docker start synaptik
```

## 📞 Support

- **GitHub Issues**: https://github.com/dukeroyahl/synaptik/issues
- **Documentation**: https://github.com/dukeroyahl/synaptik#readme
- **Docker Hub**: https://hub.docker.com/r/dukeroyahl/synaptik