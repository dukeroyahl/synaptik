# Synaptik Java Server

This is the Java/Quarkus implementation of the Synaptik server, migrated from the original TypeScript/Node.js version.

## Features

- **Java 21** with Quarkus framework
- **Reactive programming** with Mutiny
- **MongoDB** with Panache for data access
- **REST API** with JAX-RS
- **Validation** with Bean Validation
- **OpenAPI** documentation
- **Health checks** and metrics
- **CORS** support for frontend integration

## Prerequisites

- Java 21 or higher
- MongoDB running on localhost:27017
- Gradle (wrapper included)

## Quick Start

1. **Start MongoDB**:
   ```bash
   brew services start mongodb-community
   ```

2. **Run in development mode**:
   ```bash
   ./gradlew quarkusDev
   ```

3. **Access the application**:
   - API: http://localhost:3001/api/tasks
   - Health: http://localhost:3001/health
   - OpenAPI: http://localhost:3001/q/swagger-ui

## Build and Run

### Development Mode
```bash
./gradlew quarkusDev
```

### Production Build
```bash
./gradlew build
java -jar build/quarkus-app/quarkus-run.jar
```

### Running Tests
```bash
./gradlew test
```

## API Endpoints

All endpoints are available under `/api/tasks`:

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/{id}` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/{id}/start` - Start task
- `POST /api/tasks/{id}/stop` - Stop task
- `POST /api/tasks/{id}/done` - Mark task as done
- `GET /api/tasks/pending` - Get pending tasks
- `GET /api/tasks/active` - Get active tasks
- `GET /api/tasks/completed` - Get completed tasks
- `GET /api/tasks/overdue` - Get overdue tasks
- `GET /api/tasks/today` - Get today's tasks

## Configuration

Environment variables can be set in `.env` file:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/synaptik

# JWT (future use)
JWT_SECRET=your-secret-key
JWT_ISSUER=synaptik

# Profile
QUARKUS_PROFILE=dev
```

## Migration from Node.js

This server is API-compatible with the original Node.js server. The following features have been migrated:

- ✅ Task CRUD operations
- ✅ Task status transitions (start/stop/done)
- ✅ Task urgency calculation
- ✅ Task filtering and querying
- ✅ MongoDB integration
- ✅ CORS configuration
- ✅ Health checks
- ✅ OpenAPI documentation

## Architecture

```
src/main/java/com/synaptik/
├── model/          # Entity classes (Task, TaskStatus, etc.)
├── repository/     # Data access layer
├── service/        # Business logic
├── resource/       # REST endpoints
├── dto/           # Data transfer objects
├── exception/     # Error handling
└── config/        # Configuration classes
```

## Performance

Quarkus provides:
- **Fast startup** (~1 second)
- **Low memory usage** (~50MB)
- **Reactive programming** with Mutiny
- **Native compilation** support (GraalVM)
- **Hot reload** in development mode

## Next Steps

1. Add JWT authentication
2. Implement task quick capture
3. Add project and mindmap endpoints
4. Set up native compilation
5. Add comprehensive test coverage