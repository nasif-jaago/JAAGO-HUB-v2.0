export type ApprovalEntityType = "LEAVE" | "PURCHASE_REQUISITION" | "EXPENSE_VOUCHER" | "RECRUITMENT";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

export interface ApprovalTaskDto {
  id: string;
  orgId: string;
  entityType: ApprovalEntityType;
  entityId: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string | undefined;
  assignedApproverId?: string | undefined;
  assignedRole: string;
  tierLevel: number;
  totalTiers: number;
  amountOrValue?: string | undefined;
  status: ApprovalStatus;
  comment?: string | undefined;
  decisionBy?: string | undefined;
  decisionAt?: string | undefined;
  createdAt: string;
  delegatedToId?: string | undefined;
  delegatedToName?: string | undefined;
}

export interface ApprovalDecisionDto {
  decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  comment?: string | undefined;
}

export interface DelegateApprovalDto {
  delegateToUserId: string;
  delegateToName: string;
  reason: string;
}

export interface ApprovalStatsDto {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  urgentCount: number;
}
