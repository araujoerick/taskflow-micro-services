# Task Management System - Fullstack Challenge

A modern, full-stack task management application built with a microservices architecture. The system provides real-time notifications, user authentication, and a responsive web interface.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Web)                            │
│                    React + TanStack Router + Tailwind               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API Gateway                                │
│              NestJS + JWT Auth + Rate Limiting + WebSocket          │
└─────────────────────────────────────────────────────────────────────┘
              │                     │                     │
              ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐
│  Auth Service   │   │  Tasks Service  │   │  Notifications Service  │
│   NestJS + JWT  │   │ NestJS + Events │   │  NestJS + RabbitMQ Sub  │
└─────────────────┘   └─────────────────┘   └─────────────────────────┘
         │                     │                        │
         ▼                     ▼                        ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐
│   PostgreSQL    │   │   PostgreSQL    │   │       PostgreSQL        │
│   (auth_db)     │   │   (tasks_db)    │   │   (notifications_db)    │
└─────────────────┘   └─────────────────┘   └─────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    RabbitMQ     │
                    │  Message Broker │
                    └─────────────────┘
```

## Tech Stack

### Frontend (Web)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Library |
| TypeScript | 5.9.x | Type Safety |
| TanStack Router | 1.x | File-based Routing |
| TanStack Query | 5.x | Data Fetching & Caching |
| Tailwind CSS | 4.x | Styling |
| Vite | 7.x | Build Tool |
| Radix UI | Latest | Accessible Components |
| React Hook Form | 7.x | Form Management |
| Zod | 3.x | Schema Validation |
| Socket.io Client | 4.x | Real-time Communication |
| Recharts | 3.x | Data Visualization |
| Lucide React | Latest | Icons |

### Backend (Microservices)
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.x | Backend Framework |
| TypeScript | 5.7.x | Type Safety |
| TypeORM | 0.3.x | ORM / Database |
| PostgreSQL | 16.x | Database |
| RabbitMQ | 3.13.x | Message Broker |
| Passport | 0.7.x | Authentication |
| JWT | 11.x | Token-based Auth |
| Class Validator | 0.14.x | DTO Validation |
| Socket.io | 4.8.x | WebSocket |
| Swagger | 8.x | API Documentation |
| Terminus | 11.x | Health Checks |
| Throttler | 6.x | Rate Limiting |

### Infrastructure & DevOps
| Technology | Purpose |
|------------|---------|
| Docker & Docker Compose | Containerization |
| Turborepo | Monorepo Management |
| npm Workspaces | Package Management |
| Jest | Testing Framework |
| Supertest | E2E HTTP Testing |
| ESLint | Code Linting |
| Prettier | Code Formatting |

## Project Structure

```
fullstack-challenge-junglegaming/
├── apps/
│   ├── api-gateway/          # API Gateway with proxy and WebSocket
│   ├── auth-service/         # Authentication microservice
│   ├── tasks-service/        # Task management microservice
│   ├── notifications-service/ # Notifications microservice
│   └── web/                  # React frontend application
├── packages/
│   ├── eslint-config/        # Shared ESLint configuration
│   ├── tsconfig/             # Shared TypeScript configuration
│   ├── types/                # Shared type definitions
│   └── utils/                # Shared utility functions
├── docker/
│   └── init-databases.sql    # Database initialization script
├── docker-compose.yml        # Infrastructure services
├── turbo.json               # Turborepo configuration
└── package.json             # Root package configuration
```

## Microservices

### API Gateway (Port 3000)
- **Role**: Entry point for all client requests
- **Features**:
  - HTTP request proxying to microservices
  - JWT authentication validation
  - Rate limiting (100 requests/minute)
  - WebSocket support for real-time notifications
  - CORS configuration
  - Swagger API documentation
  - Health checks for all services
  - Correlation ID tracking

### Auth Service (Port 3001)
- **Role**: User authentication and authorization
- **Features**:
  - User registration and login
  - JWT access and refresh tokens
  - Password hashing with bcrypt
  - Token blacklisting for logout
  - User profile management

### Tasks Service (Port 3002)
- **Role**: Task management operations
- **Features**:
  - CRUD operations for tasks
  - Task assignment to users
  - Comments on tasks
  - Task history tracking
  - Status and priority management
  - Event publishing to RabbitMQ

### Notifications Service (Port 3003)
- **Role**: User notification management
- **Features**:
  - Notification storage and retrieval
  - Mark as read functionality
  - RabbitMQ event consumption
  - Notification types (assigned, updated, commented)
  - Pagination and filtering

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 10.x
- Docker and Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fullstack-challenge-junglegaming
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```

4. **Configure environment variables**

   Copy `.env.example` to `.env` in each service directory and configure:

   ```bash
   # Database
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=postgres

   # JWT
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # RabbitMQ
   RABBITMQ_HOST=localhost
   RABBITMQ_PORT=5672
   RABBITMQ_USER=rabbitmq
   RABBITMQ_PASSWORD=rabbitmq
   ```

