#!/usr/bin/env node
/**
 * Script to fix corrupted dates in the database
 * Run this to clean up tasks with dates from 1970 or other invalid years
 */

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synaptik');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define Task schema (simplified version)
const TaskSchema = new mongoose.Schema({
  title: String,
  dueDate: Date,
  scheduledDate: Date,
  waitUntil: Date,
  startDate: Date,
  endDate: Date,
  entry: Date,
  modified: Date
});

const Task = mongoose.model('Task', TaskSchema);

const fixCorruptedDates = async () => {
  try {
    console.log('Starting corrupted date cleanup...');
    
    // Find tasks with dates before year 2000 or after 2100
    const corruptedTasks = await Task.find({
      $or: [
        { dueDate: { $lt: new Date('2000-01-01') } },
        { dueDate: { $gt: new Date('2100-01-01') } },
        { scheduledDate: { $lt: new Date('2000-01-01') } },
        { scheduledDate: { $gt: new Date('2100-01-01') } },
        { waitUntil: { $lt: new Date('2000-01-01') } },
        { waitUntil: { $gt: new Date('2100-01-01') } },
        { startDate: { $lt: new Date('2000-01-01') } },
        { startDate: { $gt: new Date('2100-01-01') } },
        { endDate: { $lt: new Date('2000-01-01') } },
        { endDate: { $gt: new Date('2100-01-01') } }
      ]
    });

    console.log(`Found ${corruptedTasks.length} tasks with corrupted dates`);

    let fixedCount = 0;
    for (const task of corruptedTasks) {
      let wasFixed = false;
      
      if (task.dueDate && (task.dueDate.getFullYear() < 2000 || task.dueDate.getFullYear() > 2100)) {
        console.log(`Fixing dueDate for task "${task.title}": ${task.dueDate} -> null`);
        task.dueDate = null;
        wasFixed = true;
      }
      
      if (task.scheduledDate && (task.scheduledDate.getFullYear() < 2000 || task.scheduledDate.getFullYear() > 2100)) {
        console.log(`Fixing scheduledDate for task "${task.title}": ${task.scheduledDate} -> null`);
        task.scheduledDate = null;
        wasFixed = true;
      }
      
      if (task.waitUntil && (task.waitUntil.getFullYear() < 2000 || task.waitUntil.getFullYear() > 2100)) {
        console.log(`Fixing waitUntil for task "${task.title}": ${task.waitUntil} -> null`);
        task.waitUntil = null;
        wasFixed = true;
      }
      
      if (task.startDate && (task.startDate.getFullYear() < 2000 || task.startDate.getFullYear() > 2100)) {
        console.log(`Fixing startDate for task "${task.title}": ${task.startDate} -> null`);
        task.startDate = null;
        wasFixed = true;
      }
      
      if (task.endDate && (task.endDate.getFullYear() < 2000 || task.endDate.getFullYear() > 2100)) {
        console.log(`Fixing endDate for task "${task.title}": ${task.endDate} -> null`);
        task.endDate = null;
        wasFixed = true;
      }
      
      if (wasFixed) {
        await task.save();
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} tasks with corrupted dates`);
    console.log('Corrupted date cleanup completed!');
    
  } catch (error) {
    console.error('Error fixing corrupted dates:', error);
  }
};

const main = async () => {
  await connectDB();
  await fixCorruptedDates();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixCorruptedDates };
