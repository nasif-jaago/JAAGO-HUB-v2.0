import { Controller, Get, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";
import { Public } from "../common/decorators/require-permission.decorator.js";

export interface PingResponse {
  message: string;
  timestamp: string;
  correlationId: string;
  uptimeSeconds: number;
}

@ApiTags("System")
@Controller("api/v1")
export class DemoController {
  private readonly startTime = Date.now();

  @Public()
  @Get("ping")
  @ApiOperation({ summary: "Ping API service for liveness and latency checking" })
  @ApiHeader({ name: "X-Correlation-ID", required: false, description: "Client correlation ID" })
  @ApiResponse({ status: 200, description: "Service is online" })
  ping(@Req() req: { correlationId?: string; headers?: Record<string, string> }): PingResponse {
    const correlationId =
      req.correlationId || req.headers?.["x-correlation-id"] || "auto-generated";

    return {
      message: "JAAGO HUB API v2.0 is operational",
      timestamp: new Date().toISOString(),
      correlationId,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
