# 📚 Synaptik Wiki

*Comprehensive documentation for the Synaptik task management application*

## 🏗️ Architecture Overview

### System Architecture
Synaptik follows a modern, reactive architecture pattern with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │────│  Quarkus Backend │────│   MongoDB       │
│   (Port 5173)   │    │   (Port 8080)    │    │  (Port 27017)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         └────────────────────────┼─────────────────────────────────┐
                                  │                                 │
                       ┌──────────▼─────────┐         ┌─────────────▼──┐
                       │   MCP Server       │         │  AI Assistants │
                       │   (Node.js/stdio)  │         │   (Claude)     │
                       └────────────────────┘         └────────────────┘
```

### Technology Stack Details

#### Frontend Stack
- **React 18**: Modern functional components with hooks
- **TypeScript 5+**: Type safety and enhanced developer experience
- **Vite**: Fast build tool and development server
- **Material-UI**: Google's Material Design components
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication

#### Backend Stack
- **Java 21**: Latest LTS with modern language features
- **Quarkus 3.6+**: Kubernetes-native Java framework
- **Reactive Programming**: Non-blocking I/O with Mutiny
- **JAX-RS**: RESTful web services
- **MongoDB Panache**: Reactive MongoDB integration
- **Hibernate Validator**: Bean validation
- **SmallRye**: MicroProfile implementations

#### Database & Infrastructure
- **MongoDB**: Document-based NoSQL database
- **Docker**: Containerization for deployment
- **Docker Compose**: Multi-container orchestration

#### AI Integration
- **Model Context Protocol (MCP)**: Standard for AI tool integration
- **Node.js**: Runtime for MCP server
- **TypeScript**: Type-safe MCP tool development

## 🎯 Core Features Deep Dive

### TaskWarrior-Inspired Task Management

#### Natural Language Processing
Synaptik supports TaskWarrior's intuitive syntax for task creation:

```bash
# Basic task creation
"Buy groceries"

# With due date
"Buy groceries due:tomorrow"

# With priority and tags
"Buy groceries due:tomorrow priority:high +shopping"

# With project assignment
"Review code project:synaptik due:friday"

# Complex task with multiple attributes
"Deploy website project:work due:2024-01-15 priority:medium +devops +urgent"
```

#### Urgency Calculation
Tasks are automatically prioritized using TaskWarrior's proven urgency algorithm:

```
Urgency = (Priority × 6.0) + (Project × 1.0) + (Tags × 1.0) + 
          (Due Date Coefficient) + (Age × 2.0) + (Annotations × 1.0)
```

Factors affecting urgency:
- **Priority**: High (6.0), Medium (3.9), Low (1.8)
- **Due Date**: Overdue (+12.0), Due today (+5.0), Due soon (+2.0)
- **Age**: Increases over time to prevent task stagnation
- **Tags**: Special tags can boost urgency (+1.0 each)
- **Project**: Tasks in active projects get slight boost

#### Task States and Lifecycle
```
pending → active → completed
    ↓       ↓         ↑
    ↓   → stopped → done
    ↓       ↑         ↑
    → → deleted ← ← ← ←
```

### Advanced Project Management

#### Project Hierarchy
- **Root Projects**: Top-level project containers
- **Sub-projects**: Nested project organization
- **Task Dependencies**: Manage complex project workflows
- **Milestone Tracking**: Key deliverable management

#### Mindmap Visualization
Interactive D3.js-powered mindmaps provide visual project organization:
- **Drag & Drop**: Rearrange project structure
- **Zoom & Pan**: Navigate large project hierarchies
- **Real-time Updates**: Live collaboration features
- **Export Options**: Save mindmaps as images or data

### AI Integration Architecture

#### Model Context Protocol (MCP) Server
The MCP server acts as a bridge between AI assistants and Synaptik's API:

```typescript
// MCP Tool Example
{
  name: "create_task",
  description: "Create a new task with TaskWarrior syntax",
  inputSchema: {
    type: "object",
    properties: {
      description: { type: "string" },
      syntax: { type: "string", optional: true }
    }
  }
}
```

#### Available AI Tools
1. **Task Management**
   - `create_task`: Create tasks with natural language
   - `list_tasks`: Filter and retrieve tasks
   - `update_task`: Modify existing tasks
   - `delete_task`: Remove tasks

2. **Task Actions**
   - `start_task`: Begin working on a task
   - `stop_task`: Pause current work
   - `complete_task`: Mark task as done

3. **Project Management**
   - `create_project`: Set up new projects
   - `list_projects`: Browse project hierarchy
   - `assign_task_to_project`: Organize tasks

4. **Analytics & Reporting**
   - `get_task_stats`: Productivity insights
   - `generate_report`: Custom reporting

## 🔌 API Reference

### Core Endpoints

#### Tasks API (`/api/tasks`)

**List Tasks**
```http
GET /api/tasks?status=pending&project=work&priority=high
```

**Create Task**
```http
POST /api/tasks
Content-Type: application/json

