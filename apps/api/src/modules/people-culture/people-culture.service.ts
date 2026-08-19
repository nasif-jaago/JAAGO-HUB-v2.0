import { Injectable, NotFoundException } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  OrganizationCompanyDto,
  DesignationDto,
  TeamDto,
  DepartmentDto,
  ProjectDto,
  InsuranceInfoDto,
  EmployeeDto,
  PCDashboardStatsDto,
  LeaveRequestDto,
  AttendanceLogDto,
  AppraisalDto,
  PayrollEntryDto,
  HRRequestDto,
  AnnouncementDto,
} from "./dto/people-culture.dto.js";

@Injectable()
export class PeopleCultureService {
  private getSupabaseClient(): SupabaseClient | null {
    const url = process.env.SUPABASE_URL || "https://rdmyghbciiepqmlwekjd.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbXlnaGJjaWllcHFtbHdla2pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjgxNDg4NCwiZXhwIjoyMTAyMzkwODg0fQ.dDHajLLk7nNH23Pk6QiAf_idV7GYbnM_n9RyISm7TWg";
    if (!url || !key) return null;
    try {
      return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    } catch {
      return null;
    }
  }

  // ─── Default Mock Data Repositories ────────────────────────────────────────

  private companies: OrganizationCompanyDto[] = [
    {
      id: "org_jaago_fdn",
      name: "JAAGO Foundation",
      code: "JAAGO_FDN",
      country: "Bangladesh",
      website: "https://jaago.com.bd",
      employeeCount: 485,
      branchesCount: 12,
    },
    {
      id: "org_jaago_trust",
      name: "JAAGO Foundation Trust",
      code: "JAAGO_TRUST",
      country: "Bangladesh",
      website: "http://www.jaago.com.bd",
      employeeCount: 215,
      branchesCount: 6,
    },
    {
      id: "org_jaago_inc",
      name: "JAAGO Foundation INC",
      code: "JAAGO_INC",
      country: "United States",
      website: "http://www.jaago.com.bd",
      employeeCount: 22,
      branchesCount: 2,
    },
    {
      id: "org_jaago_uk",
      name: "JAAGO Foundation UK",
      code: "JAAGO_UK",
      country: "United Kingdom",
      website: "http://www.jaago.com.bd",
      employeeCount: 19,
      branchesCount: 1,
    },
  ];

  private designations: DesignationDto[] = [
    { id: "des_1", title: "Coordinator, Tech 4 Development", department: "Executive Leadership", grade: "M-1", employeeCount: 2 },
    { id: "des_2", title: "Assistant Manager", department: "Communications", grade: "M-2", employeeCount: 14 },
    { id: "des_3", title: "Program Officer", department: "EMK Center", grade: "E-1", employeeCount: 28 },
    { id: "des_4", title: "Assistant Teacher", department: "Digital School Program", grade: "T-2", employeeCount: 195 },
    { id: "des_5", title: "Security Guard", department: "Program Implementation", grade: "S-1", employeeCount: 38 },
    { id: "des_6", title: "Lead People Partner", department: "Human Resources", grade: "M-1", employeeCount: 6 },
    { id: "des_7", title: "Senior Accounts Officer", department: "Finance & Accounts", grade: "E-2", employeeCount: 18 },
  ];

  private teams: TeamDto[] = [
    { id: "tm_1", name: "Core Engineering & ERP", department: "Executive Leadership", leadName: "Nasif Kamal", memberCount: 8 },
    { id: "tm_2", name: "Digital School Curriculum", department: "School Operations", leadName: "Salma Khatun", memberCount: 42 },
    { id: "tm_3", name: "Grants & Donor Relations", department: "Fundraising & Grants", leadName: "Tanvir Rahman", memberCount: 15 },
    { id: "tm_4", name: "Youth Development & Volunteerism", department: "Founder's Office", leadName: "Farhana Ahmed", memberCount: 24 },
  ];

