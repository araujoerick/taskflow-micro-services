# TaskFlow - Task Management System

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

| Technology       | Version | Purpose                 |
| ---------------- | ------- | ----------------------- |
| React            | 19.x    | UI Library              |
| TypeScript       | 5.9.x   | Type Safety             |
| TanStack Router  | 1.x     | File-based Routing      |
| TanStack Query   | 5.x     | Data Fetching & Caching |
| Tailwind CSS     | 4.x     | Styling                 |
| Vite             | 7.x     | Build Tool              |
| Radix UI         | Latest  | Accessible Components   |
| React Hook Form  | 7.x     | Form Management         |
| Zod              | 3.x     | Schema Validation       |
| Socket.io Client | 4.x     | Real-time Communication |
| Recharts         | 3.x     | Data Visualization      |
| Lucide React     | Latest  | Icons                   |

### Backend (Microservices)

| Technology      | Version | Purpose           |
| --------------- | ------- | ----------------- |
| NestJS          | 11.x    | Backend Framework |
| TypeScript      | 5.7.x   | Type Safety       |
| TypeORM         | 0.3.x   | ORM / Database    |
| PostgreSQL      | 16.x    | Database          |
| RabbitMQ        | 3.13.x  | Message Broker    |
| Passport        | 0.7.x   | Authentication    |
| JWT             | 11.x    | Token-based Auth  |
| Class Validator | 0.14.x  | DTO Validation    |
| Socket.io       | 4.8.x   | WebSocket         |
| Swagger         | 8.x     | API Documentation |
| Terminus        | 11.x    | Health Checks     |
| Throttler       | 6.x     | Rate Limiting     |

### Infrastructure & DevOps

| Technology              | Purpose             |
| ----------------------- | ------------------- |
| Docker & Docker Compose | Containerization    |
| Turborepo               | Monorepo Management |
| npm Workspaces          | Package Management  |
| Jest                    | Testing Framework   |
| Supertest               | E2E HTTP Testing    |
| ESLint                  | Code Linting        |
| Prettier                | Code Formatting     |

## Project Structure

```
taskflow/
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
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI/CD pipeline
├── docker-compose.yml        # Development infrastructure
├── docker-compose.prod.yml   # Production infrastructure
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
   cd taskflow
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

| Service             | URL                       | Description          |
| ------------------- | ------------------------- | -------------------- |
| Web App             | http://localhost:5173     | Frontend application |
| API Gateway         | http://localhost:3000     | API entry point      |
| Swagger Docs        | http://localhost:3000/api | API documentation    |
| RabbitMQ Management | http://localhost:15672    | Message broker UI    |

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

| Variable | Description      | Default     |
| -------- | ---------------- | ----------- |
| NODE_ENV | Environment mode | development |
| PORT     | Service port     | varies      |

### Database

| Variable          | Description       | Default   |
| ----------------- | ----------------- | --------- |
| DATABASE_HOST     | PostgreSQL host   | localhost |
| DATABASE_PORT     | PostgreSQL port   | 5432      |
| DATABASE_USERNAME | Database user     | postgres  |
| DATABASE_PASSWORD | Database password | postgres  |
| DATABASE_NAME     | Database name     | varies    |

### Authentication

| Variable               | Description        | Default |
| ---------------------- | ------------------ | ------- |
| JWT_SECRET             | JWT signing secret | -       |
| JWT_EXPIRES_IN         | Access token TTL   | 15m     |
| JWT_REFRESH_EXPIRES_IN | Refresh token TTL  | 7d      |

### RabbitMQ

| Variable          | Description       | Default       |
| ----------------- | ----------------- | ------------- |
| RABBITMQ_HOST     | RabbitMQ host     | localhost     |
| RABBITMQ_PORT     | RabbitMQ port     | 5672          |
| RABBITMQ_USER     | RabbitMQ user     | rabbitmq      |
| RABBITMQ_PASSWORD | RabbitMQ password | rabbitmq      |
| RABBITMQ_QUEUE    | Queue name        | notifications |

### Rate Limiting

| Variable       | Description             | Default |
| -------------- | ----------------------- | ------- |
| THROTTLE_TTL   | Time window (seconds)   | 60      |
| THROTTLE_LIMIT | Max requests per window | 100     |

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

## Deployment

### Production Architecture

The production setup uses **Nginx Proxy Manager (NPM)** as a shared reverse proxy, allowing multiple projects to run on the same VPS.

```
                         INTERNET
                             │
                       ┌─────▼─────┐
                       │    VPS    │
                       │           │
                       └─────┬─────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx Proxy    │
                    │    Manager      │
                    │  :80 :443 :81   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │ TaskFlow  │      │   n8n     │      │  Future   │
    │   API     │      │  (5678)   │      │  Project  │
    │  Gateway  │      └───────────┘      └───────────┘
    │  (:3000)  │
    └─────┬─────┘
          │
    ┌─────┴─────────────────────────────┐
    │         taskflow-backend          │
    ├───────────┬───────────┬───────────┤
    │   Auth    │   Tasks   │  Notif.   │
    │  (:3001)  │  (:3002)  │  (:3003)  │
    └─────┬─────┴─────┬─────┴─────┬─────┘
          │           │           │
    ┌─────▼───────────▼───────────▼─────┐
    │    PostgreSQL + RabbitMQ          │
    │         (internal)                │
    └────────────────────────────────────┘
