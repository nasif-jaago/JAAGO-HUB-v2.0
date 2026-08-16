import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { ApprovalsService } from "./approvals.service.js";
import type {
  ApprovalTaskDto,
  ApprovalDecisionDto,
  DelegateApprovalDto,
  ApprovalStatsDto,
} from "./dto/approvals.dto.js";

@ApiTags("Approvals Engine")
@ApiBearerAuth()
@Controller("api/v1/approvals")
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "List pending and historical approval tasks" })
  getApprovalTasks(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Query("status") status?: string,
    @Query("entityType") entityType?: string,
  ): ApprovalTaskDto[] {
    const orgId = this.resolveOrgId(req);
    return this.approvalsService.getApprovalTasks(orgId, { status, entityType });
  }

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get approval summary statistics" })
  getStats(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): ApprovalStatsDto {
    const orgId = this.resolveOrgId(req);
    return this.approvalsService.getStats(orgId);
  }

  @Public()
  @Post(":id/decision")
  @ApiOperation({ summary: "Submit decision (APPROVE, REJECT, REQUEST_CHANGES)" })
  makeDecision(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; user?: { id: string; displayName?: string }; headers?: Record<string, string> },
    @Body() dto: ApprovalDecisionDto,
  ): ApprovalTaskDto {
    const orgId = this.resolveOrgId(req);
    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000001",
      name: req.user?.displayName || "Nasif Kamal (SuperAdmin)",
    };

    return this.approvalsService.makeDecision(orgId, id, dto, actor);
  }

  @Public()
  @Post(":id/delegate")
  @ApiOperation({ summary: "Delegate approval authority to another user" })
  delegateTask(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; user?: { id: string; displayName?: string }; headers?: Record<string, string> },
    @Body() dto: DelegateApprovalDto,
  ): ApprovalTaskDto {
    const orgId = this.resolveOrgId(req);
    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000001",
      name: req.user?.displayName || "Nasif Kamal",
    };

    return this.approvalsService.delegateTask(orgId, id, dto, actor);
  }
}
