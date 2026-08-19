import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";

export interface AuditRecord {
  id: string;
  orgId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  diff: Record<string, unknown>;
  timestamp: string;
  prevRecordHash: string;
  recordHash: string;
}

export function computeRecordHash(entry: Omit<AuditRecord, "recordHash">): string {
  const payload = [
    entry.prevRecordHash,
    entry.orgId,
    entry.actorId,
    entry.entityType,
    entry.entityId,
    entry.action,
    JSON.stringify(entry.diff),
    entry.timestamp,
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

export function verifyAuditChain(records: AuditRecord[]): { valid: boolean; brokenAtId?: string } {
  for (let i = 0; i < records.length; i++) {
    const current = records[i]!;
    
    // Check previous link
    if (i > 0) {
      const prev = records[i - 1]!;
      if (current.prevRecordHash !== prev.recordHash) {
        return { valid: false, brokenAtId: current.id };
      }
    }

    // Recompute current hash
    const expectedHash = computeRecordHash(current);
    if (current.recordHash !== expectedHash) {
      return { valid: false, brokenAtId: current.id };
    }
  }

  return { valid: true };
}

describe("Tamper-Evident Audit Logging — Hash Chain Verification", () => {
  it("generates cryptographic hash chain across sequential records", () => {
    const orgId = "00000000-0000-0000-0000-000000000000";
    const actorId = "usr_admin_001";
    const genesisHash = "GENESIS_BLOCK_00000000000000000000000000000000";

    const record1Data = {
      id: "aud_01",
      orgId,
      actorId,
      entityType: "employee",
      entityId: "emp_101",
      action: "create",
      diff: { name: "Tanvir Ahmed", designation: "Officer" },
      timestamp: "2026-08-16T12:00:00.000Z",
      prevRecordHash: genesisHash,
    };
    const record1: AuditRecord = {
      ...record1Data,
      recordHash: computeRecordHash(record1Data),
    };

    const record2Data = {
      id: "aud_02",
      orgId,
      actorId,
      entityType: "employee",
      entityId: "emp_101",
      action: "update_salary",
      diff: { oldSalary: 45000, newSalary: 55000 },
      timestamp: "2026-08-16T12:05:00.000Z",
      prevRecordHash: record1.recordHash,
    };
    const record2: AuditRecord = {
      ...record2Data,
      recordHash: computeRecordHash(record2Data),
    };

    const chain = [record1, record2];
    const verification = verifyAuditChain(chain);
    expect(verification.valid).toBe(true);
  });

  it("detects tampered diff or modified record in the chain", () => {
    const orgId = "00000000-0000-0000-0000-000000000000";
    const actorId = "usr_admin_001";
    const genesisHash = "GENESIS_BLOCK_00000000000000000000000000000000";

    const record1Data = {
      id: "aud_01",
      orgId,
      actorId,
      entityType: "leave_application",
      entityId: "lv_201",
      action: "apply",
      diff: { days: 3, reason: "Sick Leave" },
      timestamp: "2026-08-16T12:00:00.000Z",
      prevRecordHash: genesisHash,
    };
    const record1: AuditRecord = {
      ...record1Data,
      recordHash: computeRecordHash(record1Data),
    };

    const record2Data = {
      id: "aud_02",
      orgId,
      actorId,
      entityType: "leave_application",
      entityId: "lv_201",
      action: "approve",
      diff: { approvedBy: "HR Manager" },
      timestamp: "2026-08-16T12:05:00.000Z",
      prevRecordHash: record1.recordHash,
    };
    const record2: AuditRecord = {
      ...record2Data,
      recordHash: computeRecordHash(record2Data),
    };

    // Malicious attacker alters record 1 diff in DB directly without updating hashes
    const tamperedChain = [
      {
        ...record1,
        diff: { days: 30, reason: "Unauthorized 30 days leave" }, // TAMPERED!
      },
      record2,
    ];

    const result = verifyAuditChain(tamperedChain);
    expect(result.valid).toBe(false);
    expect(result.brokenAtId).toBe("aud_01");
  });
});
