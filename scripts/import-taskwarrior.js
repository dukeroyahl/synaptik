#!/usr/bin/env node

/**
 * Command-line script to import TaskWarrior tasks into Synaptik
 * 
 * Usage:
 *   node import-taskwarrior.js [--force]
 * 
 * Options:
 *   --force  Delete all existing tasks before importing
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine the server directory
const serverDir = path.join(__dirname, '..', 'server');

// Check if the server directory exists
if (!fs.existsSync(serverDir)) {
  console.error('Error: Server directory not found.');
  process.exit(1);
}

// Check if TypeScript is installed
try {
  execSync('npx tsc --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Error: TypeScript is not installed. Please run "npm install -g typescript".');
  process.exit(1);
}

// Check if ts-node is installed
try {
  execSync('npx ts-node --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Error: ts-node is not installed. Please run "npm install -g ts-node".');
  process.exit(1);
}

// Check if TaskWarrior is installed
try {
  execSync('task --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Error: TaskWarrior is not installed or not in PATH.');
  process.exit(1);
}

// Parse command-line arguments
const force = process.argv.includes('--force');

console.log('Importing TaskWarrior tasks into Synaptik...');
console.log(force ? 'Force mode: ON (existing tasks will be deleted)' : 'Force mode: OFF');

try {
  // Run the import script using ts-node
  const scriptPath = path.join(serverDir, 'src', 'utils', 'taskwarriorImport.ts');
  
  const command = `cd ${serverDir} && npx ts-node ${scriptPath}${force ? ' --force' : ''}`;
  
  console.log('Executing:', command);
  const result = execSync(command, { encoding: 'utf8' });
  
  console.log(result);
  console.log('Import completed successfully.');
} catch (error) {
  console.error('Error during import:', error.message);
  process.exit(1);
}
