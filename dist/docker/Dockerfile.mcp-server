# Dockerfile for Synaptik MCP Server
FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY mcp-server/package.json ./
RUN npm install --production

# Copy MCP bridge script
COPY mcp-server/mcp-bridge.js ./
RUN chmod +x mcp-bridge.js

# Set environment variables
ENV SYNAPTIK_URL=http://host.docker.internal:8080
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

USER mcp

# Run the MCP bridge
ENTRYPOINT ["node", "mcp-bridge.js"]