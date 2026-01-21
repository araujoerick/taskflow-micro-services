# Notifications Service

Microservice responsible for managing user notifications in the Task Flow task management system.

## Features

- **RabbitMQ Consumer**: Listens to task events from the `task-events` queue
- **Notification Management**: Creates notifications based on task activities
- **REST API**: Endpoints for listing, reading, and marking notifications
- **JWT Authentication**: Secured endpoints with JWT token validation
- **PostgreSQL**: Persistent storage for notifications
- **TypeORM**: Database migrations and entity management

## Notification Types

The service handles four types of notifications:

1. **TASK_CREATED**: When a new task is created
2. **TASK_UPDATED**: When a task is updated
3. **TASK_ASSIGNED**: When a task is assigned to a user
4. **TASK_COMMENTED**: When a comment is added to a task

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Get User Notifications

```http
GET /notifications?page=1&limit=20&type=TASK_ASSIGNED&read=false
```

Query parameters:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by notification type
- `read` (optional): Filter by read status (true/false)

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "TASK_ASSIGNED",
      "message": "You have been assigned to task \"Implement Feature X\"",
      "taskId": "uuid",
      "metadata": {
        "taskTitle": "Implement Feature X",
        "taskStatus": "TODO",
        "assignedBy": "uuid"
      },
      "read": false,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Get Unread Count

```http
GET /notifications/unread-count
```

Response:

```json
{
  "count": 5
}
```

### Get Single Notification

```http
GET /notifications/:id
```

### Mark Notifications as Read

```http
POST /notifications/mark-as-read
Content-Type: application/json

{
  "notificationIds": ["uuid1", "uuid2"]
}
```

Response:

```json
{
  "message": "2 notification(s) marked as read",
  "affected": 2
}
```

### Mark All as Read

```http
POST /notifications/mark-all-as-read
```

Response:

```json
{
  "message": "5 notification(s) marked as read",
  "affected": 5
}
```

## Event Handling

The service consumes events from RabbitMQ and creates appropriate notifications:

### Task Created Event

```json
{
  "event": "task.created",
  "taskId": "uuid",
  "userId": "creator-id",
  "data": {
    "title": "Task Title",
    "status": "TODO",
    "priority": "HIGH"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Task Updated Event

```json
{
  "event": "task.updated",
  "taskId": "uuid",
  "userId": "updater-id",
  "data": {
    "title": "Task Title",
    "changes": { "status": "IN_PROGRESS" },
    "assignedToId": "uuid",
    "createdById": "uuid"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Task Assigned Event

```json
{
  "event": "task.assigned",
  "taskId": "uuid",
  "userId": "assigner-id",
  "data": {
    "title": "Task Title",
    "assignedToId": "assignee-id",
    "status": "TODO",
    "priority": "MEDIUM"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Task Commented Event

```json
{
  "event": "task.commented",
  "taskId": "uuid",
  "userId": "commenter-id",
  "data": {
    "title": "Task Title",
    "commentId": "uuid",
    "assignedToId": "uuid",
    "createdById": "uuid"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3003

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notifications_service

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# RabbitMQ
RABBITMQ_URL=amqp://rabbitmq:rabbitmq@localhost:5673
RABBITMQ_QUEUE=task-events
```

## Installation

```bash
npm install
```

## Database Setup

1. Ensure PostgreSQL is running with the `notifications_service` database
2. Run migrations:

```bash
npm run migration:run
```

## Running the Service

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm run start:prod
```

## Database Migrations

### Create a new migration

```bash
npm run migration:generate src/migrations/MigrationName
```

### Run migrations

```bash
npm run migration:run
```

### Revert last migration

```bash
npm run migration:revert
```

## Architecture

```
src/
├── auth/                    # JWT authentication
│   ├── decorators/         # Custom decorators (@CurrentUser)
│   ├── guards/             # Auth guards (JwtAuthGuard)
│   ├── strategies/         # Passport strategies (JWT)
│   └── interfaces/         # Type definitions
├── config/                  # Configuration files
│   └── typeorm.config.ts   # TypeORM data source
├── migrations/              # Database migrations
├── notifications/           # Notifications module
│   ├── dto/                # Data transfer objects
│   ├── entities/           # TypeORM entities
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── notifications.module.ts
├── rabbitmq/                # RabbitMQ integration
│   ├── rabbitmq.service.ts # Consumer implementation
│   └── rabbitmq.module.ts
├── app.module.ts
└── main.ts
```

## Key Design Decisions

1. **Consumer Architecture**: Uses RabbitMQ's `prefetch(1)` to ensure fair message distribution
2. **Error Handling**: Failed messages are nack'd and requeued for retry
3. **Notification Logic**:
   - Only notifies relevant users (assignees, creators)
   - Prevents self-notifications
   - Includes rich metadata for UI rendering
4. **Indexing Strategy**: Optimized indexes for common queries (userId + read, userId + createdAt)
5. **Pagination**: Configurable page size with sensible defaults

## Development

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Logging

The service uses NestJS Logger for structured logging:

- **INFO**: Successful operations (notification created, marked as read)
- **WARN**: Event processing warnings
- **ERROR**: RabbitMQ connection errors, processing failures

Example logs:

```
[Bootstrap] Notifications service running on port 3003
[RabbitMQService] Connected to RabbitMQ
[RabbitMQService] Processing event: task.assigned
[NotificationsService] Created notification for user abc-123
```

## Health Check

The service provides a basic health check endpoint:

```http
GET /
```

Response:

```json
{
  "message": "Notifications service is running"
}
```

## Dependencies

- **NestJS**: Framework for building scalable server-side applications
- **TypeORM**: ORM for TypeScript/JavaScript
- **PostgreSQL**: Relational database
- **RabbitMQ (amqplib)**: Message queue client
- **Passport JWT**: JWT authentication strategy
- **class-validator**: DTO validation
- **class-transformer**: Object transformation

## Related Services

- **auth-service** (port 3001): Handles authentication and user management
- **tasks-service** (port 3002): Publishes task events to RabbitMQ
- **api-gateway** (future): Single entry point for all services

## Troubleshooting

### RabbitMQ Connection Issues

- Verify RabbitMQ is running: `docker-compose ps`
- Check credentials match environment variables
- Ensure queue exists in RabbitMQ management UI (http://localhost:15673)

### Database Connection Issues

- Verify PostgreSQL is running
- Check database exists: `psql -U postgres -l`
- Run migrations if tables are missing

### No Notifications Being Created

- Check tasks-service is publishing events
- Monitor RabbitMQ queue depth in management UI
- Check logs for consumer errors: `npm run dev`

## License

UNLICENSED
