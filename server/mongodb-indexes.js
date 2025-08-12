// MongoDB Index Setup Script for Synaptik
// Run this script in MongoDB shell: mongosh < mongodb-indexes.js

// Switch to your database
use synaptik;

print("Creating indexes for Synaptik database...");

// ===== TASKS COLLECTION =====
print("Creating indexes for tasks collection...");

// Primary query patterns
db.tasks.createIndex({ "status": 1 });
db.tasks.createIndex({ "priority": 1 });
db.tasks.createIndex({ "assignee": 1 });
db.tasks.createIndex({ "projectId": 1 });

// Date-based queries (very important for due/overdue tasks)
db.tasks.createIndex({ "dueDate": 1 });
db.tasks.createIndex({ "createdAt": 1 });
db.tasks.createIndex({ "updatedAt": 1 });
db.tasks.createIndex({ "waitUntil": 1 });

// Compound indexes for common query patterns
db.tasks.createIndex({ "status": 1, "dueDate": 1 });
db.tasks.createIndex({ "status": 1, "priority": 1 });
db.tasks.createIndex({ "projectId": 1, "status": 1 });
db.tasks.createIndex({ "assignee": 1, "status": 1 });

// Search functionality
db.tasks.createIndex({ 
  "title": "text", 
  "description": "text",
  "assignee": "text"
}, {
  name: "task_search_index",
  weights: {
    "title": 10,
    "description": 5,
    "assignee": 3
  }
});

// Partial indexes for performance (only index non-null values)
db.tasks.createIndex(
  { "dueDate": 1 }, 
  { 
    name: "tasks_dueDate_partial",
    partialFilterExpression: { "dueDate": { $exists: true, $ne: null } } 
  }
);

db.tasks.createIndex(
  { "waitUntil": 1 }, 
  { 
    name: "tasks_waitUntil_partial",
    partialFilterExpression: { "waitUntil": { $exists: true, $ne: null } } 
  }
);

// ===== PROJECTS COLLECTION =====
print("Creating indexes for projects collection...");

db.projects.createIndex({ "name": 1 }, { unique: true });
db.projects.createIndex({ "status": 1 });
db.projects.createIndex({ "createdAt": 1 });
db.projects.createIndex({ "dueDate": 1 });

// Project search
db.projects.createIndex({ 
  "name": "text", 
  "description": "text" 
}, {
  name: "project_search_index"
});

// ===== PERFORMANCE INDEXES =====
print("Creating performance optimization indexes...");

// For task counting by project
db.tasks.createIndex({ "projectId": 1, "status": 1 });

// For urgency-based sorting
db.tasks.createIndex({ "urgency": -1 });

// For recent tasks
db.tasks.createIndex({ "createdAt": -1 });

print("Index creation completed!");

// ===== VERIFY INDEXES =====
print("\n=== TASKS INDEXES ===");
db.tasks.getIndexes().forEach(function(index) {
  print("- " + index.name + ": " + JSON.stringify(index.key));
});

print("\n=== PROJECTS INDEXES ===");
db.projects.getIndexes().forEach(function(index) {
  print("- " + index.name + ": " + JSON.stringify(index.key));
});

print("\nIndex setup complete! 🚀");
