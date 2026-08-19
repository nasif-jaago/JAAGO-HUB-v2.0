import { Redis } from "ioredis";
import { createLogger, getLogger } from "@jaago/logger";
import { validateEnv, baseEnvSchema } from "@jaago/security";
import { QueueManager } from "@jaago/queue";
import { processEmailJob } from "./processors/email.processor.js";
import { processOutboxJob } from "./processors/outbox.processor.js";
import { processCleanupJob } from "./processors/cleanup.processor.js";

async function bootstrap() {
  // 1. Initialize Logger
  createLogger({
    serviceName: "jaago-worker",
    level: (process.env["LOG_LEVEL"] as "debug" | "info" | "warn" | "error") ?? "info",
    environment: process.env["NODE_ENV"] ?? "development",
  });

  const logger = getLogger();
  logger.info({}, "Bootstrapping JAAGO HUB Background Worker process...");

  // 2. Ensure development defaults are populated if not in environment
  process.env["DATABASE_URL"] = process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:54322/postgres";
  process.env["SUPABASE_URL"] = process.env["SUPABASE_URL"] || "https://rdmyghbciiepqmlwekjd.supabase.co";
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "dummy_service_role_key_for_dev_mode_testing_32chars";
  process.env["REDIS_URL"] = process.env["REDIS_URL"] || "redis://localhost:6379";
  process.env["ENCRYPTION_KEK"] = process.env["ENCRYPTION_KEK"] || "default_super_secret_encryption_key_32chars!";

  const env = validateEnv(baseEnvSchema);

  // 3. Initialize Redis connection
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });

  redis.on("error", (err: Error) => {
    logger.warn({ error: err.message }, "Redis connection warning (worker will retry)");
  });

  // 4. Initialize QueueManager and register worker processors
  const queueManager = new QueueManager(redis);

  queueManager.registerWorker("emails", processEmailJob, 10);
  queueManager.registerWorker("outbox", processOutboxJob, 5);
  queueManager.registerWorker("cleanup", processCleanupJob, 2);

  logger.info(
    { queues: ["emails", "outbox", "cleanup"] },
    "Background workers registered and listening for jobs.",
  );

  // 5. Graceful shutdown handler
  const shutdown = async (signal: string) => {
    logger.info({ signal }, `Received ${signal}, closing worker connections...`);
    try {
      await queueManager.closeAll();
      await redis.quit();
      await logger.shutdown();
      logger.info({}, "Worker process terminated cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("Error during worker shutdown:", err);
      process.exit(1);
    }
  };

  process.once("SIGTERM", () => { void shutdown("SIGTERM"); });
  process.once("SIGINT", () => { void shutdown("SIGINT"); });
}

bootstrap().catch((err: unknown) => {
  console.error("FATAL: Worker bootstrap failed:", err);
  process.exit(1);
});