  private departments: DepartmentDto[] = [
    { id: "dept_1", name: "Programs & Education", headName: "Korvi Rakshand", employeeCount: 340, costCenter: "CC-101" },
    { id: "dept_2", name: "Digital School Project", headName: "Shaheen Ahmed", employeeCount: 180, costCenter: "CC-102" },
    { id: "dept_3", name: "Finance & Accounts", headName: "Tanvir Rahman", employeeCount: 45, costCenter: "CC-103" },
    { id: "dept_4", name: "Youth Development", headName: "Farhana Ahmed", employeeCount: 55, costCenter: "CC-104" },
    { id: "dept_5", name: "Fundraising & Grants", headName: "Salma Khatun", employeeCount: 38, costCenter: "CC-105" },
    { id: "dept_6", name: "Human Resources", headName: "Lead Partner", employeeCount: 25, costCenter: "CC-106" },
  ];

  private projects: ProjectDto[] = [
    { id: "proj_1", name: "Telco-Assisted Digital Schools", donor: "Grameenphone / Telenor", startDate: "2023-01-01", endDate: "2026-12-31", status: "Active", assignedCount: 140 },
    { id: "proj_2", name: "EMK Center Cultural & Education Hub", donor: "US Embassy Dhaka", startDate: "2022-06-01", endDate: "2027-05-31", status: "Active", assignedCount: 65 },
    { id: "proj_3", name: "Climate Resilient Child Education", donor: "Foreign Commonwealth Office", startDate: "2024-01-01", endDate: "2026-06-30", status: "Active", assignedCount: 85 },
  ];

  private insurance: InsuranceInfoDto[] = [
    { id: "ins_1", policyNumber: "PRG-2026-88910", provider: "Pragati Life Insurance", coverageType: "Group Health & Critical Care", eligibleCount: 680, validUntil: "2026-12-31" },
    { id: "ins_2", policyNumber: "GDL-2026-44123", provider: "Green Delta Insurance", coverageType: "Accidental & Disability", eligibleCount: 741, validUntil: "2026-12-31" },
  ];

  private employees: EmployeeDto[] = [];

  // ─── Dashboard Stats Method ───────────────────────────────────────────────

  async getDashboardStats(_orgFilter = "ALL"): Promise<PCDashboardStatsDto> {
    return {
      totalEmployees: 741,
      presentToday: 78,
      onLeave: 5,
      absentNow: 649,
      newJoiners: 4,
      evpSubmissions: 9,
      genderDistribution: {
        male: 408,
        female: 326,
        other: 7,
      },
      headcountByDepartment: [
        { department: "Programs & Education", count: 340 },
        { department: "Digital School Project", count: 180 },
        { department: "Finance & Accounts", count: 45 },
        { department: "Youth Development", count: 55 },
        { department: "Fundraising & Grants", count: 38 },
      ],
      attendanceIntelligence: {
        today: { onTime: 68, late: 10, onLeave: 5, absent: 658 },
        topOnTime: [
          { name: "Adnan Chakma", score: 98 },
          { name: "Samira Tabassum Moqur", score: 97 },
          { name: "Md. Iqbal Hussain", score: 96 },
          { name: "Ferdous Azim", score: 95 },
        ],
        topLate: [
          { name: "Md. Rajvi Hasan", lateCount: 12 },
          { name: "Md. Sajibur Rahman", lateCount: 10 },
          { name: "Farhadul Islam Zahid", lateCount: 8 },
          { name: "Adiba Sayeed", lateCount: 7 },
        ],
      },
    };
  }

  // ─── Organization & Companies ─────────────────────────────────────────────

  async getCompanies(): Promise<OrganizationCompanyDto[]> {
    return this.companies;
  }

  async getDesignations(): Promise<DesignationDto[]> {
    return this.designations;
  }

  async getTeams(): Promise<TeamDto[]> {
    return this.teams;
  }

  async getDepartments(): Promise<DepartmentDto[]> {
    return this.departments;
  }

  async getProjects(): Promise<ProjectDto[]> {
    return this.projects;
  }

  async getInsuranceInfo(): Promise<InsuranceInfoDto[]> {
    return this.insurance;
  }

  // ─── Employees ────────────────────────────────────────────────────────────

  private getFilteredEmployees(orgFilter: string): EmployeeDto[] {
    if (orgFilter === "ALL" || !orgFilter) {
      return this.employees;
    }
    const cleanFilter = orgFilter.toLowerCase().replace(/_/g, " ");
    return this.employees.filter((e) =>
      e.organizationName.toLowerCase().includes(cleanFilter) ||
      e.organizationId.toLowerCase().includes(cleanFilter)
    );
  }

