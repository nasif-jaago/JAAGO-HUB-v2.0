import { describe, it, expect, beforeEach } from "vitest";
import { DemoController } from "../src/demo/demo.controller.js";
import { HealthController } from "../src/health/health.controller.js";

describe("DemoController", () => {
  let demoController: DemoController;

  beforeEach(() => {
    demoController = new DemoController();
  });

  it("returns ping response with correlationId and operational message", () => {
    const res = demoController.ping({ correlationId: "test-corr-123" });

    expect(res.message).toBe("JAAGO HUB API v2.0 is operational");
    expect(res.correlationId).toBe("test-corr-123");
    expect(res.timestamp).toBeDefined();
    expect(res.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe("HealthController", () => {
  let healthController: HealthController;

  beforeEach(() => {
    healthController = new HealthController();
  });

  it("returns healthy system status report", async () => {
    const report = await healthController.check();

    expect(report.status).toBeDefined();
    expect(report.version).toBeDefined();
    expect(report.components).toBeDefined();
  });
});
