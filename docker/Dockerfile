# ============================================
# SYNAPTIK - ALL-IN-ONE DOCKER IMAGE
# UI + API + MongoDB + MCP Server
# ============================================

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Java backend
FROM gradle:8.14-jdk21-alpine AS backend-builder
WORKDIR /app/server
COPY server/gradle ./gradle
COPY server/gradlew server/gradlew.bat server/build.gradle server/settings.gradle server/gradle.properties ./
RUN chmod +x gradlew
COPY server/src ./src
RUN ./gradlew clean build -x test

# Stage 3: Runtime image with all services
FROM eclipse-temurin:21-jre-alpine

# Install necessary packages
RUN apk add --no-cache \
    nginx \
    mongodb \
    mongodb-tools \
    supervisor \
    curl \
    bash

# Create application user
RUN addgroup -g 1001 synaptik && adduser -D -u 1001 -G synaptik synaptik

# Create directories
RUN mkdir -p \
    /app/ui \
    /app/api \
    /data/db \
    /var/log/synaptik \
    /etc/supervisor/conf.d

# Copy built frontend
COPY --from=frontend-builder /app/client/dist /app/ui

# Copy built backend
COPY --from=backend-builder /app/server/build/quarkus-app /app/api

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy MongoDB configuration
COPY docker/mongod.conf /etc/mongod.conf

# Copy startup scripts
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/init-mongo.js /docker-entrypoint-initdb.d/init-mongo.js

# Set permissions
RUN chmod +x /usr/local/bin/entrypoint.sh && \
    chown -R synaptik:synaptik /app /data/db /var/log/synaptik && \
    chmod 755 /data/db

# Expose ports
EXPOSE 80 8080 27017

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Set working directory
WORKDIR /app

# Use entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]