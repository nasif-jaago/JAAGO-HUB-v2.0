export type ModuleOrigin =
  | "HR_ONBOARDING"
  | "PROCUREMENT_PR"
  | "FINANCE_VOUCHER"
  | "GRANTS_MILESTONE"
  | "SCHOOL_OPERATIONS"
  | "GENERAL_ADMIN";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface OperationalTaskDto {
  id: string;
  title: string;
  moduleOrigin: ModuleOrigin;
  assigneeName: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  notes?: string | undefined;
  createdAt: string;
}

export interface CreateTaskDto {
  title: string;
  moduleOrigin: ModuleOrigin;
  assigneeName: string;
  priority: TaskPriority;
  dueDate: string;
  notes?: string | undefined;
}

export interface UpdateTaskStatusDto {
  status: TaskStatus;
}

export interface DocumentAttachmentDto {
  id: string;
  title: string;
  category: "POLICY_GOVERNANCE" | "GRANT_AGREEMENT" | "AUDIT_REPORT" | "VENDOR_CONTRACT" | "EMPLOYEE_RECORD";
  fileName: string;
  fileSizeBytes: number;
  uploadedByName: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface UploadDocumentDto {
  title: string;
  category: "POLICY_GOVERNANCE" | "GRANT_AGREEMENT" | "AUDIT_REPORT" | "VENDOR_CONTRACT" | "EMPLOYEE_RECORD";
  fileName: string;
  fileSizeBytes?: number | undefined;
  uploadedByName?: string | undefined;
}

export interface ExecutiveSummaryDto {
  headcountTotal: number;
  totalStudentsEnrolled: number;
  averageAttendancePercent: number;
  totalGrantPortfolioBDT: number;
  totalInventoryValuationBDT: number;
  totalFixedAssetsNBV_BDT: number;
  activePurchaseOrdersCount: number;
  verifiedVendorsPercentage: number;
  systemIntegrityStatus: "SEALED_AND_VERIFIED";
}
