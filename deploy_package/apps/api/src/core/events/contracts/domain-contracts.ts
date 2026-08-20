import type { DomainEvent } from "../domain-event.js";

// ─── HR Domain Events ────────────────────────────────────────────────────────

export interface EmployeeCreatedPayload {
  employeeId: string;
  employeeCode: string;
  email: string;
  departmentId: string;
  officeId: string;
  designation: string;
}
export type EmployeeCreatedEvent = DomainEvent<EmployeeCreatedPayload>;

export interface LeaveAppliedPayload {
  leaveApplicationId: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string | undefined;
}
export type LeaveAppliedEvent = DomainEvent<LeaveAppliedPayload>;

export interface LeaveApprovedPayload {
  leaveApplicationId: string;
  employeeId: string;
  approverId: string;
  approvedAt: string;
  comment?: string | undefined;
}
export type LeaveApprovedEvent = DomainEvent<LeaveApprovedPayload>;

// ─── Procurement Domain Events ───────────────────────────────────────────────

export interface RequisitionSubmittedPayload {
  requisitionId: string;
  requisitionCode: string;
  departmentId: string;
  totalAmountEstimated: number;
  itemCount: number;
  justification: string;
}
export type RequisitionSubmittedEvent = DomainEvent<RequisitionSubmittedPayload>;

export interface RequisitionApprovedPayload {
  requisitionId: string;
  requisitionCode: string;
  approverId: string;
  tier: number;
  approvedAmount: number;
}
export type RequisitionApprovedEvent = DomainEvent<RequisitionApprovedPayload>;

// ─── Finance Domain Events ───────────────────────────────────────────────────

export interface VoucherPostedPayload {
  voucherId: string;
  voucherNumber: string;
  voucherType: "JOURNAL" | "PAYMENT" | "RECEIPT";
  amount: number;
  debitAccountCode: string;
  creditAccountCode: string;
}
export type VoucherPostedEvent = DomainEvent<VoucherPostedPayload>;

// ─── Approvals Engine Domain Events ──────────────────────────────────────────

export interface ApprovalRequestedPayload {
  approvalTaskId: string;
  entityType: "LEAVE" | "PURCHASE_REQUISITION" | "EXPENSE_VOUCHER" | "RECRUITMENT";
  entityId: string;
  requesterId: string;
  assignedApproverId: string;
  tierLevel: number;
  deadline?: string | undefined;
}
export type ApprovalRequestedEvent = DomainEvent<ApprovalRequestedPayload>;

export interface ApprovalDecisionPayload {
  approvalTaskId: string;
  entityType: string;
  entityId: string;
  decision: "APPROVED" | "REJECTED" | "REQUESTED_CHANGES";
  actorId: string;
  reason?: string | undefined;
}
export type ApprovalDecisionEvent = DomainEvent<ApprovalDecisionPayload>;
