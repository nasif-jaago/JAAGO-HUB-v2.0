export interface OrganizationCompanyDto {
  id: string;
  name: string;
  code: string;
  country: string;
  website: string;
  employeeCount: number;
  branchesCount: number;
}

export interface DesignationDto {
  id: string;
  title: string;
  department: string;
  grade: string;
  employeeCount: number;
}

export interface TeamDto {
  id: string;
  name: string;
  department: string;
  leadName: string;
  memberCount: number;
}

export interface DepartmentDto {
  id: string;
  name: string;
  headName: string;
  employeeCount: number;
  costCenter: string;
}

export interface ProjectDto {
  id: string;
  name: string;
  donor: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Planning";
  assignedCount: number;
}

export interface InsuranceInfoDto {
  id: string;
  policyNumber: string;
  provider: string;
  coverageType: string;
  eligibleCount: number;
  validUntil: string;
}

export interface EmployeeDto {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | undefined;
  organizationId: string;
  organizationName: string;
  department: string;
  designation: string;
  branch: string;
  workingSchedule: string;
  joiningDate: string;
  confirmationDate?: string | undefined;
  status: "Active" | "Inactive" | "Terminated" | "Resigned";
  avatarUrl?: string | undefined;
}

export interface PCDashboardStatsDto {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  absentNow: number;
  newJoiners: number;
  evpSubmissions: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  headcountByDepartment: { department: string; count: number }[];
  attendanceIntelligence: {
    today: { onTime: number; late: number; onLeave: number; absent: number };
    topOnTime: { name: string; score: number }[];
    topLate: { name: string; lateCount: number }[];
  };
}

export interface LeaveRequestDto {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedAt: string;
}

export interface AttendanceLogDto {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut?: string | undefined;
  status: "On-Time" | "Late" | "Half-Day" | "Absent";
  location: string;
  deviceType: "Biometric" | "Mobile Geofence" | "Web Portal";
}

export interface AppraisalDto {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  period: string;
  selfRating: number;
  managerRating: number;
  status: "Draft" | "Submitted" | "Reviewed" | "Completed";
}

export interface PayrollEntryDto {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "Draft" | "Processed" | "Disbursed";
}

export interface HRRequestDto {
  id: string;
  employeeId: string;
  employeeName: string;
  requestType: "NOC" | "Salary Certificate" | "Tax Document" | "ID Card" | "Transfer";
  details: string;
  status: "Submitted" | "In Review" | "Approved" | "Rejected";
  submittedAt: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  category: "General" | "Policy" | "Event" | "Holiday";
  content: string;
  publishedAt: string;
  targetDepartment: string;
  author: string;
}