```

**Subdomains (with SSL via NPM):**

- `api.yourdomain.com` → API Gateway (:3000)
- `rabbit.yourdomain.com` → RabbitMQ UI (:15672) [optional]

### CI/CD Pipeline

The GitHub Actions workflow runs on PRs to `main` and pushes to `main`:

1. **Lint** - ESLint validation
2. **Unit Tests** - Jest unit tests for all services
3. **E2E Tests** - Integration tests with PostgreSQL and RabbitMQ
4. **Build** - Compile all services

### VPS Folder Structure

```
~/projects/
├── nginx-proxy-manager/     # Shared proxy (start first)
│   └── docker-compose.yml
├── taskflow/                # This project
│   ├── docker-compose.prod.yml
│   └── .env
└── automation/              # n8n (future)
    └── docker-compose.yml
```

### Deploy to VPS

1. **Setup VPS** (Ubuntu 22.04/24.04)

   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Create folder structure
   mkdir -p ~/projects/{nginx-proxy-manager,taskflow}
   ```

2. **Start Nginx Proxy Manager FIRST**

   ```bash
   cd ~/projects/nginx-proxy-manager

   # Create docker-compose.yml
   cat > docker-compose.yml << 'EOF'
   version: '3.8'
   services:
     npm:
       image: 'jc21/nginx-proxy-manager:latest'
       container_name: nginx-proxy-manager
       restart: unless-stopped
       ports:
         - '80:80'
         - '443:443'
         - '81:81'
       volumes:
         - ./data:/data
         - ./letsencrypt:/etc/letsencrypt
       networks:
         - proxy-network
   networks:
     proxy-network:
       driver: bridge
       name: proxy-network
   EOF

   docker compose up -d
   # Access UI: http://YOUR_IP:81
   # Default login: admin@example.com / changeme
   ```

3. **Clone and configure TaskFlow**

   ```bash
   cd ~/projects/taskflow
   git clone <repository-url> .
   cp .env.production.example .env
   nano .env  # Configure production values
   ```

4. **Deploy TaskFlow**

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

5. **Configure Proxy in NPM UI**
   - Access `http://YOUR_IP:81`
   - Add Proxy Host:
     - Domain: `api.yourdomain.com`
     - Forward Hostname: `taskflow-api-gateway`
     - Forward Port: `3000`
     - ✅ Websockets Support
     - ✅ Block Common Exploits
     - SSL: Request Let's Encrypt certificate

### Deploy Frontend to Vercel

1. Connect GitHub repository to Vercel
2. Configure:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Vite
   - **Environment Variable**: `VITE_API_URL=https://api.yourdomain.com`

## License

This project is licensed under the MIT License.
