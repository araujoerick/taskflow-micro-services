import {
  IsString,
  IsNumber,
  IsEnum,
  IsUrl,
  validateSync,
  IsOptional,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Environment variables validation schema
 * Ensures all required env vars are present and valid at startup
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @IsString()
  JWT_SECRET: string;

  @IsUrl({ require_tld: false })
  RABBITMQ_URL: string;

  @IsString()
  RABBITMQ_QUEUE: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;
}

/**
 * Validates environment variables at application startup
 * Throws error if validation fails, preventing app from starting with invalid config
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
