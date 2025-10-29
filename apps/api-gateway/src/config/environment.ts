export const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },

  // Microservices
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    tasks: process.env.TASKS_SERVICE_URL || 'http://localhost:3002',
    notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3003',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // RabbitMQ
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
    user: process.env.RABBITMQ_USER || 'admin',
    password: process.env.RABBITMQ_PASSWORD || 'admin123',
    queue: process.env.RABBITMQ_QUEUE || 'notifications',
  },
};
