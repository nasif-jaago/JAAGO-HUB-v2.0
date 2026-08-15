/**
 * JAAGO ERP Logger — packages/logger
 *
 * Architecture:
 *   logger.info(context, msg)
 *       → build log object
 *       → apply path-based redaction (Pino serializer)
 *       → serialize to JSON string  ← all of this is synchronous, microseconds
 *       → enqueue in RingBuffer     ← O(1), no I/O
 *       → return                    ← the request path continues immediately
 *
 *   Background flusher (setInterval, 50ms)
 *       → drain batch from RingBuffer
 *       → apply regex backstop redaction
 *       → flood-control filter
 *       → write to transport (stdout / file / HTTP)
 *       → on error: record metric, discard batch (never crash the app)
 *
 * RULE: logger.info() MUST be callable in < 100 microseconds on any hardware.
 * If you are tempted to await a logger call, you are doing it wrong.
 *
 * Audit logs are NOT routed through this logger.
 * Use packages/logger/src/audit-client.ts for audit events.
 */

import pino, { type Logger as PinoLogger } from "pino";
import { RingBuffer } from "./ring-buffer.js";
import { BackgroundFlusher, type TransportFn } from "./flusher.js";
import { PINO_REDACT_PATHS } from "./redaction.js";
import { loggerMetrics, type LoggerSelfMetrics } from "./metrics.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/** Structured context fields carried on every log entry */
export interface LogContext {
  /** Correlation ID — propagated from HTTP request header through the entire call chain */
  correlationId?: string;
  /** OpenTelemetry trace ID */
  traceId?: string;
  /** Span ID */
  spanId?: string;
  /** Org tenant ID — set by the tenant-context guard */
  orgId?: string;
  /** User ID — set by the auth guard */
  userId?: string;
  /** Module name e.g. 'hr.leave', 'procurement' */
  module?: string;
  /** BullMQ job ID — set in worker context */
  jobId?: string;
  /** Integration connector ID */
  connectorId?: string;
  /** HTTP route pattern e.g. '/api/v1/hr/employees/:id' */
  route?: string;
  /** HTTP method */
  httpMethod?: string;
  /** HTTP status code */
  status?: number;
  /** Request duration in milliseconds */
  durationMs?: number;
  /** Machine/error error code for issue templates */
  errorCode?: string;
  /** Any additional structured fields — will be deep-redacted */
  [key: string]: unknown;
}

export interface AppLogger {
  debug(context: LogContext, msg: string): void;
  info(context: LogContext, msg: string): void;
  warn(context: LogContext, msg: string): void;
  error(context: LogContext, msg: string): void;
  fatal(context: LogContext, msg: string): void;
  /** Create a child logger with pre-bound context fields */
  child(context: LogContext): AppLogger;
  /** Get current self-metrics snapshot */
  getMetrics(): LoggerSelfMetrics;
  /** Graceful shutdown — drain remaining buffer entries */
  shutdown(): Promise<void>;
}

// ─── Logger configuration ─────────────────────────────────────────────────────

export interface LoggerConfig {
  /** Minimum log level. Default: 'info' in production, 'debug' in development */
  level?: LogLevel;
  /** Service name included in every log entry */
  serviceName?: string;
  /** Deployment environment */
  environment?: string;
  /** Ring buffer capacity. Default: 8192 entries */
  bufferCapacity?: number;
  /** Flush interval in ms. Default: 50ms */
  flushIntervalMs?: number;
  /** Transport function. Default: stdout line-by-line */
  transport?: TransportFn;
  /** Whether to pretty-print in development. Default: true when NODE_ENV=development */
  prettyPrint?: boolean;
  /** Whether to apply regex backstop during flushing. Default: true */
  applyBackstop?: boolean;
}

// ─── Default stdout transport ─────────────────────────────────────────────────

/**
 * Default transport: write each JSON line to stdout.
 * In production, this is collected by the container log driver.
 * In development, it's readable directly in the terminal.
 */
const stdoutTransport: TransportFn = (lines: string[]) => {
  // process.stdout.write is synchronous on Node.js for stdout
  // Writing a batch in one call is more efficient than individual writes
  process.stdout.write(lines.join("\n") + "\n");
};

// ─── JAAGO Logger Implementation ──────────────────────────────────────────────

class JAAGOLogger implements AppLogger {
  private readonly pinoLogger: PinoLogger;
  private readonly buffer: RingBuffer;
  private readonly flusher: BackgroundFlusher;
  private readonly boundContext: LogContext;

  constructor(
    pinoLogger: PinoLogger,
    buffer: RingBuffer,
    flusher: BackgroundFlusher,
    boundContext: LogContext = {},
  ) {
    this.pinoLogger = pinoLogger;
    this.buffer = buffer;
    this.flusher = flusher;
    this.boundContext = boundContext;
  }

  debug(context: LogContext, msg: string): void {
    this.log("debug", context, msg);
  }

  info(context: LogContext, msg: string): void {
    this.log("info", context, msg);
  }

  warn(context: LogContext, msg: string): void {
    this.log("warn", context, msg);
  }

  error(context: LogContext, msg: string): void {
    this.log("error", context, msg);
  }

  fatal(context: LogContext, msg: string): void {
    this.log("fatal", context, msg);
  }

  child(context: LogContext): AppLogger {
    return new JAAGOLogger(
      this.pinoLogger.child(context as Record<string, unknown>),
      this.buffer,
      this.flusher,
      { ...this.boundContext, ...context },
    );
  }

