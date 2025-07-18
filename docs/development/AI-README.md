# AI Assistant Guide for Synaptik

This document provides comprehensive guidance for AI assistants when working with the Synaptik codebase, including development workflows, architecture patterns, and best practices.

## Project Overview

Synaptik is a comprehensive task management application with TaskWarrior-inspired features, project management, and AI integration capabilities. The name combines "synapse" (neural connections) with "tactic" (strategic planning), representing how ideas and projects interconnect.

### Architecture Components

- **Frontend**: React 18 + TypeScript + Vite + Material-UI + Zustand
- **Backend**: Java 21 + Quarkus + MongoDB/Panache (Reactive, Enterprise-grade)
- **AI Integration**: Model Context Protocol (MCP) server for seamless AI assistant integration
- **Database**: MongoDB with reactive operations and comprehensive indexing

### Current Status

**✅ Migration Complete**: Successfully migrated from Node.js/TypeScript to Java 21/Quarkus backend, providing:
- Reactive programming with MongoDB Panache
- Enterprise-grade performance and scalability
- Comprehensive validation and error handling
- OpenAPI documentation and health monitoring
- Native AI integration through MCP protocol

## Development Workflows

### Quick Start Commands

```bash
# Install all dependencies across all projects
npm run install:all

# Start all services (client, server, MCP) concurrently
npm run dev

# Build for production
npm run build
```

### Individual Service Management

```bash
# Frontend development (http://localhost:5173)
npm run client:dev

# Backend development (http://localhost:8080)
npm run server:dev

# AI integration server
npm run mcp:dev

# Database management
npm run mongo:start
npm run mongo:stop
npm run mongo:connect
```

### Java Backend Operations

```bash
# Development with hot reload
cd server && ./gradlew quarkusDev

# Production build
cd server && ./gradlew clean build

# Run tests
cd server && ./gradlew test

# Production deployment
cd server && ./gradlew quarkusRun
```

## Code Architecture Deep Dive

### Backend Structure (Java 21 + Quarkus)

```
server/src/main/java/com/synaptik/
├── model/           # Entity classes with MongoDB Panache
├── resource/        # REST endpoints (JAX-RS)
├── service/         # Business logic layer
├── repository/      # Data access layer
├── dto/            # Data transfer objects
├── validation/     # Custom validators and business rules
├── exception/      # Exception handling
├── config/         # Configuration classes
└── security/       # Security components
```

### Core Data Models

#### Task Model (`model/Task.java`)
- **TaskWarrior Integration**: Full compatibility with TaskWarrior conventions
- **Status Management**: `PENDING`, `WAITING`, `ACTIVE`, `COMPLETED`, `DELETED`
- **Priority System**: `HIGH`, `MEDIUM`, `LOW`, `NONE`
- **Smart Urgency**: Automatic calculation based on priority, due dates, age, and tags
- **Validation**: Comprehensive business rule validation
- **Features**: Dependencies, annotations, tags, date validation

#### Project Model (`model/Project.java`)
- **Lifecycle Management**: `PLANNING`, `ACTIVE`, `COMPLETED`, `ON_HOLD`
- **Progress Tracking**: 0-100% completion with automatic calculation
- **Integration**: Optional mindmap visualization support
- **Hierarchy**: Support for project relationships and dependencies

#### Mindmap Model (`model/Mindmap.java`)
- **Visual Organization**: D3.js integration for interactive mindmaps
- **Node Structure**: Hierarchical data representation
- **Collaboration**: Multi-user support and real-time updates

### Frontend Architecture (`client/src/`)

#### State Management
- **Zustand**: Lightweight, reactive state management
- **React Query**: Server state management with caching and optimistic updates
- **Local Storage**: Theme and user preference persistence

#### Routing Structure
```
/ (Dashboard)           # Task overview and analytics
/calendar              # Calendar view for task scheduling
/matrix                # Eisenhower Matrix for prioritization
/projects              # Project management interface
/mindmaps              # Visual project organization
```

#### Component Organization
```
components/
├── task/              # Task-related components
├── project/           # Project management components
├── mindmap/           # Mindmap visualization components
├── calendar/          # Calendar integration components
├── common/            # Shared UI components
└── layout/            # Layout and navigation components
```

### API Architecture

#### RESTful Endpoints

**Task Management** (`/api/tasks`):
```
GET    /api/tasks              # List all tasks with filtering
POST   /api/tasks              # Create new task
GET    /api/tasks/{id}         # Get specific task
PUT    /api/tasks/{id}         # Update task
DELETE /api/tasks/{id}         # Delete task

# TaskWarrior-style actions
POST   /api/tasks/{id}/start   # Start working on task
POST   /api/tasks/{id}/stop    # Stop working on task
POST   /api/tasks/{id}/done    # Mark task complete
POST   /api/tasks/capture      # Quick capture with natural language

# Filtering endpoints
GET    /api/tasks/pending      # Get pending tasks
GET    /api/tasks/active       # Get active tasks
GET    /api/tasks/overdue      # Get overdue tasks
GET    /api/tasks/today        # Get today's tasks
```

