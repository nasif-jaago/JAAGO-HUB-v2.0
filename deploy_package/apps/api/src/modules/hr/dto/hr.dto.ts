export type EmploymentStatus = "ACTIVE" | "PROBATION" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACTUAL" | "VOLUNTEER" | "INTERN";
export type LeaveType = "ANNUAL" | "SICK" | "CASUAL" | "MATERNITY" | "PATERNITY" | "UNPAID";
export type LeaveApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface EmployeeDto {
  id: string;
  orgId: string;
  employeeCode: string;
  userId?: string | undefined;
  firstName: string;
  lastName: string;
  fullName: string;
  officialEmail: string;
  personalEmail?: string | undefined;
  phoneNumber: string;
  nidOrPassport: string;
  joiningDate: string;
  departmentId: string;
  departmentName: string;
  officeId: string;
  officeName: string;
  designation: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  reportingManagerId?: string | undefined;
  reportingManagerName?: string | undefined;
  salaryGrade?: string | undefined;
  emergencyContactName?: string | undefined;
  emergencyContactPhone?: string | undefined;
  createdAt: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  officialEmail: string;
  personalEmail?: string | undefined;
  phoneNumber: string;
  nidOrPassport: string;
  joiningDate: string;
  departmentName: string;
  officeName: string;
  designation: string;
  employmentType?: EmploymentType | undefined;
  employmentStatus?: EmploymentStatus | undefined;
  reportingManagerName?: string | undefined;
  salaryGrade?: string | undefined;
  emergencyContactName?: string | undefined;
  emergencyContactPhone?: string | undefined;
}

export interface UpdateEmployeeDto {
  firstName?: string | undefined;
  lastName?: string | undefined;
  phoneNumber?: string | undefined;
  departmentName?: string | undefined;
  officeName?: string | undefined;
  designation?: string | undefined;
  employmentStatus?: EmploymentStatus | undefined;
  salaryGrade?: string | undefined;
  emergencyContactName?: string | undefined;
  emergencyContactPhone?: string | undefined;
}

export interface LeaveBalanceDto {
  leaveType: LeaveType;
  totalQuota: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export interface LeaveApplicationDto {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveApplicationStatus;
  approverComment?: string | undefined;
  appliedAt: string;
  reviewedAt?: string | undefined;
}

export interface ApplyLeaveDto {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
}
