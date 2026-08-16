import { describe, it, expect, beforeEach } from "vitest";
import { ReportsService } from "../src/modules/reports/reports.service.js";
import { ReportsController } from "../src/modules/reports/reports.controller.js";

describe("Reports, Tasks & Document Hub Module", () => {
  let reportsService: ReportsService;
  let reportsController: ReportsController;

  beforeEach(() => {
    reportsService = new ReportsService();
    reportsController = new ReportsController(reportsService);
  });

  it("returns executive BI overview metrics", () => {
    const summary = reportsController.getExecutiveSummary();
    expect(summary.headcountTotal).toBeGreaterThan(0);
    expect(summary.totalStudentsEnrolled).toBeGreaterThan(0);
    expect(summary.totalGrantPortfolioBDT).toBeGreaterThan(0);
    expect(summary.systemIntegrityStatus).toBe("SEALED_AND_VERIFIED");
  });

  it("creates, queries, and updates operational tasks", () => {
    const initialTasks = reportsController.getTasks();
    expect(initialTasks.length).toBeGreaterThanOrEqual(4);

    const newTask = reportsController.createTask({
      title: "Audit Rajshahi branch physical stock count",
      moduleOrigin: "SCHOOL_OPERATIONS",
      assigneeName: "Monirul Islam",
      priority: "HIGH",
      dueDate: "2026-08-31",
      notes: "Cross check with Goods Receipt Notes (GRN).",
    });

    expect(newTask.id).toBeDefined();
    expect(newTask.status).toBe("PENDING");

    const updated = reportsController.updateTaskStatus(newTask.id, {
      status: "COMPLETED",
    });
    expect(updated.status).toBe("COMPLETED");
  });

  it("uploads and queries compliance documents and policy attachments", () => {
    const initialDocs = reportsController.getDocuments();
    expect(initialDocs.length).toBeGreaterThanOrEqual(3);

    const newDoc = reportsController.uploadDocument({
      title: "Child Safeguarding & Protection Policy 2026",
      category: "POLICY_GOVERNANCE",
      fileName: "Child_Safeguarding_Policy_2026.pdf",
      fileSizeBytes: 1850000,
      uploadedByName: "Child Protection Officer",
    });

    expect(newDoc.id).toBeDefined();
    expect(newDoc.downloadUrl).toContain("Child_Safeguarding_Policy_2026.pdf");
  });
});
