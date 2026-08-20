/**
 * Background Flusher
 *
 * Runs in a setInterval loop, draining the ring buffer in batches
 * and writing to the configured transport.
 *
 * KEY GUARANTEES:
 * 1. NEVER called on the request path — only from the background timer.
 * 2. Transport failures do NOT propagate to the application.
 *    Failed entries are dropped (already counted in metrics) — the ring buffer
 *    is the single source of backpressure.
 * 3. On shutdown (SIGTERM/SIGINT), one final synchronous drain is attempted
 *    with a bounded timeout so we don't stall the process.
 *
 * Flood control:
 * - If the same error code fires > FLOOD_THRESHOLD times in FLOOD_WINDOW_MS,
 *   subsequent identical entries are aggregated as "N more of ERR_X"
 *   rather than written individually. This protects transport throughput and readability.
 */

import type { RingBuffer, LogEntry } from "./ring-buffer.js";
import { applyRegexBackstop } from "./redaction.js";
import { loggerMetrics } from "./metrics.js";

export type TransportFn = (entries: string[]) => void | Promise<void>;

export interface FlusherOptions {
  /** Interval between flush cycles in milliseconds. Default: 50ms */
  flushIntervalMs?: number;
  /** Max entries per flush batch. Default: 256 */
  batchSize?: number;
  /** Max time to spend on final shutdown flush, ms. Default: 500 */
  shutdownTimeoutMs?: number;
  /** Flood control: suppress if same errorCode fires more than N times in the window */
  floodThreshold?: number;
  floodWindowMs?: number;
  /** Whether to apply regex backstop during flushing. Default: true */
  applyBackstop?: boolean;
}

interface FloodEntry {
  count: number;
  windowStart: number;
  suppressed: number;
}

export class BackgroundFlusher {
  private readonly buffer: RingBuffer;
  private readonly transport: TransportFn;
  private readonly options: Required<FlusherOptions>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly floodMap = new Map<string, FloodEntry>();

  constructor(buffer: RingBuffer, transport: TransportFn, options: FlusherOptions = {}) {
    this.buffer = buffer;
    this.transport = transport;
    this.options = {
      flushIntervalMs: options.flushIntervalMs ?? 50,
      batchSize: options.batchSize ?? 256,
      shutdownTimeoutMs: options.shutdownTimeoutMs ?? 500,
      floodThreshold: options.floodThreshold ?? 100,
      floodWindowMs: options.floodWindowMs ?? 60_000,
      applyBackstop: options.applyBackstop ?? true,
    };
  }

  start(): void {
    if (this.timer !== null) return; // already running
    this.timer = setInterval(() => {
      void this.flush();
    }, this.options.flushIntervalMs);
    // Unref so this timer doesn't prevent process exit
    if (this.timer.unref) this.timer.unref();
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Called on SIGTERM / SIGINT — attempt one last drain with a timeout */
  async shutdown(): Promise<void> {
    this.stop();

    const deadline = Date.now() + this.options.shutdownTimeoutMs;
    while (!this.buffer.isEmpty && Date.now() < deadline) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.isEmpty) return;

    const start = Date.now();
    const entries = this.buffer.drain(this.options.batchSize);
    if (entries.length === 0) return;

    // Update metrics from buffer state
    const bufferMetrics = this.buffer.metrics;
    loggerMetrics.updateBuffer(bufferMetrics.capacity, bufferMetrics.currentSize);

    // Sync metrics for drops that happened since last flush
    const dropped = bufferMetrics.dropped - loggerMetrics.logs_dropped_total;
    if (dropped > 0) {
      loggerMetrics.logs_dropped_total = bufferMetrics.dropped;
      loggerMetrics.logs_dropped_by_severity = { ...bufferMetrics.droppedByLevel };
    }

    const lines = this.processEntries(entries);
    if (lines.length === 0) return;

    try {
      await this.transport(lines);
      const latency = Date.now() - start;
      loggerMetrics.recordFlush(lines.length, latency, false);
    } catch {
      // Transport failure: DO NOT throw. The application must continue.
      // Entries are already gone from the buffer — this is acceptable data loss
      // for app/debug logs. Audit logs are NOT routed through this flusher.
      const latency = Date.now() - start;
      loggerMetrics.recordFlush(0, latency, true);
    }
  }

  private processEntries(entries: LogEntry[]): string[] {
    const lines: string[] = [];

    for (const entry of entries) {
      let serialized = entry.serialized;

      // Apply regex backstop (defense-in-depth redaction pass)
      if (this.options.applyBackstop) {
        serialized = applyRegexBackstop(serialized);
      }

      // Flood control — extract errorCode if present
      const floodKey = this.extractFloodKey(serialized);
      if (floodKey !== null) {
        const shouldSuppress = this.checkFlood(floodKey);
        if (shouldSuppress) continue;
      }

      lines.push(serialized);
    }

    // Emit flood-suppression summary lines
    for (const [key, flood] of this.floodMap.entries()) {
      if (flood.suppressed > 0) {
        const summaryLine = JSON.stringify({
          level: "warn",
          msg: `[FLOOD_CONTROL] ${flood.suppressed} more occurrences of error code "${key}" suppressed in the last ${this.options.floodWindowMs / 1000}s`,
          errorCode: key,
          suppressedCount: flood.suppressed,
          time: Date.now(),
        });
        lines.push(summaryLine);
        flood.suppressed = 0;
      }
    }

    return lines;
  }

  private extractFloodKey(serialized: string): string | null {
    // Fast heuristic: look for "errorCode":"ERR_..." pattern
    const match = /"errorCode"\s*:\s*"([^"]+)"/.exec(serialized);
    return match?.[1] ?? null;
  }

  private checkFlood(key: string): boolean {
    const now = Date.now();
    let entry = this.floodMap.get(key);

    if (!entry || now - entry.windowStart > this.options.floodWindowMs) {
      entry = { count: 1, windowStart: now, suppressed: 0 };
      this.floodMap.set(key, entry);
      return false;
    }

    entry.count++;
    if (entry.count > this.options.floodThreshold) {
      entry.suppressed++;
      return true; // suppress
    }
    return false;
  }
}
