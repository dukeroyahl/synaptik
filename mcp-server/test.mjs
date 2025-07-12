#!/usr/bin/env node

// Simple test to verify the MCP server can start and list tools
import { spawn } from 'child_process';

console.log('Testing Synaptik MCP Server...');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: '/Users/rry14/Projects/POC/poiesis/synaptik/mcp-server'
});

// Test: Send a tools/list request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('Server output:', data.toString());
});

server.stderr.on('data', (data) => {
  console.log('Server started:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Send close signal after 2 seconds
setTimeout(() => {
  server.kill('SIGTERM');
  console.log('Test completed.');
}, 2000);
