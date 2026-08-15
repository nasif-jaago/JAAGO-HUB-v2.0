import type { HealthProbe, ComponentHealth } from "../types.js";

export interface QueueStats {
  waiting: number;
  active: number;
  failed: number;
  isPaused?: boolean;
}

export type QueueStatsFn = () => Promise<QueueStats>;

export class QueueProbe implements HealthProbe {
  readonly name = "queue";
  private readonly statsFn: QueueStatsFn;

  constructor(statsFn: QueueStatsFn) {
    this.statsFn = statsFn;
  }

  async check(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const stats = await this.statsFn();
      const latencyMs = Date.now() - start;
      const isDegraded = stats.isPaused || stats.failed > 50 || stats.waiting > 1000;
      return {
        status: isDegraded ? "degraded" : "healthy",
        latencyMs,
        details: {
          waiting: stats.waiting,
          active: stats.active,
          failed: stats.failed,
          isPaused: stats.isPaused ?? false,
        },
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
