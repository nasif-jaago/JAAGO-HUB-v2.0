import type { HealthProbe, ComponentHealth } from "../types.js";

export type RedisPingFn = () => Promise<string | boolean>;

export class RedisProbe implements HealthProbe {
  readonly name = "redis";
  private readonly pingFn: RedisPingFn;

  constructor(pingFn: RedisPingFn) {
    this.pingFn = pingFn;
  }

  async check(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const result = await this.pingFn();
      const latencyMs = Date.now() - start;
      const ok = result === "PONG" || result === true;
      return {
        status: !ok ? "unhealthy" : latencyMs > 200 ? "degraded" : "healthy",
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