**Project Management** (`/api/projects`):
```
GET    /api/projects           # List all projects
POST   /api/projects           # Create new project
GET    /api/projects/{id}      # Get specific project
PUT    /api/projects/{id}      # Update project
DELETE /api/projects/{id}      # Delete project
GET    /api/projects/{id}/tasks # Get project tasks
```

**Mindmap Operations** (`/api/mindmaps`):
```
GET    /api/mindmaps           # List all mindmaps
POST   /api/mindmaps           # Create new mindmap
GET    /api/mindmaps/{id}      # Get specific mindmap
PUT    /api/mindmaps/{id}      # Update mindmap
DELETE /api/mindmaps/{id}      # Delete mindmap
```

#### API Features
- **OpenAPI Documentation**: Available at `/q/swagger-ui`
- **Health Monitoring**: Available at `/q/health`
- **Metrics**: Prometheus metrics at `/q/metrics`
- **Reactive Programming**: Non-blocking I/O throughout
- **CORS Support**: Configured for development and production

## AI Integration (MCP Server)

### Available AI Tools

The MCP server exposes comprehensive task management capabilities to AI assistants:

```typescript
// Task Management Tools
synaptik___create_task         // Create tasks with natural language
synaptik___get_tasks          // Retrieve and filter tasks
synaptik___update_task        // Update existing tasks
synaptik___delete_task        // Delete tasks
synaptik___start_task         // Start working on tasks
synaptik___stop_task          // Stop working on tasks
synaptik___complete_task      // Mark tasks complete

// Project Management Tools
synaptik___get_projects       // Retrieve projects
synaptik___create_project     // Create new projects
synaptik___update_project     // Update projects

// Mindmap Tools
synaptik___get_mindmaps       // Retrieve mindmaps
synaptik___create_mindmap     // Create mindmaps

// Quick Actions
synaptik___quick_capture      // Natural language task capture
synaptik___get_dashboard      // Get dashboard overview
```

### AI Integration Benefits

- **Natural Language Processing**: Convert conversational requests to structured tasks
- **Intelligent Prioritization**: AI-assisted task prioritization and scheduling
- **Context Awareness**: Understanding of project relationships and dependencies
- **Voice Integration**: Voice-to-task conversion capabilities
- **Workflow Automation**: Automated task creation from meeting notes, emails, etc.

### MCP Configuration

For AI assistants supporting MCP (like Claude Desktop):

```json
{
  "mcpServers": {
    "synaptik": {
      "command": "node",
      "args": ["/path/to/synaptik/mcp-server/dist/index.js"],
      "env": {
        "SYNAPTIK_API_URL": "http://localhost:8080/api"
      }
    }
  }
}
```

## Development Patterns & Best Practices

### Task Management Patterns

```java
// ✅ Correct: Use service methods for business logic
@Inject
TaskService taskService;

// Start a task properly
Task task = taskService.startTask(taskId);

// ❌ Incorrect: Direct status manipulation
task.setStatus(TaskStatus.ACTIVE); // Bypasses business logic
```

### Reactive Programming Patterns

```java
// ✅ Correct: Reactive database operations
public Uni<List<Task>> getPendingTasks() {
    return Task.find("status", TaskStatus.PENDING)
              .list();
}

// ✅ Correct: Non-blocking service calls
public Uni<Task> createTask(TaskCreateRequest request) {
    return validateTask(request)
        .flatMap(this::saveTask)
        .flatMap(this::calculateUrgency);
}
```

### Frontend State Management

```typescript
// ✅ Correct: Zustand store pattern
interface TaskStore {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

// ✅ Correct: React Query for server state
const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks', filters],
  queryFn: () => taskService.getTasks(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Validation Patterns

```java
// ✅ Custom validation annotations
@ValidTaskWarriorDate
@NotNull
private LocalDateTime due;

@NoCyclicDependency
private List<String> dependencies;

@ValidTaskStateTransition
private TaskStatus status;
```

## Configuration Management

### Backend Configuration

**Environment Variables** (`.env`):
```bash
MONGODB_URI=mongodb://localhost:27017/synaptik
QUARKUS_HTTP_PORT=8080
QUARKUS_HTTP_CORS=true
QUARKUS_LOG_LEVEL=INFO
```

**Application Properties** (`application.properties`):
```properties
# MongoDB
quarkus.mongodb.connection-string=${MONGODB_URI}
quarkus.mongodb.database=synaptik

