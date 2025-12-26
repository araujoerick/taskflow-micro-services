import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, IsUrl, Min, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '15m';

  // Microservices URLs
  @IsUrl({ require_tld: false })
  AUTH_SERVICE_URL: string = 'http://localhost:3001';

  @IsUrl({ require_tld: false })
  TASKS_SERVICE_URL: string = 'http://localhost:3002';

  @IsUrl({ require_tld: false })
  NOTIFICATIONS_SERVICE_URL: string = 'http://localhost:3003';

  // CORS
  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string = 'http://localhost:5173';

  // Rate Limiting
  @IsInt()
  @Min(1)
  THROTTLE_TTL: number = 60;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT: number = 100;

  // RabbitMQ
  @IsString()
  @IsNotEmpty()
  RABBITMQ_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  RABBITMQ_PORT: number = 5672;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_USER: string = 'admin';

  @IsString()
  @IsNotEmpty()
  RABBITMQ_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_QUEUE: string = 'notifications';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  return validatedConfig;
}
