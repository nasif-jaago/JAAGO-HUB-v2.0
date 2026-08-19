export interface AuditLogDto {
  id: string;
  orgId: string;
  actorId: string;
  actorEmail?: string | undefined;
  entityType: string;
  entityId: string;
  action: string;
  diff: Record<string, unknown>;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  prevRecordHash: string;
  recordHash: string;
  createdAt: string;
}

export interface CreateAuditEntryDto {
  entityType: string;
  entityId: string;
  action: string;
  diff: Record<string, unknown>;
  actorId?: string | undefined;
  actorEmail?: string | undefined;
}

export interface VerifyChainResponseDto {
  valid: boolean;
  totalRecordsChecked: number;
  brokenAtId?: string | undefined;
  verifiedAt: string;
}
