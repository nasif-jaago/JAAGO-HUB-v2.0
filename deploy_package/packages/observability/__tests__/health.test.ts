import { describe, it, expect } from "vitest";
import { HealthRegistry } from "../src/health/health-registry.js";
import { DatabaseProbe } from "../src/health/probes/database.probe.js";
import { RedisProbe } from "../src/health/probes/redis.probe.js";
import { QueueProbe } from "../src/health/probes/queue.probe.js";
import { StorageProbe } from "../src/health/probes/storage.probe.js";

describe("HealthRegistry & Probes", () => {
  it("reports healthy when all probes succeed", async () => {
    const registry = new HealthRegistry({ version: "2.0.0" });

    registry.registerProbe(new DatabaseProbe(async () => {}));
    registry.registerProbe(new RedisProbe(async () => "PONG"));
    registry.registerProbe(
      new QueueProbe(async () => ({ waiting: 5, active: 2, failed: 0 })),
    );
    registry.registerProbe(new StorageProbe(async () => true));

    const report = await registry.check();

    expect(report.status).toBe("healthy");
    expect(report.version).toBe("2.0.0");
    expect(report.components["database"]?.status).toBe("healthy");
    expect(report.components["redis"]?.status).toBe("healthy");
    expect(report.components["queue"]?.status).toBe("healthy");
    expect(report.components["storage"]?.status).toBe("healthy");
  });

  it("reports unhealthy when a probe fails", async () => {
    const registry = new HealthRegistry();

    registry.registerProbe(
      new DatabaseProbe(async () => {
        throw new Error("Connection refused: 5432");
      }),
    );
    registry.registerProbe(new RedisProbe(async () => "PONG"));

    const report = await registry.check();

    expect(report.status).toBe("unhealthy");
    expect(report.components["database"]?.status).toBe("unhealthy");
    expect(report.components["database"]?.message).toContain("Connection refused");
    expect(report.components["redis"]?.status).toBe("healthy");
  });

  it("reports degraded when queue is overloaded", async () => {
    const registry = new HealthRegistry();

    registry.registerProbe(
      new QueueProbe(async () => ({ waiting: 1500, active: 10, failed: 60 })),
    );

    const report = await registry.check();

    expect(report.status).toBe("degraded");
    expect(report.components["queue"]?.status).toBe("degraded");
    expect(report.components["queue"]?.details?.["waiting"]).toBe(1500);
  });

  it("guards against hanging probes with timeout", async () => {
    const registry = new HealthRegistry({ probeTimeoutMs: 50 });

    const hangingProbe = {
      name: "hanging-service",
      check: () => new Promise<never>(() => {}), // never resolves
    };

    registry.registerProbe(hangingProbe);

    const report = await registry.check();

    expect(report.status).toBe("unhealthy");
    expect(report.components["hanging-service"]?.status).toBe("unhealthy");
    expect(report.components["hanging-service"]?.message).toContain("timed out");
  });
});