{
  "description": "Review pull request",
  "priority": "HIGH",
  "project": "synaptik",
  "tags": ["code-review", "urgent"],
  "dueDate": "2024-01-15T10:00:00Z"
}
```

**Task Actions**
```http
POST /api/tasks/{id}/start     # Start working
POST /api/tasks/{id}/stop      # Stop working  
POST /api/tasks/{id}/done      # Mark complete
POST /api/tasks/{id}/undone    # Reopen task
```

**Quick Capture** (TaskWarrior syntax)
```http
POST /api/tasks/capture
Content-Type: application/json

{
  "input": "Buy groceries due:tomorrow priority:high +shopping"
}
```

#### Projects API (`/api/projects`)

**Create Project**
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Complete overhaul of company website",
  "parentId": null,
  "status": "ACTIVE"
}
```

**Get Project Tasks**
```http
GET /api/projects/{id}/tasks?status=pending
```

#### Analytics API (`/api/analytics`)

**Task Statistics**
```http
GET /api/analytics/tasks/stats?period=week
```

**Productivity Report**
```http
GET /api/analytics/productivity?start=2024-01-01&end=2024-01-31
```

### Response Formats

#### Task Response
```json
{
  "id": "507f1f77bcf86cd799439011",
  "description": "Review pull request",
  "status": "PENDING",
  "priority": "HIGH",
  "urgency": 8.5,
  "project": {
    "id": "507f1f77bcf86cd799439012",
    "name": "synaptik"
  },
  "tags": ["code-review", "urgent"],
  "createdAt": "2024-01-15T09:00:00Z",
  "dueDate": "2024-01-15T17:00:00Z",
  "estimatedDuration": "PT2H"
}
```

#### Error Response
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Task description cannot be empty",
  "code": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🗄️ Data Models

### Task Entity
```java
@Entity
public class Task {
    @Id
    public ObjectId id;
    
    @NotBlank
    public String description;
    
    @Enumerated(EnumType.STRING)
    public TaskStatus status = TaskStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    public Priority priority = Priority.MEDIUM;
    
    public Double urgency;
    
    @DBRef
    public Project project;
    
    public Set<String> tags = new HashSet<>();
    
    public LocalDateTime createdAt;
    public LocalDateTime dueDate;
    public LocalDateTime completedAt;
    
    public Duration estimatedDuration;
    public Duration actualDuration;
    
    public List<TaskAnnotation> annotations = new ArrayList<>();
}
```

### Project Entity
```java
@Entity
public class Project {
    @Id
    public ObjectId id;
    
    @NotBlank
    public String name;
    
    public String description;
    
    @DBRef
    public Project parent;
    
    @Enumerated(EnumType.STRING)
    public ProjectStatus status = ProjectStatus.ACTIVE;
    
    public LocalDateTime createdAt;
    public LocalDateTime completedAt;
    
    public ProjectMetrics metrics;
}
```

### Mindmap Entity
```java
@Entity
public class Mindmap {
    @Id
    public ObjectId id;
    
    @NotBlank
    public String title;
    
    @DBRef
    public Project project;
    
    public MindmapNode rootNode;
    
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
```

## 🔧 Configuration Reference

### Backend Configuration (`application.properties`)

#### Core Settings
```properties
# Application
quarkus.application.name=synaptik-server
quarkus.application.version=1.0.0

# Server
quarkus.http.port=8080
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:5173

# Database
quarkus.mongodb.connection-string=mongodb://localhost:27017/synaptik
quarkus.mongodb.database=synaptik

# Security (when enabled)
mp.jwt.verify.publickey.location=META-INF/resources/publicKey.pem
quarkus.smallrye-jwt.enabled=false

# Logging
quarkus.log.level=INFO
quarkus.log.console.format=%d{HH:mm:ss} %-5p [%c{2.}] (%t) %s%e%n

# Health & Metrics
quarkus.smallrye-health.root-path=/health
quarkus.micrometer.enabled=true
```

