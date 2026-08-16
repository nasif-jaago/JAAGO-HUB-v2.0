import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { AdminService } from "./admin.service.js";
import type {
  RoleDto,
  CreateRoleDto,
  UpdateRoleDto,
  PermissionDto,
  SmtpConfigDto,
  TestEmailDto,
  CreateApiTokenDto,
  ApiTokenResponseDto,
} from "./dto/admin.dto.js";

@ApiTags("Admin Settings & RBAC")
@ApiBearerAuth()
@Controller("api/v1/admin")
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  // ─── RBAC Roles & Permissions ──────────────────────────────────────────────

  @Public()
  @Get("rbac/permissions")
  @ApiOperation({ summary: "Get catalog of all system permissions" })
  getPermissions(): PermissionDto[] {
    return this.adminService.getPermissions();
  }

  @Public()
  @Get("rbac/roles")
  @ApiOperation({ summary: "List all tenant roles with attached permissions" })
  getRoles(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): RoleDto[] {
    const orgId = this.resolveOrgId(req);
    return this.adminService.getRoles(orgId);
  }

  @Public()
  @Post("rbac/roles")
  @ApiOperation({ summary: "Create a new custom RBAC role" })
  createRole(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: CreateRoleDto,
  ): RoleDto {
    const orgId = this.resolveOrgId(req);
    return this.adminService.createRole(orgId, dto);
  }

  @Public()
  @Put("rbac/roles/:id")
  @ApiOperation({ summary: "Update role name, description, or permission assignments" })
  updateRole(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
  ): RoleDto {
    const orgId = this.resolveOrgId(req);
    return this.adminService.updateRole(orgId, id, dto);
  }

  @Public()
  @Delete("rbac/roles/:id")
  @ApiOperation({ summary: "Delete a custom RBAC role" })
  deleteRole(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
  ): { success: boolean } {
    const orgId = this.resolveOrgId(req);
    return this.adminService.deleteRole(orgId, id);
  }

  // ─── Email Server (SMTP) Settings ──────────────────────────────────────────

  @Public()
  @Get("settings/email")
  @ApiOperation({ summary: "Get organization SMTP email server settings" })
  getSmtpConfig(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): SmtpConfigDto {
    const orgId = this.resolveOrgId(req);
    return this.adminService.getSmtpConfig(orgId);
  }

  @Public()
  @Put("settings/email")
  @ApiOperation({ summary: "Update organization SMTP email server configuration" })
  updateSmtpConfig(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: SmtpConfigDto,
  ): SmtpConfigDto {
    const orgId = this.resolveOrgId(req);
    return this.adminService.updateSmtpConfig(orgId, dto);
  }

  @Public()
  @Post("settings/email/test")
  @ApiOperation({ summary: "Dispatch test email using active SMTP configuration" })
  sendTestEmail(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: TestEmailDto,
  ): Promise<{ success: boolean; message: string }> {
    const orgId = this.resolveOrgId(req);
    return this.adminService.sendTestEmail(orgId, dto.recipientEmail);
  }

  // ─── API Tokens & Secret Keys ──────────────────────────────────────────────

  @Public()
  @Get("settings/api-tokens")
  @ApiOperation({ summary: "List active API tokens and permission scopes" })
  getApiTokens(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): ApiTokenResponseDto[] {
    const orgId = this.resolveOrgId(req);
    return this.adminService.getApiTokens(orgId);
  }

  @Public()
  @Post("settings/api-tokens")
  @ApiOperation({ summary: "Generate a new cryptographic API token" })
  createApiToken(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: CreateApiTokenDto,
  ): ApiTokenResponseDto {
    const orgId = this.resolveOrgId(req);
    return this.adminService.createApiToken(orgId, dto);
  }

  @Public()
  @Delete("settings/api-tokens/:id")
  @ApiOperation({ summary: "Revoke an API token" })
  revokeApiToken(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
  ): { success: boolean } {
    const orgId = this.resolveOrgId(req);
    return this.adminService.revokeApiToken(orgId, id);
  }
}