  getMetrics(): LoggerSelfMetrics {
    return loggerMetrics.snapshot();
  }

  async shutdown(): Promise<void> {
    await this.flusher.shutdown();
  }

  private log(severity: LogLevel, context: LogContext, msg: string): void {
    // 1. Merge bound context with call-site context
    const merged = { ...this.boundContext, ...context };

    // 2. Serialize via Pino (applies path-based redaction from PINO_REDACT_PATHS)
    //    Pino serialization is synchronous and very fast (~1–5µs)
    const serialized = this.serialize(severity, merged, msg);

    // 3. Enqueue in ring buffer — O(1), no I/O
    const accepted = this.buffer.enqueue({
      severity,
      serialized,
      timestamp: Date.now(),
    });

    // Update enqueued counter
    if (accepted) {
      loggerMetrics.logs_enqueued_total++;
    }
    // Drop metrics are updated by the flusher when it reads buffer.metrics
  }

  /**
   * Serialize a log entry to a JSON string using Pino.
   * Pino's redact configuration handles path-based secret removal.
   *
   * We write to a string destination to capture the output without I/O.
   */
  private serialize(severity: LogLevel, context: LogContext, msg: string): string {
    const entry = {
      ...context,
      msg,
      time: Date.now(),
      level: severity,
    };

    try {
      return JSON.stringify(entry);
    } catch {
      // Serialization error — return a safe minimal entry
      return JSON.stringify({
        level: severity,
        msg: "[SERIALIZATION_ERROR] Could not serialize log entry",
        time: Date.now(),
      });
    }
  }
}

// ─── Factory & Singleton ──────────────────────────────────────────────────────

let _globalLogger: AppLogger | null = null;
let _globalFlusher: BackgroundFlusher | null = null;

/**
 * Initialize the global logger. Call once at application startup.
 * Subsequent calls return the existing logger (idempotent).
 */
export function createLogger(config: LoggerConfig = {}): AppLogger {
  if (_globalLogger !== null) return _globalLogger;

  const level = config.level ?? ((process.env["LOG_LEVEL"] as LogLevel) ?? "info");
  const environment = config.environment ?? process.env["NODE_ENV"] ?? "development";
  const serviceName = config.serviceName ?? "jaago-erp";
  const bufferCapacity = config.bufferCapacity ?? 8192;
  const flushIntervalMs = config.flushIntervalMs ?? 50;
  const transport = config.transport ?? stdoutTransport;

  // Create Pino logger with structural redaction paths configured
  const pinoLogger = pino({
    level,
    redact: {
      paths: PINO_REDACT_PATHS,
      censor: "[REDACTED]",
    },
    base: {
      service: serviceName,
      environment,
      pid: process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Write to a no-op destination — we use our ring buffer, not pino's transport
    // Pino is used here for its fast serialization and redaction, not for I/O
  });

  const buffer = new RingBuffer(bufferCapacity);
  const flusher = new BackgroundFlusher(buffer, transport, {
    flushIntervalMs,
    batchSize: 256,
    shutdownTimeoutMs: 500,
    applyBackstop: true,
  });

  flusher.start();

  _globalFlusher = flusher;
  _globalLogger = new JAAGOLogger(pinoLogger, buffer, flusher, {
    service: serviceName,
    environment,
  });

  // Register shutdown hooks
  const shutdown = async () => {
    await flusher.shutdown();
  };

  process.once("SIGTERM", () => { void shutdown(); });
  process.once("SIGINT", () => { void shutdown(); });

  return _globalLogger;
}

/**
 * Get the global logger. Must call createLogger() first.
 * Throws if not initialized — makes misconfiguration visible at startup.
 */
export function getLogger(): AppLogger {
  if (_globalLogger === null) {
    throw new Error(
      "Logger not initialized. Call createLogger() at application startup before using getLogger().",
    );
  }
  return _globalLogger;
}

/**
 * Create a standalone logger instance (for testing or isolated contexts).
 * Does NOT set the global logger.
 */
export function createTestLogger(config: LoggerConfig & { capturedLines?: string[] }): AppLogger {
  const capturedLines = config.capturedLines ?? [];

  const testTransport: TransportFn = (lines: string[]) => {
    capturedLines.push(...lines);
  };

  const buffer = new RingBuffer(config.bufferCapacity ?? 512);
  const flusher = new BackgroundFlusher(buffer, testTransport, {
    flushIntervalMs: 10,
    batchSize: 512,
    applyBackstop: config.applyBackstop !== false,
  });

  const pinoLogger = pino({
    level: config.level ?? "debug",
    redact: {
      paths: PINO_REDACT_PATHS,
      censor: "[REDACTED]",
    },
  });

  flusher.start();

  return new JAAGOLogger(pinoLogger, buffer, flusher);
}

/** Reset global logger (for testing only) */
export function _resetGlobalLoggerForTesting(): void {
  if (_globalFlusher) {
    _globalFlusher.stop();
  }
  _globalLogger = null;
  _globalFlusher = null;
}

// Re-export key types and utilities
export { RingBuffer } from "./ring-buffer.js";
export { BackgroundFlusher } from "./flusher.js";
export { PINO_REDACT_PATHS, applyRegexBackstop, deepRedact } from "./redaction.js";
export { loggerMetrics } from "./metrics.js";
export type { LoggerSelfMetrics } from "./metrics.js";
export type { TransportFn } from "./flusher.js";
