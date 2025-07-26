# Docker Hub Deployment Guide

This guide explains how to publish Synaptik Docker images to Docker Hub and deploy using published images.

## Prerequisites

1. **Docker Hub Account**: [Sign up at hub.docker.com](https://hub.docker.com)
2. **Docker Desktop**: Ensure Docker is running locally
3. **Repository Access**: Push access to your Docker Hub repositories

## Publishing to Docker Hub

### 1. Build and Push Images

Use the automated script to build and publish all components:

```bash
# Navigate to project root
cd synaptik

# Run the publish script
./scripts/docker-publish.sh v1.0.0 yourusername
```

**Parameters:**
- `v1.0.0`: Version tag (default: `latest`)
- `yourusername`: Your Docker Hub username

### 2. Manual Build (Alternative)

If you prefer manual control:

```bash
# Login to Docker Hub
docker login

# Build and push server
docker build -t yourusername/synaptik-server:v1.0.0 ./server
docker push yourusername/synaptik-server:v1.0.0

# Build and push client
docker build -t yourusername/synaptik-client:v1.0.0 ./client
docker push yourusername/synaptik-client:v1.0.0

# Build and push MCP server
docker build -t yourusername/synaptik-mcp-server:v1.0.0 ./mcp-server
docker push yourusername/synaptik-mcp-server:v1.0.0
```

## Deploying from Docker Hub

### 1. Update Docker Compose Configuration

Edit `config/docker-compose.hub.yml`:

```yaml
# Change this line (line 8)
x-dockerhub-username: &dockerhub-username "yourusername"
```

### 2. Deploy Application

```bash
# Create data directory for persistence
mkdir -p config/data/mongodb

# Deploy using Docker Hub images
docker-compose -f config/docker-compose.hub.yml up -d
```

### 3. Verify Deployment

```bash
# Check all services are running
docker-compose -f config/docker-compose.hub.yml ps

# Check logs
docker-compose -f config/docker-compose.hub.yml logs -f
```

## Published Images

After publishing, your images will be available at:

- **Server**: `yourusername/synaptik-server`
- **Client**: `yourusername/synaptik-client`  
- **MCP Server**: `yourusername/synaptik-mcp-server`

## Access Points

Once deployed:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/q/swagger-ui
- **MCP Server**: http://localhost:3001
- **MongoDB Admin**: http://localhost:8081

## Repository Structure

Your Docker Hub repositories will contain:

```
yourusername/synaptik-server
├── latest (always points to newest)
├── v1.0.0
├── v1.1.0
└── ...

yourusername/synaptik-client
├── latest
├── v1.0.0
└── ...

yourusername/synaptik-mcp-server
├── latest
├── v1.0.0
└── ...
```

## Troubleshooting

### Authentication Issues
```bash
# Re-login to Docker Hub
docker login

# Check authentication
docker info | grep Username
```

### Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild specific component
docker build --no-cache -t yourusername/synaptik-server ./server
```

### Permission Issues (Linux)
```bash
# Fix MongoDB data directory permissions
sudo chown -R 999:999 config/data/mongodb
```

## Best Practices

1. **Versioning**: Use semantic versioning (v1.0.0, v1.1.0, etc.)
2. **Latest Tag**: Always maintain a `latest` tag for convenience
3. **Security**: Never include secrets in Docker images
4. **Size**: Use `.dockerignore` files to reduce image size
5. **Testing**: Test images locally before pushing

## Automated CI/CD

For automated publishing, add to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Build and Push to Docker Hub
  run: |
    echo ${{ secrets.DOCKERHUB_PASSWORD }} | docker login -u ${{ secrets.DOCKERHUB_USERNAME }} --password-stdin
    ./scripts/docker-publish.sh ${{ github.ref_name }} ${{ secrets.DOCKERHUB_USERNAME }}
```

## Sharing Your Application

Share these commands with others to deploy Synaptik:

```bash
# Quick setup
git clone https://github.com/Dukeroyahl/synaptik.git
cd synaptik

# Update Docker Hub username in config/docker-compose.hub.yml
sed -i 's/yourusername/ACTUAL_USERNAME/g' config/docker-compose.hub.yml

# Deploy
mkdir -p config/data/mongodb
docker-compose -f config/docker-compose.hub.yml up -d
```

## Cleanup

To remove images and containers:

```bash
# Stop and remove containers
docker-compose -f config/docker-compose.hub.yml down

# Remove local images
docker rmi yourusername/synaptik-server yourusername/synaptik-client yourusername/synaptik-mcp-server
```