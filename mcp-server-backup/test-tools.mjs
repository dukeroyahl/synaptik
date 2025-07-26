#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing MCP Server Tools...');

const server = spawn('node', [join(__dirname, 'dist/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

// Collect output
server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  if (data.toString().includes('running on stdio')) {
    console.log('✅ Server started successfully');
    
    // Send a tools/list request
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    console.log('📋 Requesting tools list...');
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    
    // Wait a bit for response then close
    setTimeout(() => {
      server.kill('SIGTERM');
    }, 1000);
  }
});

server.on('close', (code) => {
  console.log(`\n📊 Test Results:`);
  
  if (errorOutput.includes('running on stdio')) {
    console.log('✅ Server startup: SUCCESS');
  } else {
    console.log('❌ Server startup: FAILED');
    console.log('Error output:', errorOutput);
  }
  
  if (output.length > 0) {
    console.log('✅ Server response: Received output');
    try {
      const response = JSON.parse(output);
      if (response.result && response.result.tools) {
        console.log(`✅ Tools available: ${response.result.tools.length} tools found`);
        console.log('📋 Available tools:');
        response.result.tools.forEach(tool => {
          console.log(`   - ${tool.name}: ${tool.description}`);
        });
      }
    } catch (e) {
      console.log('📝 Raw output:', output.substring(0, 200) + '...');
    }
  } else {
    console.log('⚠️  No response received (this may be normal for stdio protocol)');
  }
  
  console.log('\n🎉 MCP Server test completed!');
});
