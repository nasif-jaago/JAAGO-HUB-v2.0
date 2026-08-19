import type { HealthProbe, HealthStatus, SystemHealthReport, ComponentHealth } from "./types.js";

export interface HealthRegistryOptions {
  version?: string;
  probeTimeoutMs?: number;
}

export class HealthRegistry {
  private readonly probes = new Map<string, HealthProbe>();
  private readonly version: string;
  private readonly probeTimeoutMs: number;
  private readonly startTime: number;

  constructor(options: HealthRegistryOptions = {}) {
    this.version = options.version ?? process.env["APP_VERSION"] ?? "2.0.0";
    this.probeTimeoutMs = options.probeTimeoutMs ?? 2000;
    this.startTime = Date.now();
  }

  registerProbe(probe: HealthProbe): void {
    this.probes.set(probe.name, probe);
  }

  removeProbe(name: string): void {
    this.probes.delete(name);
  }

  /**
   * Run all registered health probes concurrently with timeout protection.
   */
  async check(): Promise<SystemHealthReport> {
    const probeEntries = Array.from(this.probes.entries());
    const componentResults: Record<string, ComponentHealth> = {};

    const probePromises = probeEntries.map(async ([name, probe]) => {
      const start = Date.now();
      try {
        const timeoutPromise = new Promise<ComponentHealth>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Probe "${name}" timed out after ${this.probeTimeoutMs}ms`));
          }, this.probeTimeoutMs);
        });

        const result = await Promise.race([probe.check(), timeoutPromise]);
        componentResults[name] = result;
      } catch (err: unknown) {
        const latencyMs = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        componentResults[name] = {
          status: "unhealthy",
          latencyMs,
          message,
          timestamp: new Date().toISOString(),
        };
      }
    });

    await Promise.all(probePromises);

    // Compute overall status
    let overallStatus: HealthStatus = "healthy";
    for (const comp of Object.values(componentResults)) {
      if (comp.status === "unhealthy") {
        overallStatus = "unhealthy";
        break;
      }
      if (comp.status === "degraded") {
        overallStatus = "degraded";
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      components: componentResults,
    };
  }
}

/** Global default health registry singleton */
export const defaultHealthRegistry = new HealthRegistry();