  async getEmployees(orgFilter = "ALL", status = "ALL"): Promise<EmployeeDto[]> {
    let list = this.getFilteredEmployees(orgFilter);
    if (status !== "ALL" && status) {
      list = list.filter((e) => e.status.toLowerCase() === status.toLowerCase());
    }
    return list;
  }

  async createEmployee(dto: Partial<EmployeeDto>): Promise<EmployeeDto> {
    const id = `emp_${Date.now()}`;
    const newEmp: EmployeeDto = {
      id,
      employeeId: dto.employeeId || `JGO${Date.now().toString().slice(-7)}`,
      fullName: (dto.fullName || "New Employee").trim(),
      email: (dto.email || "").trim().toLowerCase(),
      phoneNumber: dto.phoneNumber?.trim() || undefined,
      organizationId: dto.organizationId || "org_jaago_fdn",
      organizationName: dto.organizationName || "JAAGO Foundation",
      department: dto.department || "General Operations",
      designation: dto.designation || "Standard Employee",
      branch: dto.branch || "Head Office (Banani)",
      workingSchedule: dto.workingSchedule || "General 9 AM to 5 PM",
      joiningDate: dto.joiningDate || new Date().toISOString().slice(0, 10),
      confirmationDate: dto.confirmationDate || undefined,
      status: dto.status || "Active",
      avatarUrl: dto.avatarUrl || undefined,
    };

    this.employees.unshift(newEmp);

    // Sync in Supabase if client available
    const supa = this.getSupabaseClient();
    if (supa && newEmp.email) {
      try {
        await supa.auth.admin.createUser({
          email: newEmp.email,
          user_metadata: {
            full_name: newEmp.fullName,
            role: newEmp.designation,
            department: newEmp.department,
            organization: newEmp.organizationName,
          },
        });
      } catch {
        // Safe fallback
      }
    }

    return newEmp;
  }

  async updateEmployee(id: string, dto: Partial<EmployeeDto>): Promise<EmployeeDto> {
    const idx = this.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new NotFoundException("Employee not found");
    }
    const existing = this.employees[idx]!;
    const updated: EmployeeDto = {
      ...existing,
      ...dto,
      id: existing.id,
      fullName: dto.fullName !== undefined ? dto.fullName.trim() : existing.fullName,
      email: dto.email !== undefined ? dto.email.trim().toLowerCase() : existing.email,
    };
    this.employees[idx] = updated;

