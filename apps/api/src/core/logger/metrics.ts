/**
 * Logger Self-Metrics
 *
 * The logger tracks its own health via these counters so the observability layer
 * can alert when logging is degraded (buffer full, transport down, etc.).
 *
 * These are in-process counters only — they are exported to OpenTelemetry metrics
 * by packages/observability when that package initializes.
 *
 * Counter descriptions match Prometheus naming conventions.
 */

export interface LoggerSelfMetrics {
  /** Total log entries dropped due to buffer overflow (split by severity) */
  logs_dropped_total: number;
  logs_dropped_by_severity: Record<string, number>;

  /** Total log entries successfully enqueued */
  logs_enqueued_total: number;

  /** Total flush operations performed by the background flusher */
  flushes_total: number;

  /** Total entries flushed to the transport */
  entries_flushed_total: number;

  /** Number of flush failures (transport error) */
  flush_failures_total: number;

  /** Current buffer fill level (0–1) */
  buffer_fill_ratio: number;

  /** Last flush latency in milliseconds */
  last_flush_latency_ms: number;

  /** Peak flush latency observed */
  peak_flush_latency_ms: number;
}

export class LoggerMetrics {
  logs_dropped_total = 0;
  logs_dropped_by_severity: Record<string, number> = {};
  logs_enqueued_total = 0;
  flushes_total = 0;
  entries_flushed_total = 0;
  flush_failures_total = 0;
  last_flush_latency_ms = 0;
  peak_flush_latency_ms = 0;
  private _bufferCapacity = 0;
  private _bufferCurrentSize = 0;

  updateBuffer(capacity: number, size: number): void {
    this._bufferCapacity = capacity;
    this._bufferCurrentSize = size;
  }

  recordDrop(severity: string, count: number): void {
    this.logs_dropped_total += count;
    this.logs_dropped_by_severity[severity] =
      (this.logs_dropped_by_severity[severity] ?? 0) + count;
  }

  recordFlush(entriesCount: number, latencyMs: number, failed: boolean): void {
    this.flushes_total++;
    if (failed) {
      this.flush_failures_total++;
    } else {
      this.entries_flushed_total += entriesCount;
    }
    this.last_flush_latency_ms = latencyMs;
    if (latencyMs > this.peak_flush_latency_ms) {
      this.peak_flush_latency_ms = latencyMs;
    }
  }

  snapshot(): LoggerSelfMetrics {
    return {
      logs_dropped_total: this.logs_dropped_total,
      logs_dropped_by_severity: { ...this.logs_dropped_by_severity },
      logs_enqueued_total: this.logs_enqueued_total,
      flushes_total: this.flushes_total,
      entries_flushed_total: this.entries_flushed_total,
      flush_failures_total: this.flush_failures_total,
      buffer_fill_ratio:
        this._bufferCapacity > 0 ? this._bufferCurrentSize / this._bufferCapacity : 0,
      last_flush_latency_ms: this.last_flush_latency_ms,
      peak_flush_latency_ms: this.peak_flush_latency_ms,
    };
  }
}

/** Singleton metrics instance — shared across logger and flusher */
export const loggerMetrics = new LoggerMetrics();
