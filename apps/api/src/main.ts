import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { createLogger, getLogger } from "@jaago/logger";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  // 1. Initialize non-blocking central logger
  createLogger({
    serviceName: "jaago-api",
    level: (process.env["LOG_LEVEL"] as "debug" | "info" | "warn" | "error") ?? "info",
    environment: process.env["NODE_ENV"] ?? "development",
  });

  const logger = getLogger();
  logger.info({}, "Bootstrapping JAAGO HUB API server...");

  // 2. Create NestJS application on Fastify adapter
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // We use @jaago/logger instead of Fastify's default logger
      bodyLimit: 10 * 1024 * 1024, // 10MB
    }),
  );

  // 3. Enable CORS with explicit origin allowlist
  const corsOrigin = process.env["CORS_ORIGIN"] ?? "http://localhost:3000";
  app.enableCors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Correlation-ID",
      "X-Org-ID",
      "traceparent",
    ],
    exposedHeaders: ["X-Correlation-ID", "traceparent", "X-RateLimit-Remaining"],
  });

  // 4. OpenAPI / Swagger documentation setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle("JAAGO Foundation ERP — API")
    .setDescription("Mission-critical ERP platform backend for JAAGO Foundation")
    .setVersion("2.0.0")
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Enter your Supabase JWT access token",
    })
    .addTag("System", "System health and utility endpoints")
    .addTag("Health", "Observability and probe endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  // 5. Graceful shutdown hooks
  app.enableShutdownHooks();

  const port = Number(process.env["PORT"] ?? 3001);
  await app.listen(port, "0.0.0.0");

  logger.info(
    { port, docsUrl: `http://localhost:${port}/api/docs` },
    `JAAGO HUB API server running on http://localhost:${port}`,
  );
}

bootstrap().catch((err: unknown) => {
  console.error("FATAL: Failed to start API server:", err);
  process.exit(1);
});