    // Sync in Supabase user metadata
    const supa = this.getSupabaseClient();
    if (supa && updated.email) {
      try {
        const { data: usersData } = await supa.auth.admin.listUsers();
        const user = usersData?.users?.find((u) => u.email?.toLowerCase() === updated.email.toLowerCase());
        if (user) {
          await supa.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              full_name: updated.fullName,
              department: updated.department,
              role: updated.designation,
              organization: updated.organizationName,
            },
          });
        }
      } catch {
        // Safe fallback
      }
    }

    return updated;
  }

  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const idx = this.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      return { success: false, message: "Employee not found" };
    }
    const emp = this.employees[idx];
    this.employees.splice(idx, 1);

    const supa = this.getSupabaseClient();
    if (supa && emp?.email) {
      try {
        const { data: usersData } = await supa.auth.admin.listUsers();
        const user = usersData?.users?.find((u) => u.email?.toLowerCase() === emp.email.toLowerCase());
        if (user) {
          await supa.auth.admin.deleteUser(user.id);
        }
      } catch {
        // Safe fallback
      }
    }

    return { success: true, message: `Employee ${emp?.fullName || id} successfully deleted.` };
  }

  async bulkDeleteEmployees(ids: string[]): Promise<{ success: boolean; deletedCount: number; message: string }> {
    if (!ids || ids.length === 0) {
      return { success: true, deletedCount: 0, message: "No employees selected" };
    }
    const idSet = new Set(ids);
    const toDelete = this.employees.filter((e) => idSet.has(e.id));
    this.employees = this.employees.filter((e) => !idSet.has(e.id));

    const supa = this.getSupabaseClient();
    if (supa) {
      try {
        const { data: usersData } = await supa.auth.admin.listUsers();
        for (const emp of toDelete) {
          if (emp.email) {
            const user = usersData?.users?.find((u) => u.email?.toLowerCase() === emp.email.toLowerCase());
            if (user) {
              await supa.auth.admin.deleteUser(user.id);
            }
          }
        }
      } catch {
        // Safe fallback
      }
    }

    return {
      success: true,
      deletedCount: toDelete.length,
      message: `Successfully deleted ${toDelete.length} employee(s).`,
    };
  }

  // ─── Time Off & Leaves ───────────────────────────────────────────────────

  async getLeaveRequests(): Promise<LeaveRequestDto[]> {
    return [
      { id: "lr_1", employeeId: "emp_1", employeeName: "Abdul Aziz", leaveType: "Casual Leave", startDate: "2026-08-20", endDate: "2026-08-22", days: 3, reason: "Family event", status: "Approved", appliedAt: "2026-08-18" },
      { id: "lr_2", employeeId: "emp_3", employeeName: "Abdullah Al Imran", leaveType: "Sick Leave", startDate: "2026-08-19", endDate: "2026-08-20", days: 2, reason: "Medical appointment", status: "Pending", appliedAt: "2026-08-19" },
    ];
  }

  // ─── Attendance ───────────────────────────────────────────────────────────

  async getAttendanceLogs(): Promise<AttendanceLogDto[]> {
    return [
      { id: "att_1", employeeId: "emp_1", employeeName: "Abdul Aziz", date: "2026-08-19", checkIn: "08:55 AM", checkOut: "05:02 PM", status: "On-Time", location: "Rupsha Branch", deviceType: "Biometric" },
      { id: "att_2", employeeId: "emp_2", employeeName: "Abdul Mazid", date: "2026-08-19", checkIn: "09:18 AM", checkOut: "06:05 PM", status: "Late", location: "Head Office (Banani)", deviceType: "Mobile Geofence" },
    ];
  }

  // ─── Appraisals ───────────────────────────────────────────────────────────

  async getAppraisals(): Promise<AppraisalDto[]> {
    return [
      { id: "app_1", employeeId: "emp_2", employeeName: "Abdul Mazid", department: "Digital School Program", period: "Annual 2025-2026", selfRating: 4.5, managerRating: 4.8, status: "Completed" },
      { id: "app_2", employeeId: "emp_3", employeeName: "Abdullah Al Imran", department: "Communications", period: "Annual 2025-2026", selfRating: 4.2, managerRating: 4.0, status: "Submitted" },
    ];
  }

  // ─── Payroll ──────────────────────────────────────────────────────────────

  async getPayroll(): Promise<PayrollEntryDto[]> {
    return [
      { id: "pay_1", employeeId: "emp_1", employeeName: "Abdul Aziz", month: "August 2026", basicSalary: 18000, allowances: 4500, deductions: 1200, netPay: 21300, status: "Processed" },
      { id: "pay_2", employeeId: "emp_2", employeeName: "Abdul Mazid", month: "August 2026", basicSalary: 65000, allowances: 15000, deductions: 4500, netPay: 75500, status: "Disbursed" },
    ];
  }

  // ─── Requests ─────────────────────────────────────────────────────────────

  async getRequests(): Promise<HRRequestDto[]> {
    return [
      { id: "req_1", employeeId: "emp_3", employeeName: "Abdullah Al Imran", requestType: "NOC", details: "International Travel to Bangkok for Conference", status: "Approved", submittedAt: "2026-08-15" },
      { id: "req_2", employeeId: "emp_4", employeeName: "Abdullah Al Yousuf", requestType: "Salary Certificate", details: "Bank Loan Verification", status: "Submitted", submittedAt: "2026-08-18" },
    ];
  }

  // ─── Announcements ────────────────────────────────────────────────────────

  async getAnnouncements(): Promise<AnnouncementDto[]> {
    return [
      { id: "ann_1", title: "Annual Foundation Day Celebration & Townhall", category: "Event", content: "All employees from JAAGO Foundation, Trust, UK and US chapters are invited to our annual celebration.", publishedAt: "2026-08-15", targetDepartment: "All Departments", author: "Executive Leadership" },
      { id: "ann_2", title: "Updated Health & Group Insurance Policy 2026", category: "Policy", content: "New coverage limits and cashless hospital network updated under Pragati Life Insurance.", publishedAt: "2026-08-10", targetDepartment: "Human Resources", author: "People Partner" },
    ];
  }
}
