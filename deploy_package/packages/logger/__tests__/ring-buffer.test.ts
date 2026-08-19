/**
 * Ring Buffer Unit Tests
 *
 * Tests the core non-blocking guarantee:
 * 1. Buffer never blocks — enqueue is O(1) with no I/O
 * 2. Buffer drops debug logs under overload (not error/warn)
 * 3. Drain returns entries in FIFO order
 * 4. Metrics accurately track drops
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RingBuffer } from "../src/ring-buffer.js";

function makeEntry(severity: "debug" | "info" | "warn" | "error" | "fatal", msg = "") {
  return {
    severity,
    serialized: JSON.stringify({ level: severity, msg }),
    timestamp: Date.now(),
  };
}

describe("RingBuffer", () => {
  let buffer: RingBuffer;

  beforeEach(() => {
    buffer = new RingBuffer(4); // Small capacity for testing
  });

  it("accepts entries up to capacity", () => {
    expect(buffer.enqueue(makeEntry("info", "1"))).toBe(true);
    expect(buffer.enqueue(makeEntry("info", "2"))).toBe(true);
    expect(buffer.enqueue(makeEntry("info", "3"))).toBe(true);
    expect(buffer.enqueue(makeEntry("info", "4"))).toBe(true);
    expect(buffer.isFull).toBe(true);
    expect(buffer.metrics.currentSize).toBe(4);
    expect(buffer.metrics.dropped).toBe(0);
  });

  it("drops debug entries when full", () => {
    // Fill with debug entries
    for (let i = 0; i < 4; i++) {
      buffer.enqueue(makeEntry("debug", `debug ${i}`));
    }
    expect(buffer.isFull).toBe(true);

    // Another debug entry should be dropped
    const accepted = buffer.enqueue(makeEntry("debug", "overflow debug"));
    expect(accepted).toBe(false);
    expect(buffer.metrics.dropped).toBe(1);
    expect(buffer.metrics.droppedByLevel["debug"]).toBe(1);
  });

  it("evicts oldest debug entry to make room for ERROR when full", () => {
    // Fill with debug entries
    for (let i = 0; i < 4; i++) {
      buffer.enqueue(makeEntry("debug", `debug ${i}`));
    }
    expect(buffer.isFull).toBe(true);

    // An ERROR entry should evict the oldest debug entry and be accepted
    const errorEntry = makeEntry("error", "critical error");
    const accepted = buffer.enqueue(errorEntry);
    expect(accepted).toBe(true);
    expect(buffer.metrics.dropped).toBe(1); // one debug was evicted

    // Drain and verify the error entry is present
    const drained = buffer.drain(10);
    const msgs = drained.map((e) => JSON.parse(e.serialized).msg as string);
    expect(msgs).toContain("critical error");
  });

  it("drains entries in FIFO order", () => {
    buffer.enqueue(makeEntry("info", "first"));
    buffer.enqueue(makeEntry("info", "second"));
    buffer.enqueue(makeEntry("info", "third"));

    const drained = buffer.drain(10);
    const msgs = drained.map((e) => JSON.parse(e.serialized).msg as string);
    expect(msgs).toEqual(["first", "second", "third"]);
  });

  it("drain respects maxBatch limit", () => {
    for (let i = 0; i < 4; i++) {
      buffer.enqueue(makeEntry("info", `entry ${i}`));
    }
    const batch1 = buffer.drain(2);
    expect(batch1).toHaveLength(2);
    expect(buffer.metrics.currentSize).toBe(2);

    const batch2 = buffer.drain(2);
    expect(batch2).toHaveLength(2);
    expect(buffer.isEmpty).toBe(true);
  });

  it("is empty after all entries drained", () => {
    buffer.enqueue(makeEntry("info", "only"));
    buffer.drain(10);
    expect(buffer.isEmpty).toBe(true);
  });

  it("tracks enqueued count accurately", () => {
    buffer.enqueue(makeEntry("info", "a"));
    buffer.enqueue(makeEntry("info", "b"));
    expect(buffer.metrics.enqueued).toBe(2);
  });

  it("handles large overload without blocking (pure synchronous speed test)", () => {
    const smallBuffer = new RingBuffer(100);
    const start = performance.now();

    // Attempt to write 10,000 entries synchronously — simulates request burst
    for (let i = 0; i < 10_000; i++) {
      smallBuffer.enqueue(makeEntry("debug", `entry ${i}`));
    }

    const elapsed = performance.now() - start;

    // Must complete 10,000 enqueues in under 50ms (should be ~1-5ms in practice)
    expect(elapsed).toBeLessThan(50);

    // Buffer should be at capacity, most entries dropped
    expect(smallBuffer.isFull).toBe(true);
    expect(smallBuffer.metrics.dropped).toBeGreaterThan(9_000);
  });
});