5. **Run database migrations**
   ```bash
   cd apps/auth-service && npm run migration:run
   cd ../tasks-service && npm run migration:run
   cd ../notifications-service && npm run migration:run
   ```

6. **Start all services**
   ```bash
   # From root directory
   npm run dev
   ```

   Or start individually:
   ```bash
   cd apps/auth-service && npm run dev
   cd apps/tasks-service && npm run dev
   cd apps/notifications-service && npm run dev
   cd apps/api-gateway && npm run start:dev
   cd apps/web && npm run dev
   ```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:5173 | Frontend application |
| API Gateway | http://localhost:3000 | API entry point |
| Swagger Docs | http://localhost:3000/api | API documentation |
| RabbitMQ Management | http://localhost:15672 | Message broker UI |

## API Documentation

### Authentication Endpoints
```
POST /auth/register    - Register new user
POST /auth/login       - User login
POST /auth/refresh     - Refresh access token
POST /auth/logout      - User logout
GET  /auth/validate    - Validate token
GET  /auth/me          - Get current user
```

### Tasks Endpoints
```
GET    /tasks          - List tasks (with filters)
POST   /tasks          - Create task
GET    /tasks/:id      - Get task details
PATCH  /tasks/:id      - Update task
DELETE /tasks/:id      - Delete task
GET    /tasks/:id/comments - Get task comments
POST   /tasks/:id/comments - Add comment
GET    /tasks/:id/history  - Get task history
```

### Notifications Endpoints
```
GET  /notifications              - List notifications
GET  /notifications/unread-count - Get unread count
GET  /notifications/:id          - Get notification
POST /notifications/mark-as-read - Mark as read
POST /notifications/mark-all-as-read - Mark all as read
DELETE /notifications/:id        - Delete notification
```

### Health Check
```
GET /health - Service health status
```

## Testing

### Run All Tests
```bash
# Unit tests
npm run test

# E2E tests (per service)
cd apps/auth-service && npm run test:e2e
cd apps/tasks-service && npm run test:e2e
cd apps/notifications-service && npm run test:e2e
cd apps/api-gateway && npm run test:e2e

# Coverage
npm run test:cov
```

### Test Coverage Requirements
- Minimum 80% coverage for branches, functions, lines, and statements

## Development

### Available Scripts

```bash
# Root level (Turborepo)
npm run dev      # Start all services in development mode
npm run build    # Build all services
npm run lint     # Lint all services
npm run format   # Format code with Prettier
npm run clean    # Clean build artifacts

# Per service
npm run test         # Run unit tests
npm run test:watch   # Watch mode
npm run test:cov     # Coverage report
npm run test:e2e     # E2E tests
npm run migration:run    # Run migrations
npm run migration:generate  # Generate migration
```

### Code Style
- ESLint for linting
- Prettier for formatting
- TypeScript strict mode enabled

## Features

### Task Management
- Create, edit, and delete tasks
- Assign tasks to team members
- Set priority levels (Low, Medium, High)
- Track status (TODO, In Progress, Done)
- Add comments to tasks
- View change history

### Real-time Notifications
- WebSocket-based notifications
- Task assignment alerts
- Comment notifications
- Status change updates
- Unread count badge

### User Authentication
- Secure JWT-based authentication
- Access and refresh token mechanism
- Password hashing with bcrypt
- Session management

### Responsive Design
- Mobile-first approach
- Adaptive navigation
- Touch-friendly interface

## Environment Variables

### Common Variables
| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Service port | varies |

### Database
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_HOST | PostgreSQL host | localhost |
| DATABASE_PORT | PostgreSQL port | 5432 |
| DATABASE_USERNAME | Database user | postgres |
| DATABASE_PASSWORD | Database password | postgres |
| DATABASE_NAME | Database name | varies |

### Authentication
| Variable | Description | Default |
|----------|-------------|---------|
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Access token TTL | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token TTL | 7d |

### RabbitMQ
| Variable | Description | Default |
|----------|-------------|---------|
| RABBITMQ_HOST | RabbitMQ host | localhost |
| RABBITMQ_PORT | RabbitMQ port | 5672 |
| RABBITMQ_USER | RabbitMQ user | rabbitmq |
| RABBITMQ_PASSWORD | RabbitMQ password | rabbitmq |
| RABBITMQ_QUEUE | Queue name | notifications |

### Rate Limiting
| Variable | Description | Default |
|----------|-------------|---------|
| THROTTLE_TTL | Time window (seconds) | 60 |
| THROTTLE_LIMIT | Max requests per window | 100 |

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### RabbitMQ Connection Issues
```bash
# Check RabbitMQ status
docker-compose logs rabbitmq

# Access management UI
open http://localhost:15672
# Login: rabbitmq / rabbitmq
```

### Port Conflicts
Ensure these ports are available:
- 3000 (API Gateway)
- 3001 (Auth Service)
- 3002 (Tasks Service)
- 3003 (Notifications Service)
- 5173 (Web Frontend)
- 5432 (PostgreSQL)
- 5672, 15672 (RabbitMQ)

## License

This project is licensed under the MIT License.
