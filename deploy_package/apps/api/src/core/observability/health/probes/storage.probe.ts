import type { HealthProbe, ComponentHealth } from "../types.js";

export type StorageCheckFn = () => Promise<boolean>;

export class StorageProbe implements HealthProbe {
  readonly name = "storage";
  private readonly checkFn: StorageCheckFn;

  constructor(checkFn: StorageCheckFn) {
    this.checkFn = checkFn;
  }

  async check(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const ok = await this.checkFn();
      const latencyMs = Date.now() - start;
      return {
        status: ok ? (latencyMs > 1500 ? "degraded" : "healthy") : "unhealthy",
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
