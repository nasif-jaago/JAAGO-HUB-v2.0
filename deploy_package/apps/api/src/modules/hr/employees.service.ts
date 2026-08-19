import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import type {
  EmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from "./dto/hr.dto.js";

@Injectable()
export class EmployeesService {
  private readonly employees: EmployeeDto[] = [];
  private sequenceCounter = 1000;

  constructor() {
    this.seedDefaultEmployees();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultEmployees(): void {
    const orgId = "00000000-0000-0000-0000-000000000000";

    this.employees.push(
      {
        id: "emp_1",
        orgId,
        employeeCode: "EMP-1001",
        userId: "00000000-0000-0000-0000-000000000001",
        firstName: "Nasif",
        lastName: "Kamal",
        fullName: "Nasif Kamal",
        officialEmail: "admin@jaago.com.bd",
        phoneNumber: "+880 1711-000111",
        nidOrPassport: "19922692600001111",
        joiningDate: "2020-01-15",
        departmentId: "dept_hq",
        departmentName: "Executive Leadership",
        officeId: "off_dhk",
        officeName: "Dhaka HQ",
        designation: "Executive Director",
        employmentType: "FULL_TIME",
        employmentStatus: "ACTIVE",
        salaryGrade: "Grade-1",
        emergencyContactName: "Ayesha Kamal",
        emergencyContactPhone: "+880 1711-000112",
        createdAt: "2020-01-15T00:00:00.000Z",
      },
      {
        id: "emp_2",
        orgId,
        employeeCode: "EMP-1002",
        userId: "00000000-0000-0000-0000-000000000002",
        firstName: "Salma",
        lastName: "Khatun",
        fullName: "Salma Khatun",
        officialEmail: "salma.khatun@jaago.com.bd",
        phoneNumber: "+880 1819-222333",
        nidOrPassport: "19952692600002222",
        joiningDate: "2022-03-01",
        departmentId: "dept_edu",
        departmentName: "Education & Schools",
        officeId: "off_raj",
        officeName: "Rajshahi School Branch",
        designation: "Senior Project Officer",
        employmentType: "FULL_TIME",
        employmentStatus: "ACTIVE",
        reportingManagerId: "emp_1",
        reportingManagerName: "Nasif Kamal",
        salaryGrade: "Grade-4",
        emergencyContactName: "Rafiqul Islam",
        emergencyContactPhone: "+880 1819-222334",
        createdAt: "2022-03-01T00:00:00.000Z",
      },
      {
        id: "emp_3",
        orgId,
        employeeCode: "EMP-1003",
        firstName: "Tanvir",
        lastName: "Ahmed",
        fullName: "Tanvir Ahmed",
        officialEmail: "tanvir.ahmed@jaago.com.bd",
        phoneNumber: "+880 1912-333444",
        nidOrPassport: "19942692600003333",
        joiningDate: "2023-07-10",
        departmentId: "dept_fin",
        departmentName: "Finance & Accounts",
        officeId: "off_dhk",
        officeName: "Dhaka HQ",
        designation: "Finance Officer",
        employmentType: "FULL_TIME",
        employmentStatus: "ACTIVE",
        reportingManagerId: "emp_1",
        reportingManagerName: "Nasif Kamal",
        salaryGrade: "Grade-5",
        emergencyContactName: "Fatema Ahmed",
        emergencyContactPhone: "+880 1912-333445",
        createdAt: "2023-07-10T00:00:00.000Z",
      },
      {
        id: "emp_4",
        orgId,
        employeeCode: "EMP-1004",
        firstName: "Rehana",
        lastName: "Parvin",
        fullName: "Rehana Parvin",
        officialEmail: "rehana.parvin@jaago.com.bd",
        phoneNumber: "+880 1610-444555",
        nidOrPassport: "19962692600004444",
        joiningDate: "2024-02-01",
        departmentId: "dept_edu",
        departmentName: "Education & Schools",
        officeId: "off_ctg",
        officeName: "Chittagong School Branch",
        designation: "Branch Teacher Lead",
        employmentType: "FULL_TIME",
        employmentStatus: "ACTIVE",
        reportingManagerId: "emp_2",
        reportingManagerName: "Salma Khatun",
        salaryGrade: "Grade-6",
        createdAt: "2024-02-01T00:00:00.000Z",
      },
    );
  }

  getEmployees(
    orgId: string,
    filters?: {
      search?: string | undefined;
      department?: string | undefined;
      office?: string | undefined;
      status?: string | undefined;
      limit?: number | undefined;
    },
  ): { items: EmployeeDto[]; total: number } {
    const limit = Math.min(Math.max(filters?.limit || 50, 1), 200);

    let result = this.employees.filter((e) => e.orgId === orgId);

    if (filters?.department) {
      result = result.filter((e) => e.departmentName.toLowerCase().includes(filters.department!.toLowerCase()));
    }
    if (filters?.office) {
      result = result.filter((e) => e.officeName.toLowerCase().includes(filters.office!.toLowerCase()));
    }
    if (filters?.status) {
      result = result.filter((e) => e.employmentStatus === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.officialEmail.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q),
      );
    }

    return {
      items: result.slice(0, limit),
      total: result.length,
    };
  }

  getEmployeeById(orgId: string, id: string): EmployeeDto {
    const emp = this.employees.find((e) => (e.id === id || e.employeeCode === id) && e.orgId === orgId);
    if (!emp) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return emp;
  }

  createEmployee(orgId: string, dto: CreateEmployeeDto): EmployeeDto {
    const existing = this.employees.find(
      (e) => e.orgId === orgId && (e.officialEmail.toLowerCase() === dto.officialEmail.toLowerCase() || e.nidOrPassport === dto.nidOrPassport),
    );
    if (existing) {
      throw new BadRequestException("An employee with this official email or NID/Passport already exists");
    }

    this.sequenceCounter += 1;
    const employeeCode = `EMP-${this.sequenceCounter}`;
    const id = `emp_${Date.now().toString(36)}`;
    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    const newEmp: EmployeeDto = {
      id,
      orgId,
      employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      fullName,
      officialEmail: dto.officialEmail.toLowerCase().trim(),
      personalEmail: dto.personalEmail,
      phoneNumber: dto.phoneNumber,
      nidOrPassport: dto.nidOrPassport,
      joiningDate: dto.joiningDate,
      departmentId: `dept_${dto.departmentName.toLowerCase().replace(/\s+/g, "_")}`,
      departmentName: dto.departmentName,
      officeId: `off_${dto.officeName.toLowerCase().replace(/\s+/g, "_")}`,
      officeName: dto.officeName,
      designation: dto.designation,
      employmentType: dto.employmentType || "FULL_TIME",
      employmentStatus: dto.employmentStatus || "ACTIVE",
      reportingManagerName: dto.reportingManagerName,
      salaryGrade: dto.salaryGrade,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      createdAt: new Date().toISOString(),
    };

    this.employees.push(newEmp);
    this.safeLog({ orgId, employeeId: id, code: employeeCode }, `Enrolled new employee master profile: ${fullName}`);
    return newEmp;
  }

  updateEmployee(orgId: string, id: string, dto: UpdateEmployeeDto): EmployeeDto {
    const emp = this.getEmployeeById(orgId, id);

    if (dto.firstName !== undefined) emp.firstName = dto.firstName;
    if (dto.lastName !== undefined) emp.lastName = dto.lastName;
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      emp.fullName = `${emp.firstName} ${emp.lastName}`.trim();
    }
    if (dto.phoneNumber !== undefined) emp.phoneNumber = dto.phoneNumber;
    if (dto.departmentName !== undefined) emp.departmentName = dto.departmentName;
    if (dto.officeName !== undefined) emp.officeName = dto.officeName;
    if (dto.designation !== undefined) emp.designation = dto.designation;
    if (dto.employmentStatus !== undefined) emp.employmentStatus = dto.employmentStatus;
    if (dto.salaryGrade !== undefined) emp.salaryGrade = dto.salaryGrade;
    if (dto.emergencyContactName !== undefined) emp.emergencyContactName = dto.emergencyContactName;
    if (dto.emergencyContactPhone !== undefined) emp.emergencyContactPhone = dto.emergencyContactPhone;

    this.safeLog({ orgId, employeeId: id }, `Updated employee record: ${emp.fullName}`);
    return emp;
  }

  getStats(orgId: string): { totalHeadcount: number; activeCount: number; onLeaveCount: number; branchCount: number } {
    const orgEmployees = this.employees.filter((e) => e.orgId === orgId);
    const uniqueBranches = new Set(orgEmployees.map((e) => e.officeName));

    return {
      totalHeadcount: orgEmployees.length,
      activeCount: orgEmployees.filter((e) => e.employmentStatus === "ACTIVE").length,
      onLeaveCount: orgEmployees.filter((e) => e.employmentStatus === "ON_LEAVE").length,
      branchCount: uniqueBranches.size,
    };
  }
}
