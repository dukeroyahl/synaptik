#!/usr/bin/env node

/**
 * MCP Stdio Bridge for Synaptik
 * Bridges between stdio MCP protocol and Synaptik's HTTP MCP endpoints
 */

const { createServer } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const axios = require('axios');

const SYNAPTIK_BASE_URL = process.env.SYNAPTIK_URL || 'http://localhost:8080';

// Create MCP server
const server = createServer({
  name: 'synaptik',
  version: '1.0.0',
});

// Define tools that proxy to Synaptik HTTP endpoints
const tools = [
  {
    name: 'createTask',
    description: 'Create a new task',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title (required)' },
        description: { type: 'string', description: 'Task description (optional)' },
        status: { type: 'string', description: 'Task status: PENDING, WAITING, ACTIVE, COMPLETED', enum: ['PENDING', 'WAITING', 'ACTIVE', 'COMPLETED'] },
        priority: { type: 'string', description: 'Task priority: HIGH, MEDIUM, LOW', enum: ['HIGH', 'MEDIUM', 'LOW'] },
        project: { type: 'string', description: 'Project name' },
        assignee: { type: 'string', description: 'Assignee name' },
        dueDate: { type: 'string', description: 'Due date in ISO format' },
        waitUntil: { type: 'string', description: 'Wait until date in ISO format' },
        tags: { type: 'string', description: 'Comma-separated tags' },
        depends: { type: 'string', description: 'Comma-separated task IDs' }
      },
      required: ['title']
    }
  },
  {
    name: 'getTasks',
    description: 'Get all tasks with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        priority: { type: 'string', description: 'Filter by priority' },
        project: { type: 'string', description: 'Filter by project' },
        assignee: { type: 'string', description: 'Filter by assignee' }
      }
    }
  },
  {
    name: 'getActiveTasks',
    description: 'Get all active tasks',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'getPendingTasks', 
    description: 'Get all pending tasks',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'startTask',
    description: 'Start a task (set to active)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'markTaskDone',
    description: 'Mark task as completed',
    inputSchema: {
      type: 'object', 
      properties: {
        id: { type: 'string', description: 'Task ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'getDashboard',
    description: 'Get dashboard overview',
    inputSchema: { type: 'object', properties: {} }
  }
];

// Register tools
server.setRequestHandler('tools/list', async () => ({
  tools
}));

// Handle tool calls by proxying to Synaptik HTTP API
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Make HTTP request to Synaptik MCP endpoint
    const response = await axios.post(`${SYNAPTIK_BASE_URL}/mcp/tools/${name}`, args, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    return {
      content: [{
        type: 'text',
        text: response.data
      }]
    };
  } catch (error) {
    console.error(`Error calling tool ${name}:`, error.message);
    return {
      content: [{
        type: 'text', 
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

// Start stdio transport
const transport = new StdioServerTransport();
server.connect(transport);

console.error('Synaptik MCP Bridge started');