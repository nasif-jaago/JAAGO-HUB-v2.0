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

  // 2. Validate environment
  const env = validateEnv(baseEnvSchema);

  // 3. Initialize Redis connection
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
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
