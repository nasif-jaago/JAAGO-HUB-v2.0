import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export interface DatabaseConfig {
  databaseUrl: string;
  maxConnections?: number;
  idleTimeout?: number;
}

export type DrizzleDb = ReturnType<typeof createDatabaseClient>;

export function createDatabaseClient(config: DatabaseConfig) {
  const queryClient = postgres(config.databaseUrl, {
    max: config.maxConnections ?? 10,
    idle_timeout: config.idleTimeout ?? 20,
    connect_timeout: 10,
  });

  return drizzle(queryClient, { schema });
}
