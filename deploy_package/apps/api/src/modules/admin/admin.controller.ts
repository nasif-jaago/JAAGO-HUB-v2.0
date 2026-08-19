import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  WebhookSubscriptionDto,
  CreateWebhookDto,
  McpServerConfigDto,
  DatabaseSnapshotDto,
  TriggerSnapshotDto,
  PitrRestoreTestResultDto,
  SystemTelemetryDto,
  AdminUserDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UserInviteResultDto,
  BulkImportUserItemDto,
  BulkImportResultDto,
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
  async sendTestEmail(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: TestEmailDto,
  ): Promise<{ success: boolean; message: string }> {
    const orgId = this.resolveOrgId(req);
    const recipient = dto?.recipientEmail || "nasif.kamal@jaago.com.bd";
    return await this.adminService.sendTestEmail(orgId, recipient);
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

  // ─── Step 6.5: Integrations & MCP ──────────────────────────────────────────

  @Public()
  @Get("integrations/webhooks")
  @ApiOperation({ summary: "List active webhook subscriptions" })
  getWebhooks(): WebhookSubscriptionDto[] {
    return this.adminService.getWebhooks();
  }

  @Public()
  @Post("integrations/webhooks")
  @ApiOperation({ summary: "Register a new webhook subscription" })
  createWebhook(@Body() dto: CreateWebhookDto): WebhookSubscriptionDto {
    return this.adminService.createWebhook(dto);
  }

  @Public()
  @Delete("integrations/webhooks/:id")
  @ApiOperation({ summary: "Delete a webhook subscription" })
  deleteWebhook(@Param("id") id: string): { success: boolean } {
    return this.adminService.deleteWebhook(id);
  }

  @Public()
  @Get("integrations/mcp")
  @ApiOperation({ summary: "List connected Model Context Protocol (MCP) servers" })
  getMcpServers(): McpServerConfigDto[] {
    return this.adminService.getMcpServers();
  }

  // ─── Step 6.6: Backup & Recovery Center ─────────────────────────────────────

  @Public()
  @Get("backups/snapshots")
  @ApiOperation({ summary: "List database snapshots and automated backups" })
  getSnapshots(): DatabaseSnapshotDto[] {
    return this.adminService.getSnapshots();
  }

  @Public()
  @Post("backups/snapshots")
  @ApiOperation({ summary: "Trigger manual database snapshot" })
  triggerSnapshot(@Body() dto: TriggerSnapshotDto): DatabaseSnapshotDto {
    return this.adminService.triggerSnapshot(dto);
  }

  @Public()
  @Post("backups/pitr-verify")
  @ApiOperation({ summary: "Run Point-In-Time Recovery (PITR) automated drill" })
  runPitrVerification(): PitrRestoreTestResultDto {
    return this.adminService.runPitrVerification();
  }

  // ─── Step 6.7: System Telemetry & Health ────────────────────────────────────

  @Public()
  @Get("system/telemetry")
  @ApiOperation({ summary: "Get live system telemetry, queue depth, cache, and database pool metrics" })
  getSystemTelemetry(): SystemTelemetryDto {
    return this.adminService.getSystemTelemetry();
  }

  // ─── System Administration: User Management Endpoints ──────────────────────

  @Public()
  @Get("users")
  @ApiOperation({ summary: "Get all users in directory" })
  async getUsers(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
  ): Promise<AdminUserDto[]> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.getUsers(orgId);
  }

  @Public()
  @Get("users/:id")
  @ApiOperation({ summary: "Get single user details by ID" })
  async getUserById(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
  ): Promise<AdminUserDto> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.getUserById(orgId, id);
  }

  @Public()
  @Post("users")
  @ApiOperation({ summary: "Create a new user and optionally dispatch invite email with temp password" })
  async createUser(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: CreateAdminUserDto,
  ): Promise<{ user: AdminUserDto; inviteResult?: UserInviteResultDto | undefined }> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.createUser(orgId, dto);
  }

  @Public()
  @Post("users/:id/invite")
  @ApiOperation({ summary: "Dispatch invitation email with login link and temporary credentials" })
  async inviteUser(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
  ): Promise<UserInviteResultDto> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.inviteUser(orgId, id);
  }

  @Public()
  @Patch("users/:id/revoke")
  @ApiOperation({ summary: "Revoke user login access and invalidate active sessions" })
  async revokeUserAccess(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
  ): Promise<{ success: boolean; user: AdminUserDto; message: string }> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.revokeUserAccess(orgId, id);
  }

  @Public()
  @Patch("users/:id/restore")
  @ApiOperation({ summary: "Restore user login access" })
  async restoreUserAccess(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
  ): Promise<{ success: boolean; user: AdminUserDto; message: string }> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.restoreUserAccess(orgId, id);
  }

  @Public()
  @Post("users/:id/reset-password")
  @ApiOperation({ summary: "Reset password, generate new credentials and send email" })
  async resetUserPassword(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
  ): Promise<UserInviteResultDto> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.resetUserPassword(orgId, id);
  }

  @Public()
  @Put("users/:id")
  @ApiOperation({ summary: "Update user profile, role, or department" })
  async updateUser(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<AdminUserDto> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.updateUser(orgId, id, dto);
  }

  @Public()
  @Delete("users/:id")
  @ApiOperation({ summary: "Permanently remove user from system directory" })
  async deleteUser(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Param("id") id: string,
  ): Promise<{ success: boolean; message: string }> {
    const orgId = this.resolveOrgId(req);
    return await this.adminService.deleteUser(orgId, id);
  }

  @Public()
  @Post("users/import")
  @ApiOperation({ summary: "Bulk import users from CSV/JSON payload" })
  async bulkImportUsers(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() body: { users: BulkImportUserItemDto[] },
  ): Promise<BulkImportResultDto> {
    const orgId = this.resolveOrgId(req);
    const users = Array.isArray(body.users) ? body.users : [];
    return await this.adminService.bulkImportUsers(orgId, users);
  }

  @Public()
  @Post("users/bulk-invite")
  @ApiOperation({ summary: "Bulk invite selected users and generate credentials" })
  async bulkInviteUsers(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() body: { userIds: string[] },
  ): Promise<{ totalRequested: number; successCount: number; results: UserInviteResultDto[] }> {
    const orgId = this.resolveOrgId(req);
    const userIds = Array.isArray(body.userIds) ? body.userIds : [];
    return await this.adminService.bulkInviteUsers(orgId, userIds);
  }

  @Public()
  @Post("users/bulk-delete")
  @ApiOperation({ summary: "Bulk delete selected users" })
  async bulkDeleteUsers(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() body: { userIds: string[] },
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const orgId = this.resolveOrgId(req);
    const userIds = Array.isArray(body.userIds) ? body.userIds : [];
    return await this.adminService.bulkDeleteUsers(orgId, userIds);
  }

  @Public()
  @Post("users/bulk-revoke")
  @ApiOperation({ summary: "Bulk revoke login access for selected users" })
  async bulkRevokeUsers(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() body: { userIds: string[] },
  ): Promise<{ success: boolean; revokedCount: number; message: string }> {
    const orgId = this.resolveOrgId(req);
    const userIds = Array.isArray(body.userIds) ? body.userIds : [];
    return await this.adminService.bulkRevokeUsers(orgId, userIds);
  }

  @Public()
  @Post("users/bulk-restore")
  @ApiOperation({ summary: "Bulk restore login access for selected users" })
  async bulkRestoreUsers(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() body: { userIds: string[] },
  ): Promise<{ success: boolean; restoredCount: number; message: string }> {
    const orgId = this.resolveOrgId(req);
    const userIds = Array.isArray(body.userIds) ? body.userIds : [];
    return await this.adminService.bulkRestoreUsers(orgId, userIds);
  }
}



