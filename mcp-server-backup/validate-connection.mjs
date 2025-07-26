#!/usr/bin/env node

import axios from 'axios';

const API_BASE_URL = process.env.SYNAPTIK_API_URL || 'http://localhost:3001/api';

console.log('🧪 Testing Synaptik API connectivity...');
console.log(`📡 API Base URL: ${API_BASE_URL}`);

async function testConnection() {
  try {
    // Test basic connectivity
    console.log('\n1. Testing basic connectivity...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server health check passed');
    
    // Test tasks endpoint
    console.log('\n2. Testing tasks endpoint...');
    const tasksResponse = await axios.get(`${API_BASE_URL}/tasks`);
    console.log(`✅ Tasks endpoint accessible - Found ${tasksResponse.data.data?.length || 0} tasks`);
    
    // Test projects endpoint
    console.log('\n3. Testing projects endpoint...');
    try {
      const projectsResponse = await axios.get(`${API_BASE_URL}/projects`);
      console.log(`✅ Projects endpoint accessible - Found ${projectsResponse.data.data?.length || 0} projects`);
    } catch (err) {
      console.log('⚠️  Projects endpoint may not be available (this is optional)');
    }
    
    // Test quick capture
    console.log('\n4. Testing quick capture...');
    const captureResponse = await axios.post(`${API_BASE_URL}/tasks/capture`, {
      input: 'Test MCP connectivity +mcp-test priority:L'
    });
    console.log('✅ Quick capture working');
    
    console.log('\n🎉 All API tests passed! MCP server should work correctly.');
    console.log('\n💡 To start the MCP server:');
    console.log('   npm run mcp:dev');
    
  } catch (error) {
    console.error('\n❌ API connection failed:');
    if (axios.isAxiosError(error)) {
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   URL: ${error.config?.url}`);
    } else {
      console.error(`   ${error.message}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the Synaptik server is running (npm run server:dev)');
    console.log('   2. Check that the API URL is correct');
    console.log('   3. Verify MongoDB is running and accessible');
    
    process.exit(1);
  }
}

testConnection();
