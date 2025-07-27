#!/bin/bash
set -e

echo "=== Synaptik Docker Container Starting ==="

# Create log directory
mkdir -p /var/log/synaptik
chown -R synaptik:synaptik /var/log/synaptik

# Initialize MongoDB data directory if it doesn't exist
if [ ! -d "/data/db/WiredTiger" ]; then
    echo "Initializing MongoDB data directory..."
    chown -R synaptik:synaptik /data/db
    
    # Start MongoDB temporarily to initialize
    echo "Starting MongoDB for initialization..."
    sudo -u synaptik mongod --config /etc/mongod.conf --fork
    
    # Wait for MongoDB to start
    echo "Waiting for MongoDB to be ready..."
    while ! mongo --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
        sleep 1
    done
    
    # Initialize replica set (required for transactions)
    echo "Initializing replica set..."
    mongo --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
    
    # Create Synaptik database and collections
    echo "Setting up Synaptik database..."
    mongo synaptik --eval "
        db.createCollection('tasks');
        db.createCollection('projects');
        db.createCollection('mindmaps');
        
        // Create indexes for better performance
        db.tasks.createIndex({ 'status': 1 });
        db.tasks.createIndex({ 'priority': 1 });
        db.tasks.createIndex({ 'dueDate': 1 });
        db.tasks.createIndex({ 'project': 1 });
        db.tasks.createIndex({ 'tags': 1 });
        db.tasks.createIndex({ 'title': 'text', 'description': 'text' });
        
        db.projects.createIndex({ 'status': 1 });
        db.projects.createIndex({ 'name': 'text', 'description': 'text' });
        
        db.mindmaps.createIndex({ 'owner': 1 });
        db.mindmaps.createIndex({ 'isPublic': 1 });
        db.mindmaps.createIndex({ 'projectId': 1 });
        
        print('Database setup complete');
    "
    
    # Stop the temporary MongoDB instance
    echo "Stopping temporary MongoDB instance..."
    mongo admin --eval "db.shutdownServer()"
    sleep 2
fi

# Ensure proper ownership
chown -R synaptik:synaptik /data/db /var/log/synaptik

# Create nginx directories and set permissions
mkdir -p /var/log/nginx /var/cache/nginx /var/lib/nginx
chown -R nginx:nginx /var/log/nginx /var/cache/nginx /var/lib/nginx

echo "=== Starting services with Supervisor ==="

# Execute the original command
exec "$@"