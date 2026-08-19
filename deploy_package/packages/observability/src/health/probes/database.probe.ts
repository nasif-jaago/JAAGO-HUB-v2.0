import type { HealthProbe, ComponentHealth } from "../types.js";

export type DbPingFn = () => Promise<void | boolean>;

export class DatabaseProbe implements HealthProbe {
  readonly name = "database";
  private readonly pingFn: DbPingFn;

  constructor(pingFn: DbPingFn) {
    this.pingFn = pingFn;
  }

  async check(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.pingFn();
      const latencyMs = Date.now() - start;
      return {
        status: latencyMs > 1000 ? "degraded" : "healthy",
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "unhealthy",
        latencyMs,
        message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
