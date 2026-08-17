import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { defaultHealthRegistry, type SystemHealthReport } from "@jaago/observability";
import { Public } from "../common/decorators/require-permission.decorator.js";

@ApiTags("Health")
@Controller()
export class HealthController {
  @Public()
  @Get("health")
  @ApiOperation({ summary: "System health check with component probes" })
  @ApiResponse({ status: 200, description: "System is healthy or degraded" })
  @ApiResponse({ status: 503, description: "System is unhealthy" })
  async check(): Promise<SystemHealthReport> {
    return defaultHealthRegistry.check();
  }

  @Public()
  @Get("api/health")
  @ApiOperation({ summary: "API health probe" })
  async apiCheck(): Promise<SystemHealthReport> {
    return defaultHealthRegistry.check();
  }
}
