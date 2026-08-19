import { describe, it, expect } from "vitest";
import { Tracer } from "../src/tracing/tracer.js";

describe("Tracer", () => {
  it("generates unique correlation IDs", () => {
    const id1 = Tracer.generateCorrelationId();
    const id2 = Tracer.generateCorrelationId();
    expect(id1).toMatch(/^cor_/);
    expect(id2).toMatch(/^cor_/);
    expect(id1).not.toBe(id2);
  });

  it("extracts correlation ID from incoming headers", () => {
    const context = Tracer.extractContext({
      "x-correlation-id": "req-custom-12345",
    });
    expect(context.correlationId).toBe("req-custom-12345");
    expect(context.traceId).toBeDefined();
    expect(context.spanId).toBeDefined();
  });

  it("parses W3C traceparent header when present", () => {
    const traceparent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    const context = Tracer.extractContext({
      traceparent,
    });
    expect(context.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(context.parentSpanId).toBe("00f067aa0ba902b7");
    expect(context.spanId).toBeDefined();
  });

  it("formats valid traceparent header", () => {
    const context = {
      correlationId: "cor_1",
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7",
    };
    const header = Tracer.formatTraceParent(context);
    expect(header).toBe("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
  });
});
