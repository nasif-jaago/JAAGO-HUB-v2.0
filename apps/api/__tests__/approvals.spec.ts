import { describe, it, expect, beforeEach } from "vitest";
import { ApprovalsService } from "../src/modules/approvals/approvals.service.js";
import { ApprovalsController } from "../src/modules/approvals/approvals.controller.js";

describe("Approvals Engine Module", () => {
  let approvalsService: ApprovalsService;
  let approvalsController: ApprovalsController;
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = { tenant: { orgId: mockOrgId }, user: { id: "usr_admin", displayName: "Admin" }, headers: {} };

  beforeEach(() => {
    approvalsService = new ApprovalsService();
    approvalsController = new ApprovalsController(approvalsService);
  });

  it("lists pending approval tasks and calculates statistics", () => {
    const tasks = approvalsController.getApprovalTasks(mockReq);
    expect(tasks.length).toBeGreaterThanOrEqual(3);

    const stats = approvalsController.getStats(mockReq);
    expect(stats.pendingCount).toBeGreaterThan(0);
  });

  it("progresses multi-tier approval when Tier-1 is approved", () => {
    // Task appr_102 has totalTiers: 2, current tierLevel: 1
    const taskBefore = approvalsController.getApprovalTasks(mockReq).find((t) => t.id === "appr_102");
    expect(taskBefore?.tierLevel).toBe(1);

    const updated = approvalsController.makeDecision("appr_102", mockReq, {
      decision: "APPROVED",
      comment: "Tier 1 verified by Finance",
    });

    expect(updated.tierLevel).toBe(2);
    expect(updated.status).toBe("PENDING"); // Still pending Tier 2 final sign-off
  });

  it("marks task as fully APPROVED when final tier signs off", () => {
    // Task appr_101 has totalTiers: 1
    const updated = approvalsController.makeDecision("appr_101", mockReq, {
      decision: "APPROVED",
      comment: "Leave granted",
    });

    expect(updated.status).toBe("APPROVED");
    expect(updated.decisionBy).toBe("Admin");
  });

  it("delegates approval authority to alternative reviewer", () => {
    const delegated = approvalsController.delegateTask("appr_103", mockReq, {
      delegateToUserId: "usr_deputy_01",
      delegateToName: "Deputy Operations Lead",
      reason: "Travelling for field inspection",
    });

    expect(delegated.delegatedToName).toBe("Deputy Operations Lead");
    expect(delegated.comment).toContain("Delegated by Admin");
  });
});