#### Development Settings
```properties
# Development mode
%dev.quarkus.log.level=DEBUG
%dev.quarkus.http.cors.origins=*
%dev.quarkus.live-reload.instrumentation=true

# Disable analytics prompt
quarkus.analytics.disabled=true
```

#### Production Settings
```properties
# Production optimizations
%prod.quarkus.package.type=uber-jar
%prod.quarkus.log.level=INFO
%prod.quarkus.http.cors.origins=https://yourdomain.com
```

### Frontend Configuration

#### Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

#### Environment Variables
```bash
# Development
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=Synaptik
VITE_ENABLE_DEVTOOLS=true

# Production
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=Synaptik
VITE_ENABLE_DEVTOOLS=false
```

## 🧪 Testing Strategy

### Backend Testing
```java
@QuarkusTest
public class TaskServiceTest {
    
    @Test
    public void testCreateTask() {
        Task task = new Task();
        task.description = "Test task";
        task.priority = Priority.HIGH;
        
        Task created = taskService.createTask(task);
        
        assertThat(created.id).isNotNull();
        assertThat(created.urgency).isGreaterThan(0);
    }
}
```

### Frontend Testing
```typescript
describe('TaskCard', () => {
  it('displays task information correctly', () => {
    const task = {
      id: '1',
      description: 'Test task',
      priority: 'HIGH',
      status: 'PENDING'
    };
    
    render(<TaskCard task={task} />);
    
    expect(screen.getByText('Test task')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });
});
```

### Integration Testing
```bash
# API integration tests
cd server
./gradlew integrationTest

# End-to-end tests
cd client
npm run test:e2e
```

## 🚀 Deployment Strategies

### Docker Deployment
```yaml
# docker-compose.full.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    
  backend:
    build: ./server
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
      
  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: synaptik-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: synaptik-backend
  template:
    metadata:
      labels:
        app: synaptik-backend
    spec:
      containers:
      - name: backend
        image: synaptik/backend:latest
        ports:
        - containerPort: 8080
```

### Cloud Deployment Options

#### AWS Deployment
- **ECS**: Container orchestration
- **RDS**: Managed MongoDB alternative (DocumentDB)
- **CloudFront**: CDN for frontend
- **Application Load Balancer**: Traffic distribution

#### Google Cloud Deployment
- **Cloud Run**: Serverless containers
- **Cloud MongoDB**: Managed database
- **Cloud CDN**: Global content delivery

#### Azure Deployment
- **Container Instances**: Simple container hosting
- **Cosmos DB**: MongoDB-compatible database
- **Front Door**: Global load balancing

## 🔒 Security Considerations

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- API rate limiting
- CORS configuration

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Secure headers implementation

### Infrastructure Security
- HTTPS enforcement
- Security headers
- Database encryption at rest
- Network security groups

## 📊 Monitoring & Observability

### Application Metrics
- Task creation/completion rates
- Response time monitoring
- Error rate tracking
- User activity metrics

### Infrastructure Monitoring
- CPU and memory usage
- Database performance
- Network latency
- Disk space utilization

### Logging Strategy
- Structured logging with JSON format
- Centralized log aggregation
- Log retention policies
- Security event logging

## 🎯 Performance Optimization

### Backend Performance
- Connection pooling
- Query optimization
- Caching strategies
- Async/reactive programming

### Frontend Performance
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

### Database Performance
- Index optimization
- Query profiling
- Connection pooling
- Replica sets for scaling

## 🔮 Future Roadmap

### Short-term Goals (3-6 months)
- [ ] Real-time collaboration features
- [ ] Mobile responsive improvements
- [ ] Advanced search capabilities
- [ ] Bulk task operations

### Medium-term Goals (6-12 months)
- [ ] Native mobile apps
- [ ] Team management features
- [ ] Advanced analytics dashboard
- [ ] Third-party integrations

### Long-term Vision (1+ years)
- [ ] Enterprise features
- [ ] Multi-tenant architecture
- [ ] AI-powered insights
- [ ] Workflow automation engine

## 📚 Learning Resources

### TaskWarrior Concepts
- [TaskWarrior Best Practices](https://taskwarrior.org/docs/best-practices.html)
- [Understanding Urgency](https://taskwarrior.org/docs/urgency.html)
- [Task Management Philosophy](https://taskwarrior.org/docs/philosophy.html)

### Technical Documentation
- [Quarkus Guides](https://quarkus.io/guides/)
- [React Documentation](https://react.dev/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)

### Design Patterns
- [Reactive Programming](https://www.reactivemanifesto.org/)
- [REST API Design](https://restfulapi.net/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
