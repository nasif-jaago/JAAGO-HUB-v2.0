/**
 * Health Check & Probe Types
 */

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface ComponentHealth {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface SystemHealthReport {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptimeSeconds: number;
  components: Record<string, ComponentHealth>;
}

export interface HealthProbe {
  readonly name: string;
  /**
   * Run the health probe check.
   * MUST return ComponentHealth and never throw uncaught errors.
   * Implementations should be bounded by a timeout.
   */
  check(): Promise<ComponentHealth>;
}
