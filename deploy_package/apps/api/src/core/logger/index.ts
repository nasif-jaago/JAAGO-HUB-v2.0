/**
 * @jaago/logger — Public API
 *
 * The non-blocking logger for JAAGO ERP.
 *
 * Usage (in NestJS interceptors, application services, etc.):
 * ```typescript
 * import { getLogger } from '@jaago/logger';
 *
 * const logger = getLogger();
 * logger.info({ correlationId, orgId, module: 'hr.leave' }, 'Leave request submitted');
 * ```
 *
 * Initialization (once at app startup):
 * ```typescript
 * import { createLogger } from '@jaago/logger';
 * createLogger({ serviceName: 'api', level: 'info' });
 * ```
 *
 * NEVER await logger calls. NEVER use logger for audit events.
 */

// ─── Core logger ──────────────────────────────────────────────────────────────
export {
  createLogger,
  getLogger,
  createTestLogger,
  _resetGlobalLoggerForTesting,
} from "./logger.js";
export type { AppLogger, LogLevel, LogContext, LoggerConfig } from "./logger.js";

// ─── Ring buffer ──────────────────────────────────────────────────────────────
export { RingBuffer } from "./ring-buffer.js";
export type { LogEntry, LogSeverityLevel, RingBufferMetrics } from "./ring-buffer.js";

// ─── Background flusher ───────────────────────────────────────────────────────
export { BackgroundFlusher } from "./flusher.js";
export type { TransportFn, FlusherOptions } from "./flusher.js";

// ─── Redaction ────────────────────────────────────────────────────────────────
export {
  PINO_REDACT_PATHS,
  REDACTED_PLACEHOLDER,
  applyRegexBackstop,
  deepRedact,
} from "./redaction.js";

// ─── Metrics ──────────────────────────────────────────────────────────────────
export { loggerMetrics, LoggerMetrics } from "./metrics.js";
export type { LoggerSelfMetrics } from "./metrics.js";

// ─── Issue templates ──────────────────────────────────────────────────────────
export { getIssueTemplate, getAllTemplates } from "./issue-templates/index.js";
export type { IssueTemplate, IssueSeverity } from "./issue-templates/index.js";

// ─── Audit (stub until Phase 3) ───────────────────────────────────────────────
export { noOpAuditClient, NoOpAuditClient } from "./audit-client.js";
export type { AuditClient, AuditContext } from "./audit-client.js";
