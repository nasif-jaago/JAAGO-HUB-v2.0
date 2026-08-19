import { describe, it, expect } from "vitest";
import { SystemMetricsCollector } from "../src/metrics/system-metrics.js";

describe("SystemMetricsCollector", () => {
  it("collects memory and process telemetry", () => {
    const metrics = SystemMetricsCollector.collect();

    expect(metrics.timestamp).toBeDefined();
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(metrics.memory.heapUsedMb).toBeGreaterThan(0);
    expect(metrics.memory.heapTotalMb).toBeGreaterThan(0);
    expect(metrics.memory.rssMb).toBeGreaterThan(0);
    expect(metrics.cpu.userMicroseconds).toBeGreaterThanOrEqual(0);
    expect(metrics.logger).toBeDefined();
  });
});
