# 🚀 Synaptik Deployment Guide

This guide covers different ways to deploy Synaptik, from development to production.

## 📋 Deployment Options

### 1. 🛠️ Development Mode (Local Development)

**Use this for**: Active development with hot reload

```bash
# Start MongoDB only via Docker
npm run docker:up

# Start development servers locally
npm run dev
```

**Services:**
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:8080 (Quarkus dev mode)
- **MongoDB**: localhost:27017 (Docker container)
- **Mongo Express**: http://localhost:8081

### 2. 🐳 Full Docker Deployment (Production-like)

**Use this for**: Testing complete deployment, production, or when you want everything containerized

```bash
# Build and start all services
npm run docker:full:build

# Or just start (if already built)
npm run docker:full
```

**Services:**
- **Frontend**: http://localhost:3000 (Nginx + React build)
- **Backend**: http://localhost:8080 (Java/Quarkus container)
- **MongoDB**: localhost:27017 (Docker container)
- **Mongo Express**: http://localhost:8081
- **MCP Server**: localhost:3001 (AI integration)

### 3. 🔄 Hybrid Mode (Development + Docker MongoDB)

**Use this for**: When you want to develop locally but use Docker for database

```bash
# Start only MongoDB via Docker
npm run docker:up

# Start individual services as needed
npm run server:dev    # Java server in dev mode
npm run client:dev    # React frontend in dev mode
npm run mcp:dev      # MCP server in dev mode
```

## 🐳 Docker Compose Files

### `docker-compose.yml` (Development)
- **Purpose**: MongoDB only for local development
- **Usage**: `docker-compose up -d` or `npm run docker:up`

### `docker-compose.full.yml` (Production)
- **Purpose**: Complete application stack
- **Usage**: `docker-compose -f docker-compose.full.yml up -d`
- **Includes**: Frontend, Backend, MongoDB, MCP Server, Mongo Express

### `docker-compose.dev.yml` (Development Alternative)
- **Purpose**: Development with isolated containers
- **Usage**: `docker-compose -f docker-compose.dev.yml up -d`

## 🏗️ Container Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx + React │    │  Java/Quarkus  │    │    MongoDB      │
│   (Frontend)    │────│   (Backend)     │────│   (Database)    │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   MCP Server    │    │  Mongo Express  │
                    │ (AI Integration)│    │  (DB Admin UI)  │
                    │   Port: 3001    │    │   Port: 8081    │
                    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start Commands

### Development (Recommended)
```bash
./synaptik.sh setup    # Initial setup
./synaptik.sh dev      # Start development
```

### Full Docker Deployment
```bash
# Build and start everything
npm run docker:full:build

# View logs
npm run docker:full:logs

# Stop everything
npm run docker:full:down
```

### Individual Docker Commands
```bash
# MongoDB only (for development)
npm run docker:up
npm run docker:down
npm run docker:logs

# Full stack
npm run docker:full          # Start all services
npm run docker:full:build    # Build and start all services
npm run docker:full:down     # Stop all services
npm run docker:full:logs     # View all logs
```

## 🔧 Environment Configuration

### Development
- Uses local environment files (`.env`, `.env.local`)
- MongoDB: `mongodb://localhost:27017/synaptik`
- API: `http://localhost:8080`

### Docker Production
- Uses `.env.production` for container environment
- MongoDB: `mongodb://admin:password@mongodb:27017/synaptik`
- Internal networking between containers
- Nginx proxies API calls to backend

## 🏥 Health Checks

All Docker services include health checks:

```bash
# Check service health
docker-compose -f docker-compose.full.yml ps

# Individual health endpoints
curl http://localhost:8080/q/health  # Backend health
curl http://localhost:3000           # Frontend
curl http://localhost:27017          # MongoDB (connection test)
```

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
npm run docker:full:logs

# Specific service
docker-compose -f docker-compose.full.yml logs -f server
docker-compose -f docker-compose.full.yml logs -f client
docker-compose -f docker-compose.full.yml logs -f mongodb
```

### Performance Monitoring
- **Backend Metrics**: http://localhost:8080/q/metrics
- **Health Checks**: http://localhost:8080/q/health
- **API Documentation**: http://localhost:8080/q/swagger-ui

## 🔒 Security Notes

### Production Considerations
1. **Change default MongoDB passwords** in `.env.production`
2. **Configure proper CORS origins** for your domain
3. **Use HTTPS** in production (configure reverse proxy)
4. **Limit exposed ports** (only expose what's needed)
5. **Regular security updates** for base images

### Environment Variables
```bash
# MongoDB Credentials
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=change-in-production

# CORS Configuration
QUARKUS_HTTP_CORS_ORIGINS=https://yourdomain.com

# Database Connection
MONGODB_URI=mongodb://admin:password@mongodb:27017/synaptik?authSource=admin
```

## 🚨 Troubleshooting

### Common Issues

**Port Conflicts**
```bash
# Check what's using ports
lsof -i :3000   # Frontend
lsof -i :8080   # Backend
lsof -i :27017  # MongoDB

# Stop conflicting services
docker-compose -f docker-compose.full.yml down
```

**Build Issues**
```bash
# Clean rebuild
docker-compose -f docker-compose.full.yml down
docker system prune -f
npm run docker:full:build
```

**MongoDB Connection Issues**
```bash
# Check MongoDB status
docker-compose -f docker-compose.full.yml exec mongodb mongosh --eval "db.adminCommand('ping')"

# Reset MongoDB data
docker-compose -f docker-compose.full.yml down -v
npm run docker:full:build
```

**Container Health Issues**
```bash
# Check container status
docker-compose -f docker-compose.full.yml ps

# View specific container logs
docker logs synaptik-server
docker logs synaptik-client
docker logs synaptik-mongodb
```

## 🎯 Production Deployment

### Recommended Production Setup
1. **Use a reverse proxy** (Nginx, Traefik, or cloud load balancer)
2. **Configure SSL/TLS** certificates
3. **Set up monitoring** (Prometheus, Grafana)
4. **Database backups** for MongoDB
5. **Container orchestration** (Docker Swarm, Kubernetes)

### Example Production nginx.conf
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

**Happy Deploying! 🎉**

For more detailed information, see the main [README.md](README.md) and [API documentation](http://localhost:8080/q/swagger-ui).