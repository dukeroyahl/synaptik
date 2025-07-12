// MongoDB initialization script for Synaptik
// This script creates the database and initial collections

db = db.getSiblingDB('synaptik');

// Create collections with validation
db.createCollection('projects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Project name is required and must be a string'
        },
        description: {
          bsonType: 'string',
          description: 'Project description is required and must be a string'
        },
        status: {
          enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
          description: 'Status must be one of the predefined values'
        },
        priority: {
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Priority must be one of the predefined values'
        },
        startDate: {
          bsonType: 'date',
          description: 'Start date must be a date'
        },
        endDate: {
          bsonType: 'date',
          description: 'End date must be a date'
        }
      }
    }
  }
});

db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'projectId'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'Task title is required and must be a string'
        },
        projectId: {
          bsonType: 'objectId',
          description: 'Project ID is required and must be an ObjectId'
        },
        status: {
          enum: ['todo', 'in-progress', 'review', 'done'],
          description: 'Status must be one of the predefined values'
        },
        priority: {
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Priority must be one of the predefined values'
        },
        dueDate: {
          bsonType: 'date',
          description: 'Due date must be a date'
        }
      }
    }
  }
});

db.createCollection('mindmaps', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'nodes'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'Mindmap title is required and must be a string'
        },
        nodes: {
          bsonType: 'array',
          description: 'Nodes is required and must be an array'
        },
        edges: {
          bsonType: 'array',
          description: 'Edges must be an array'
        }
      }
    }
  }
});

// Create indexes for better performance
db.projects.createIndex({ name: 1 });
db.projects.createIndex({ status: 1 });
db.projects.createIndex({ createdAt: -1 });

db.tasks.createIndex({ projectId: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ priority: 1 });
db.tasks.createIndex({ dueDate: 1 });

db.mindmaps.createIndex({ title: 1 });
db.mindmaps.createIndex({ projectId: 1 });
db.mindmaps.createIndex({ createdAt: -1 });

print('✅ Synaptik database initialized successfully!');
