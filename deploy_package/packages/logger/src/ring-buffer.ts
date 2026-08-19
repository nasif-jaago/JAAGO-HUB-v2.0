/**
 * Bounded Ring Buffer — the core of the non-blocking logger guarantee.
 *
 * Purpose: `logger.info()` writes into this buffer synchronously in microseconds.
 * It NEVER does I/O. The background flusher drains entries from this buffer
 * and sends them to the configured transport.
 *
 * When the buffer is full (transport overwhelmed or down):
 *   - DEBUG entries are DROPPED (counter incremented)
 *   - WARN/ERROR/FATAL entries are kept if there is any room (they push out DEBUG)
 *   - When absolutely full even after attempting DEBUG eviction, WARN/ERROR/FATAL are dropped
 *     and the overflow counter is incremented
 *
 * This ensures a log transport outage NEVER causes application latency or OOM.
 */

export type LogSeverityLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  severity: LogSeverityLevel;
  /** Pre-serialized JSON string — serialized synchronously before buffer write */
  serialized: string;
  /** Approximate timestamp of when the log was generated (not when flushed) */
  timestamp: number;
}

export interface RingBufferMetrics {
  enqueued: number;
  dropped: number;
  droppedByLevel: Record<LogSeverityLevel, number>;
  capacity: number;
  currentSize: number;
}

const SEVERITY_PRIORITY: Record<LogSeverityLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

export class RingBuffer {
  private readonly buffer: (LogEntry | undefined)[];
  private readonly capacity: number;
  private head = 0; // next write position
  private tail = 0; // next read position
  private size = 0;

  // ─── Self-metrics (never IO, just counters) ───────────────────────────────
  private _enqueued = 0;
  private _dropped = 0;
  private readonly _droppedByLevel: Record<LogSeverityLevel, number> = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0,
  };

  constructor(capacityEntries: number = 8192) {
    this.capacity = capacityEntries;
    // Pre-allocate the array for GC stability
    this.buffer = new Array<LogEntry | undefined>(capacityEntries).fill(undefined);
  }

  /**
   * Enqueue a log entry. Returns true if accepted, false if dropped.
   * This method MUST remain synchronous and O(1).
   */
  enqueue(entry: LogEntry): boolean {
    if (this.size < this.capacity) {
      this.buffer[this.head] = entry;
      this.head = (this.head + 1) % this.capacity;
      this.size++;
      this._enqueued++;
      return true;
    }

    // Buffer full — attempt eviction of oldest debug entry to make room for higher priority
    if (SEVERITY_PRIORITY[entry.severity] > SEVERITY_PRIORITY.debug) {
      // Find and evict the tail if it's a debug entry
      const tailEntry = this.buffer[this.tail];
      if (tailEntry && SEVERITY_PRIORITY[tailEntry.severity] === SEVERITY_PRIORITY.debug) {
        // Evict the debug entry from tail
        this._dropped++;
        this._droppedByLevel[tailEntry.severity]++;
        this.tail = (this.tail + 1) % this.capacity;
        this.size--;
        // Now write the new entry
        this.buffer[this.head] = entry;
        this.head = (this.head + 1) % this.capacity;
        this.size++;
        this._enqueued++;
        return true;
      }
    }

    // Buffer is full and cannot evict — drop this entry
    this._dropped++;
    this._droppedByLevel[entry.severity]++;
    return false;
  }

  /**
   * Drain up to `maxBatch` entries from the buffer.
   * Called by the background flusher — not on the request path.
   */
  drain(maxBatch: number = 256): LogEntry[] {
    const batch: LogEntry[] = [];
    while (this.size > 0 && batch.length < maxBatch) {
      const entry = this.buffer[this.tail];
      if (entry !== undefined) {
        batch.push(entry);
        this.buffer[this.tail] = undefined; // allow GC
      }
      this.tail = (this.tail + 1) % this.capacity;
      this.size--;
    }
    return batch;
  }

  get metrics(): RingBufferMetrics {
    return {
      enqueued: this._enqueued,
      dropped: this._dropped,
      droppedByLevel: { ...this._droppedByLevel },
      capacity: this.capacity,
      currentSize: this.size,
    };
  }

  get isEmpty(): boolean {
    return this.size === 0;
  }

  get isFull(): boolean {
    return this.size >= this.capacity;
  }

  /** Reset counters — used in tests */
  resetMetrics(): void {
    this._enqueued = 0;
    this._dropped = 0;
    for (const k of Object.keys(this._droppedByLevel) as LogSeverityLevel[]) {
      this._droppedByLevel[k] = 0;
    }
  }
}
