import { z } from "zod";

export { z };

/**
 * Standard Environment Variable Schema for JAAGO API and Worker services.
 */
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required for database operations"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required for caching and queues"),
  ENCRYPTION_KEK: z.string().min(32, "ENCRYPTION_KEK must be at least 32 characters for AES-256"),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

/**
 * Validate environment variables against a Zod schema.
 * If validation fails, logs detailed error and throws / exits process to prevent booting in broken/insecure state.
 */
export function validateEnv<T extends z.ZodTypeAny>(
  schema: T,
  envObj: Record<string, unknown> = process.env,
): z.infer<T> {
  const result = schema.safeParse(envObj);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue: z.ZodIssue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    const message = `\n======================================================\nFATAL: Environment configuration validation failed!\nThe application cannot start safely.\n\nErrors:\n${errorDetails}\n======================================================\n`;
    
    // eslint-disable-next-line no-console
    console.error(message);
    throw new Error(`Environment validation failed: ${result.error.issues.map((i: z.ZodIssue) => i.path.join(".")).join(", ")}`);
  }

  return result.data;
}
