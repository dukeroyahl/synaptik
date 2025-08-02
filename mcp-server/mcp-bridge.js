#!/usr/bin/env node

/**
 * MCP Stdio Bridge for Synaptik
 * Bridges between stdio MCP protocol and Synaptik's HTTP MCP endpoints
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const SYNAPTIK_BASE_URL = process.env.SYNAPTIK_URL || 'http://localhost:9001';

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

// Create MCP server
const server = new Server(
  { name: 'synaptik', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Register tools/list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register tools/call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const response = await axios.post(`${SYNAPTIK_BASE_URL}/mcp/tools/${name}`, args, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    return {
      content: [{
        type: 'text',
        text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
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

async function main() {
  try {
    // Start stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Synaptik MCP Bridge started');
  } catch (error) {
    console.error('Failed to start MCP Bridge:', error);
    process.exit(1);
  }
}

main();