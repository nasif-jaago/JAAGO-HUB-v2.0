import { z, baseEnvSchema, validateEnv } from "@jaago/security";

export const apiEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  API_PREFIX: z.string().default("api"),
});

export type ApiConfig = z.infer<typeof apiEnvSchema>;

let configInstance: ApiConfig | null = null;

export function getApiConfig(): ApiConfig {
  if (!configInstance) {
    configInstance = validateEnv(apiEnvSchema);
  }
  return configInstance;
}
