import crypto from "node:crypto";

export interface TraceContext {
  correlationId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string | undefined;
}

/**
 * Trace Context Helper
 *
 * Provides correlation ID generation and correlation-to-trace context mapping
 * without hard dependency on an external tracing agent.
 */
export class Tracer {
  /**
   * Generate a unique, time-sortable correlation ID.
   */
  static generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(6).toString("hex");
    return `cor_${timestamp}_${random}`;
  }

  /**
   * Generate a 128-bit trace ID compatible with W3C Trace Context.
   */
  static generateTraceId(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Generate a 64-bit span ID compatible with W3C Trace Context.
   */
  static generateSpanId(): string {
    return crypto.randomBytes(8).toString("hex");
  }

  /**
   * Extract or create trace context from incoming request headers.
   */
  static extractContext(headers: Record<string, string | string[] | undefined>): TraceContext {
    const rawCorrelationId = headers["x-correlation-id"];
    const correlationId = Array.isArray(rawCorrelationId)
      ? rawCorrelationId[0] ?? this.generateCorrelationId()
      : rawCorrelationId || this.generateCorrelationId();

    const traceparent = headers["traceparent"];
    let traceId = this.generateTraceId();
    let parentSpanId: string | undefined;

    if (typeof traceparent === "string") {
      const parts = traceparent.split("-");
      if (parts.length >= 4 && parts[1] && parts[2]) {
        traceId = parts[1];
        parentSpanId = parts[2];
      }
    }

    return {
      correlationId,
      traceId,
      spanId: this.generateSpanId(),
      parentSpanId,
    };
  }

  /**
   * Format W3C traceparent header string.
   */
  static formatTraceParent(context: TraceContext): string {
    return `00-${context.traceId}-${context.spanId}-01`;
  }
}
