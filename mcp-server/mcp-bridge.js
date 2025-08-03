#!/usr/bin/env node

/**
 * MCP Stdio Bridge for Synaptik
 * Bridges between stdio MCP protocol and Synaptik's HTTP MCP endpoints
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const SYNAPTIK_BASE_URL = process.env.SYNAPTIK_URL || 'http://localhost:9001';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FILE_PATH = process.env.MCP_LOG_FILE || `${process.env.HOME}/.synaptik/logs/mcp-bridge.log`;

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Simple logging function
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
  
  // Always log to stderr for MCP protocol
  console.error(logMessage, ...args);
  
  // Also log to file if enabled
  try {
    fs.appendFileSync(LOG_FILE_PATH, logMessage + (args.length > 0 ? ' ' + JSON.stringify(args) : '') + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

// Debug logging helper
function debug(message, ...args) {
  if (LOG_LEVEL === 'debug') {
    log('debug', message, ...args);
  }
}

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
  debug('Listing available tools', { toolCount: tools.length });
  return { tools };
});

// Register tools/call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  debug('Calling tool', { name, args });
  log('info', `Executing tool: ${name}`);
  
  try {
    const response = await axios.post(`${SYNAPTIK_BASE_URL}/mcp/tools/${name}`, args, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    debug('Tool response received', { name, status: response.status, dataType: typeof response.data });
    log('info', `Tool ${name} executed successfully`);
    
    return {
      content: [{
        type: 'text',
        text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
      }]
    };
  } catch (error) {
    log('error', `Error calling tool ${name}`, { error: error.message, args });
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
    log('info', 'Starting Synaptik MCP Bridge', { 
      synaptikUrl: SYNAPTIK_BASE_URL, 
      logLevel: LOG_LEVEL,
      logFile: LOG_FILE_PATH 
    });
    
    // Start stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log('info', 'Synaptik MCP Bridge started successfully');
  } catch (error) {
    log('error', 'Failed to start MCP Bridge', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();