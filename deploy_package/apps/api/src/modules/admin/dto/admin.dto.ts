export interface RoleDto {
  id: string;
  name: string;
  code: string;
  description?: string | undefined;
  isSystem: boolean;
  permissions: string[];
  userCount?: number | undefined;
}

export interface CreateRoleDto {
  name: string;
  code: string;
  description?: string | undefined;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string | undefined;
  description?: string | undefined;
  permissions?: string[] | undefined;
}

export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  entity: string;
  action: string;
  description?: string | undefined;
}

export interface SmtpConfigDto {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string | undefined;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | undefined;
}

export interface TestEmailDto {
  recipientEmail: string;
}

export interface CreateApiTokenDto {
  name: string;
  scopes: string[];
  expiresInDays?: number | undefined;
}

export interface ApiTokenResponseDto {
  id: string;
  name: string;
  tokenPrefix: string;
  rawSecretToken?: string | undefined;
  scopes: string[];
  expiresAt?: string | undefined;
  createdAt: string;
  lastUsedAt?: string | undefined;
}

// ─── Step 6.5: Integrations & MCP ──────────────────────────────────────────

export interface WebhookSubscriptionDto {
  id: string;
  name: string;
  targetUrl: string;
  events: string[];
  status: "ACTIVE" | "PAUSED" | "FAILED";
  secretPrefix: string;
  lastDeliveryStatus?: "SUCCESS" | "FAILED" | undefined;
  lastTriggeredAt?: string | undefined;
}

export interface CreateWebhookDto {
  name: string;
  targetUrl: string;
  events: string[];
}

export interface McpServerConfigDto {
  id: string;
  name: string;
  transport: "STDIO" | "SSE" | "STREAMABLE_HTTP";
  serverUrl: string;
  toolsCount: number;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastHeartbeat: string;
}

// ─── Step 6.6: Backup & Recovery Center ─────────────────────────────────────

export type BackupType = "AUTOMATED_DAILY" | "MANUAL_SNAPSHOT" | "PRE_MIGRATION";
export type BackupStatus = "COMPLETED" | "IN_PROGRESS" | "FAILED";

export interface DatabaseSnapshotDto {
  id: string;
  snapshotRef: string;
  backupType: BackupType;
  sizeMB: number;
  createdAt: string;
  status: BackupStatus;
  checksumSha256: string;
  storageTarget: string; // e.g. "Supabase Cloud + S3 Glacier Vault"
}

export interface TriggerSnapshotDto {
  reason: string;
  backupType?: BackupType | undefined;
}

export interface PitrRestoreTestResultDto {
  testId: string;
  targetTimestamp: string;
  tablesVerified: number;
  recordsVerified: number;
  integrityChecksumMatched: boolean;
  durationMs: number;
  status: "PASSED" | "FAILED";
}

// ─── Step 6.7: System Telemetry & Health ────────────────────────────────────

export interface SystemTelemetryDto {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  uptimeSeconds: number;
  cpuUsagePercent: number;
  memory: {
    usedMB: number;
    totalMB: number;
    usagePercent: number;
  };
  database: {
    status: "CONNECTED";
    activeConnections: number;
    maxPoolSize: number;
    latencyMs: number;
  };
  redisCache: {
    status: "CONNECTED";
    hitRatePercent: number;
    memoryUsedMB: number;
  };
  bullmqQueue: {
    status: "HEALTHY";
    waitingJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
  };
  apiMetrics: {
    requestsPerMinute: number;
    p95LatencyMs: number;
    errorRatePercent: number;
  };
}

// ─── System Administration: User Management DTOs ────────────────────────────

export type UserAccessStatus = "ACTIVE" | "INVITED" | "REVOKED" | "PENDING";
export type AuthProviderType = "PASSWORD" | "GOOGLE" | "SAML_SSO";

export interface AdminUserDto {
  id: string;
  orgId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | undefined;
  role: string;
  roleId: string;
  department: string;
  designation?: string | undefined;
  accessStatus: UserAccessStatus;
  authProvider: AuthProviderType;
  mfaEnabled: boolean;
  supabaseUid?: string | undefined;
  invitedAt?: string | undefined;
  lastLoginAt?: string | undefined;
  createdAt: string;
}

export interface CreateAdminUserDto {
  fullName: string;
  email: string;
  phoneNumber?: string | undefined;
  roleId?: string | undefined;
  role?: string | undefined;
  department?: string | undefined;
  designation?: string | undefined;
  autoInvite?: boolean | undefined;
  customPassword?: string | undefined;
}

export interface UpdateAdminUserDto {
  fullName?: string | undefined;
  phoneNumber?: string | undefined;
  roleId?: string | undefined;
  role?: string | undefined;
  department?: string | undefined;
  designation?: string | undefined;
  accessStatus?: UserAccessStatus | undefined;
}

export interface UserInviteResultDto {
  success: boolean;
  userId: string;
  email: string;
  temporaryPassword?: string | undefined;
  loginUrl: string;
  invitedAt: string;
  emailDispatched: boolean;
  message: string;
}

export interface BulkImportUserItemDto {
  fullName: string;
  email: string;
  role?: string | undefined;
  department?: string | undefined;
  designation?: string | undefined;
  phoneNumber?: string | undefined;
}

export interface BulkImportResultDto {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  createdUsers: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    temporaryPassword: string;
    status: string;
  }[];
  errors: {
    row: number;
    email?: string | undefined;
    error: string;
  }[];
}


