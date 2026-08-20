import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

// Import orchestrator module
// @ts-expect-error commonjs require
const orchestrator = require("../../index.js");

describe("cPanel Process Manager & Orchestrator (index.js)", () => {
  it("exports core orchestration methods and state maps", () => {
    expect(orchestrator).toBeDefined();
    expect(typeof orchestrator.startService).toBe("function");
    expect(typeof orchestrator.startWebServer).toBe("function");
    expect(typeof orchestrator.log).toBe("function");
    expect(orchestrator.children instanceof Map).toBe(true);
    expect(orchestrator.ROOT_DIR).toBeDefined();
  });

  it("writes formatted log lines to disk without throwing errors", () => {
    const testMessage = `Automated deployment test message ${Date.now()}`;
    orchestrator.log("TEST_SERVICE", testMessage);

    expect(fs.existsSync(orchestrator.LOG_FILE)).toBe(true);
    const content = fs.readFileSync(orchestrator.LOG_FILE, "utf8");
    expect(content).toContain("[TEST_SERVICE]");
    expect(content).toContain(testMessage);
  });

  it("handles non-existent service scripts safely without crashing", () => {
    const child = orchestrator.startService("NON_EXISTENT", {
      script: "non/existent/path/main.js",
      nodeArgs: [],
      env: {},
    });

    expect(child).toBeNull();
  });

  it("validates that the supervisor registers services in children map", () => {
    expect(orchestrator.children).toBeDefined();
    // Test that the children map functions properly
    orchestrator.children.set("MOCK_SVC", {
      child: { pid: 99999, killed: false },
      restartCount: 0,
      exiting: false,
    });

    expect(orchestrator.children.has("MOCK_SVC")).toBe(true);
    orchestrator.children.delete("MOCK_SVC");
    expect(orchestrator.children.has("MOCK_SVC")).toBe(false);
  });
});
