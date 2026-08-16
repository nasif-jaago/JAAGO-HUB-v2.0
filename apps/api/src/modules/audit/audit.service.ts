import { Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { getLogger } from "@jaago/logger";
import type {
  AuditLogDto,
  CreateAuditEntryDto,
  VerifyChainResponseDto,
} from "./dto/audit.dto.js";

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

@Injectable()
export class AuditService {
  private readonly logs: AuditLogDto[] = [];

  constructor() {
    this.seedInitialAuditTrail();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private computeHash(
    prevHash: string,
    orgId: string,
    actorId: string,
    entityType: string,
    entityId: string,
    action: string,
    diff: Record<string, unknown>,
    createdAt: string,
  ): string {
    const payload = [
      prevHash,
      orgId,
      actorId,
      entityType,
      entityId,
      action,
      JSON.stringify(diff),
      createdAt,
    ].join("|");

    return createHash("sha256").update(payload).digest("hex");
  }

  private seedInitialAuditTrail(): void {
    const orgId = "00000000-0000-0000-0000-000000000000";
    const actorId = "00000000-0000-0000-0000-000000000001";
    const actorEmail = "admin@jaago.com.bd";

    this.recordEntry(
      orgId,
      {
        entityType: "organization",
        entityId: orgId,
        action: "initialize_tenant",
        diff: { name: "JAAGO Foundation HQ", status: "active" },
        actorId,
        actorEmail,
      },
      { ipAddress: "127.0.0.1", userAgent: "System Bootstrap" },
    );
  }

  recordEntry(
    orgId: string,
    dto: CreateAuditEntryDto,
    meta?: { ipAddress?: string | undefined; userAgent?: string | undefined },
  ): AuditLogDto {
    const prevEntry = this.logs[this.logs.length - 1];
    const prevRecordHash = prevEntry ? prevEntry.recordHash : GENESIS_HASH;

    const id = `aud_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
    const createdAt = new Date().toISOString();
    const actorId = dto.actorId || "00000000-0000-0000-0000-000000000001";

    const recordHash = this.computeHash(
      prevRecordHash,
      orgId,
      actorId,
      dto.entityType,
      dto.entityId,
      dto.action,
      dto.diff,
      createdAt,
    );

    const record: AuditLogDto = {
      id,
      orgId,
      actorId,
      actorEmail: dto.actorEmail || "admin@jaago.com.bd",
      entityType: dto.entityType,
      entityId: dto.entityId,
      action: dto.action,
      diff: dto.diff,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      prevRecordHash,
      recordHash,
      createdAt,
    };

    this.logs.push(record);
    this.safeLog(
      { orgId, auditId: id, entityType: dto.entityType, action: dto.action, hash: recordHash.slice(0, 12) },
      `Audit record sealed in hash chain: [${dto.entityType}] ${dto.action}`,
    );

    return record;
  }

  getLogs(
    orgId: string,
    filters?: {
      entityType?: string | undefined;
      entityId?: string | undefined;
      actorId?: string | undefined;
      limit?: number | undefined;
    },
  ): AuditLogDto[] {
    const limit = Math.min(Math.max(filters?.limit || 50, 1), 200);

    return this.logs
      .filter((l) => {
        if (l.orgId !== orgId) return false;
        if (filters?.entityType && l.entityType !== filters.entityType) return false;
        if (filters?.entityId && l.entityId !== filters.entityId) return false;
        if (filters?.actorId && l.actorId !== filters.actorId) return false;
        return true;
      })
      .slice(-limit)
      .reverse();
  }

  verifyChain(orgId: string): VerifyChainResponseDto {
    const tenantLogs = this.logs.filter((l) => l.orgId === orgId);

    for (let i = 0; i < tenantLogs.length; i++) {
      const current = tenantLogs[i]!;

      // Verify link to previous entry
      if (i > 0) {
        const prev = tenantLogs[i - 1]!;
        if (current.prevRecordHash !== prev.recordHash) {
          return {
            valid: false,
            totalRecordsChecked: i + 1,
            brokenAtId: current.id,
            verifiedAt: new Date().toISOString(),
          };
        }
      }

      // Recompute and verify current record hash
      const expected = this.computeHash(
        current.prevRecordHash,
        current.orgId,
        current.actorId,
        current.entityType,
        current.entityId,
        current.action,
        current.diff,
        current.createdAt,
      );

      if (current.recordHash !== expected) {
        return {
          valid: false,
          totalRecordsChecked: i + 1,
          brokenAtId: current.id,
          verifiedAt: new Date().toISOString(),
        };
      }
    }

    return {
      valid: true,
      totalRecordsChecked: tenantLogs.length,
      verifiedAt: new Date().toISOString(),
    };
  }
}
