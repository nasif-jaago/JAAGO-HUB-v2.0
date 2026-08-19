import { Injectable, NotFoundException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import type {
  OperationalTaskDto,
  CreateTaskDto,
  UpdateTaskStatusDto,
  DocumentAttachmentDto,
  UploadDocumentDto,
  ExecutiveSummaryDto,
} from "./dto/reports.dto.js";

@Injectable()
export class ReportsService {
  private readonly tasks: OperationalTaskDto[] = [];
  private readonly documents: DocumentAttachmentDto[] = [];

  constructor() {
    this.seedDefaultReportsData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultReportsData(): void {
    // Default Tasks
    this.tasks.push(
      {
        id: "tsk_1",
        title: "Review Q3 Science Laboratory equipment delivery for Bandarban school",
        moduleOrigin: "SCHOOL_OPERATIONS",
        assigneeName: "Tanvir Ahmed",
        priority: "HIGH",
        dueDate: "2026-08-25",
        status: "IN_PROGRESS",
        notes: "Coordinate with Sundarban courier and school headmaster for receiving report.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tsk_2",
        title: "Disburse Tranche #2 milestone payment for UNICEF Coastal Literacy grant",
        moduleOrigin: "GRANTS_MILESTONE",
        assigneeName: "Kazi Mahfuzur Rahman",
        priority: "URGENT",
        dueDate: "2026-09-01",
        status: "PENDING",
        notes: "Audit financial double-entry vouchers before requesting wire disbursement.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tsk_3",
        title: "Verify Trade License renewal for Delta Quality Printers",
        moduleOrigin: "PROCUREMENT_PR",
        assigneeName: "Khorshed Alam",
        priority: "MEDIUM",
        dueDate: "2026-08-30",
        status: "PENDING",
        notes: "Request 2026 e-TIN clearance certificate.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tsk_4",
        title: "Complete biometric clock-in verification for Gazipur branch staff",
        moduleOrigin: "HR_ONBOARDING",
        assigneeName: "Rashidul Hasan",
        priority: "LOW",
        dueDate: "2026-08-28",
        status: "COMPLETED",
        notes: "Sync completed with biometric device IP.",
        createdAt: new Date().toISOString(),
      },
    );

    // Default Documents
    this.documents.push(
      {
        id: "doc_1",
        title: "JAAGO Foundation Multi-Year Operations & Procurement Policy 2026",
        category: "POLICY_GOVERNANCE",
        fileName: "JAAGO_Procurement_Policy_2026.pdf",
        fileSizeBytes: 2450000,
        uploadedByName: "Legal & Compliance Directorate",
        uploadedAt: "2026-01-10",
        downloadUrl: "https://storage.jaago.org/docs/procurement_policy_2026.pdf",
      },
      {
        id: "doc_2",
        title: "UNICEF Grant Agreement (Signed Bilateral Protocol) - Ref: GRNT-UNICEF-2026-01",
        category: "GRANT_AGREEMENT",
        fileName: "UNICEF_Bilateral_Grant_Agreement_Signed.pdf",
        fileSizeBytes: 4890000,
        uploadedByName: "Grants & Donor Relations Lead",
        uploadedAt: "2026-01-18",
        downloadUrl: "https://storage.jaago.org/docs/unicef_grant_2026_signed.pdf",
      },
      {
        id: "doc_3",
        title: "Annual External Financial Audit Report FY 2025-2026 (A. Qasem & Co.)",
        category: "AUDIT_REPORT",
        fileName: "External_Audit_Report_FY2025_2026.pdf",
        fileSizeBytes: 6720000,
        uploadedByName: "Finance & Accounts Department",
        uploadedAt: "2026-07-15",
        downloadUrl: "https://storage.jaago.org/docs/external_audit_fy25_26.pdf",
      },
    );
  }

  // ─── Operational Tasks ─────────────────────────────────────────────────────

  getTasks(origin?: string, status?: string): OperationalTaskDto[] {
    return this.tasks.filter((t) => {
      if (origin && origin !== "ALL" && t.moduleOrigin !== origin) return false;
      if (status && status !== "ALL" && t.status !== status) return false;
      return true;
    });
  }

  createTask(dto: CreateTaskDto): OperationalTaskDto {
    const task: OperationalTaskDto = {
      id: `tsk_${Date.now().toString(36)}`,
      title: dto.title,
      moduleOrigin: dto.moduleOrigin,
      assigneeName: dto.assigneeName,
      priority: dto.priority,
      dueDate: dto.dueDate,
      status: "PENDING",
      notes: dto.notes,
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(task);
    this.safeLog({ taskId: task.id, title: task.title }, `Created operational task: ${task.title}`);
    return task;
  }

  updateTaskStatus(id: string, dto: UpdateTaskStatusDto): OperationalTaskDto {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException(`Task ID ${id} not found.`);
    }

    task.status = dto.status;
    this.safeLog({ taskId: id, newStatus: dto.status }, `Updated task status for ${task.title}: ${dto.status}`);
    return task;
  }

  // ─── Documents Repository ──────────────────────────────────────────────────

  getDocuments(category?: string): DocumentAttachmentDto[] {
    return this.documents.filter((d) => (!category || category === "ALL" ? true : d.category === category));
  }

  uploadDocument(dto: UploadDocumentDto): DocumentAttachmentDto {
    const doc: DocumentAttachmentDto = {
      id: `doc_${Date.now().toString(36)}`,
      title: dto.title,
      category: dto.category,
      fileName: dto.fileName,
      fileSizeBytes: dto.fileSizeBytes || 1024000,
      uploadedByName: dto.uploadedByName || "Administrator",
      uploadedAt: new Date().toISOString().split("T")[0]!,
      downloadUrl: `https://storage.jaago.org/docs/${dto.fileName}`,
    };

    this.documents.unshift(doc);
    this.safeLog({ docId: doc.id, title: doc.title }, `Uploaded repository document: ${doc.title}`);
    return doc;
  }

  // ─── Executive BI Summary ──────────────────────────────────────────────────

  getExecutiveSummary(): ExecutiveSummaryDto {
    return {
      headcountTotal: 1240,
      totalStudentsEnrolled: 1180,
      averageAttendancePercent: 94.9,
      totalGrantPortfolioBDT: 50000000,
      totalInventoryValuationBDT: 2427500,
      totalFixedAssetsNBV_BDT: 15480000,
      activePurchaseOrdersCount: 2,
      verifiedVendorsPercentage: 85,
      systemIntegrityStatus: "SEALED_AND_VERIFIED",
    };
  }
}
