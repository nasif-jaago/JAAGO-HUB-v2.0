import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { AuditService } from "./audit.service.js";
import type {
  AuditLogDto,
  CreateAuditEntryDto,
  VerifyChainResponseDto,
} from "./dto/audit.dto.js";

@ApiTags("Audit Trail & Compliance")
@ApiBearerAuth()
@Controller("api/v1/audit")
export class AuditController {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  @Public()
  @Get("logs")
  @ApiOperation({ summary: "Query tamper-evident audit logs with bounded pagination" })
  getLogs(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("actorId") actorId?: string,
    @Query("limit") limit?: number,
  ): AuditLogDto[] {
    const orgId = this.resolveOrgId(req);
    return this.auditService.getLogs(orgId, { entityType, entityId, actorId, limit });
  }

  @Public()
  @Get("verify-chain")
  @ApiOperation({ summary: "Verify cryptographic integrity of the tenant audit hash-chain" })
  verifyChain(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
  ): VerifyChainResponseDto {
    const orgId = this.resolveOrgId(req);
    return this.auditService.verifyChain(orgId);
  }

  @Public()
  @Post("logs")
  @ApiOperation({ summary: "Seal a new record into the tenant audit hash-chain" })
  recordEntry(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string>; ip?: string },
    @Body() dto: CreateAuditEntryDto,
  ): AuditLogDto {
    const orgId = this.resolveOrgId(req);
    const ipAddress = req.ip || req.headers?.["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers?.["user-agent"] || "System API";

    return this.auditService.recordEntry(orgId, dto, { ipAddress, userAgent });
  }
}
