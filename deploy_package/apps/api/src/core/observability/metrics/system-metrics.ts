import process from "node:process";
import { loggerMetrics } from "@jaago/logger";

export interface SystemMetricsReport {
  timestamp: string;
  uptimeSeconds: number;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    externalMb: number;
  };
  cpu: {
    userMicroseconds: number;
    systemMicroseconds: number;
  };
  logger: ReturnType<typeof loggerMetrics.snapshot>;
}

export class SystemMetricsCollector {
  static collect(): SystemMetricsReport {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        externalMb: Math.round((memory.external / 1024 / 1024) * 100) / 100,
      },
      cpu: {
        userMicroseconds: cpu.user,
        systemMicroseconds: cpu.system,
      },
      logger: loggerMetrics.snapshot(),
    };
  }
}
