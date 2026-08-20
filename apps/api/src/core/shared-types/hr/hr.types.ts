import type { EmploymentStatus, EmploymentType, Gender, LeaveRequestStatus } from "../enums/index.js";

export interface Employee {
  id: string;
  orgId: string;
  userId: string | null;
  employeeCode: string;
  departmentId: string;
  officeId: string;
  designationId: string;
  reportsToEmployeeId: string | null;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  joinDate: string;   // ISO date "YYYY-MM-DD"
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonProfile {
  id: string;
  employeeId: string;
  fullName: string;
  banglaName: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  phone: string | null;
  personalEmail: string | null;
  workEmail: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface LeaveRequest {
  id: string;
  orgId: string;
  employeeId: string;
  leaveTypeId: string;
  referenceNumber: string;
  fromDate: string;
  toDate: string;
  days: string;    // Decimal string (e.g. "2.5" for half-days)
  reason: string | null;
  status: LeaveRequestStatus;
  approvalRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  entitled: string;
  used: string;
  pending: string;
  remaining: string;
}
