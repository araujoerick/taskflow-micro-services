import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().default(3001),

  // Database
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().min(1, 'DB_USERNAME is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_DATABASE: z.string().min(1, 'DB_DATABASE is required'),

  // JWT (CRITICAL - no defaults for secrets)
  JWT_SECRET: z
    .string()
    .min(
      32,
      'JWT_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32',
    ),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(
      32,
      'JWT_REFRESH_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32',
    ),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables against the schema
 * @param config - Environment variables from process.env
 * @returns Validated and typed environment configuration
 * @throws Error if validation fails
 */
export function validateEnv(config: Record<string, unknown>): Env {
  try {
    return envSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${errorMessage}`);
    }
    throw error;
  }
}