# HTTP & CORS
quarkus.http.port=8080
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:5173

# Documentation
quarkus.swagger-ui.always-include=true
quarkus.swagger-ui.path=/swagger-ui

# Health & Metrics
quarkus.smallrye-health.ui.always-include=true
```

### Frontend Configuration

**Environment Variables** (`.env.local`):
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_PORT=5173
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_API_KEY=your_api_key
```

## Database Design

### MongoDB Collections

```javascript
// Tasks Collection
{
  _id: ObjectId,
  title: String,
  description: String,
  status: Enum['PENDING', 'WAITING', 'ACTIVE', 'COMPLETED', 'DELETED'],
  priority: Enum['HIGH', 'MEDIUM', 'LOW', 'NONE'],
  urgency: Number, // Auto-calculated
  due: Date,
  created: Date,
  modified: Date,
  tags: [String],
  dependencies: [ObjectId],
  annotations: [{
    timestamp: Date,
    description: String
  }],
  project: ObjectId // Reference to Project
}

// Projects Collection
{
  _id: ObjectId,
  name: String,
  description: String,
  status: Enum['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD'],
  progress: Number, // 0-100
  created: Date,
  modified: Date,
  mindmap: ObjectId // Optional reference
}
```

### Indexing Strategy

```javascript
// Performance indexes
db.tasks.createIndex({ "status": 1, "priority": 1 });
db.tasks.createIndex({ "due": 1 });
db.tasks.createIndex({ "tags": 1 });
db.tasks.createIndex({ "project": 1 });
db.tasks.createIndex({ "$text": { "title": 1, "description": 1 } });

db.projects.createIndex({ "status": 1 });
db.projects.createIndex({ "$text": { "name": 1, "description": 1 } });
```

## Testing Strategies

### Backend Testing

```java
@QuarkusTest
class TaskServiceTest {
    
    @Inject
    TaskService taskService;
    
    @Test
    void shouldCalculateUrgencyCorrectly() {
        // Test urgency calculation logic
    }
    
    @Test
    void shouldValidateTaskStateTransitions() {
        // Test business rule validation
    }
}
```

### Frontend Testing

```typescript
// Component testing with React Testing Library
describe('TaskCard', () => {
  it('should display task information correctly', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
  });
});

// Hook testing
describe('useTaskActions', () => {
  it('should handle task completion', async () => {
    const { result } = renderHook(() => useTaskActions());
    await act(async () => {
      await result.current.completeTask('task-id');
    });
    // Assert task completion
  });
});
```

## Troubleshooting Guide

### Common Development Issues

1. **Port Conflicts**
   - Frontend: 5173 (Vite default)
   - Backend: 8080 (Quarkus default)
   - MCP Server: 3001
   - MongoDB: 27017

2. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB status
   brew services list | grep mongodb
   
   # Start MongoDB
   brew services start mongodb-community
   
   # Connect to verify
   mongosh synaptik
   ```

3. **Java Version Issues**
   ```bash
   # Verify Java 21+
   java -version
   
   # Set JAVA_HOME if needed
   export JAVA_HOME=/path/to/java21
   ```

4. **Build Issues**
   ```bash
   # Clean and rebuild
   cd server && ./gradlew clean build
   cd client && rm -rf node_modules && npm install
   ```

### Performance Optimization

1. **Database Queries**
   - Use reactive queries for better performance
   - Implement proper indexing
   - Use projection to limit returned fields

2. **Frontend Optimization**
   - Implement proper React Query caching
   - Use React.memo for expensive components
   - Implement virtual scrolling for large lists

3. **API Optimization**
   - Use reactive programming patterns
   - Implement proper error handling
   - Use compression for large responses

## Security Considerations

### Backend Security
- Input validation at multiple layers
- SQL injection prevention through Panache
- CORS configuration for cross-origin requests
- JWT token support (configured but not implemented)

### Frontend Security
- XSS prevention through React's built-in protections
- Secure API communication
- Environment variable protection
- Content Security Policy headers

## Deployment Guidelines

### Development Deployment
```bash
# Start all services
npm run dev

# Verify services
curl http://localhost:8080/q/health
curl http://localhost:5173
```

### Production Deployment
```bash
# Build all components
npm run build
npm run build:server

# Start production server
cd server && ./gradlew quarkusRun
```

### Docker Deployment
```bash
# MongoDB via Docker
docker-compose up -d mongodb

# Application containers (if configured)
docker-compose up -d
```

This guide provides comprehensive information for AI assistants to effectively work with the Synaptik codebase, understanding its architecture, patterns, and best practices for development and maintenance.
