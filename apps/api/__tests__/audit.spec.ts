import { describe, it, expect, beforeEach } from "vitest";
import { AuditService } from "../src/modules/audit/audit.service.js";
import { AuditController } from "../src/modules/audit/audit.controller.js";

describe("Tamper-Evident Audit Logging Module", () => {
  let auditService: AuditService;
  let auditController: AuditController;
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = { tenant: { orgId: mockOrgId }, headers: {} };

  beforeEach(() => {
    auditService = new AuditService();
    auditController = new AuditController(auditService);
  });

  describe("Audit Trail & Hash Chaining", () => {
    it("seals sequential audit records into cryptographic hash chain", () => {
      const record1 = auditController.recordEntry(mockReq, {
        entityType: "employee",
        entityId: "emp_101",
        action: "create",
        diff: { name: "Salma Khatun", department: "Education" },
      });

      expect(record1.id).toBeDefined();
      expect(record1.recordHash).toBeDefined();
      expect(record1.prevRecordHash).toBeDefined();

      const record2 = auditController.recordEntry(mockReq, {
        entityType: "employee",
        entityId: "emp_101",
        action: "update_designation",
        diff: { designation: "Senior Education Officer" },
      });

      expect(record2.prevRecordHash).toBe(record1.recordHash);
    });

    it("verifies the integrity of the tenant audit trail", () => {
      auditController.recordEntry(mockReq, {
        entityType: "procurement",
        entityId: "pr_999",
        action: "approve_budget",
        diff: { amount: 150000 },
      });

      const verification = auditController.verifyChain(mockReq);
      expect(verification.valid).toBe(true);
      expect(verification.totalRecordsChecked).toBeGreaterThanOrEqual(2);
    });

    it("queries audit logs with bounded limits and filters", () => {
      auditController.recordEntry(mockReq, {
        entityType: "voucher",
        entityId: "vch_50",
        action: "post_journal",
        diff: { credit: 5000, debit: 5000 },
      });

      const logs = auditController.getLogs(mockReq, "voucher");
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.entityType).toBe("voucher");
    });
  });
});
