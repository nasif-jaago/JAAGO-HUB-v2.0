import { describe, it, expect, beforeEach } from "vitest";
import { EmployeesService } from "../src/modules/hr/employees.service.js";
import { RecruitmentService } from "../src/modules/recruitment/recruitment.service.js";
import { RecruitmentController } from "../src/modules/recruitment/recruitment.controller.js";

describe("Recruitment & ATS Module", () => {
  let employeesService: EmployeesService;
  let recruitmentService: RecruitmentService;
  let recruitmentController: RecruitmentController;
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = { tenant: { orgId: mockOrgId }, headers: {} };

  beforeEach(() => {
    employeesService = new EmployeesService();
    recruitmentService = new RecruitmentService(employeesService);
    recruitmentController = new RecruitmentController(recruitmentService);
  });

  it("lists active job opening requisitions and summary statistics", () => {
    const jobs = recruitmentController.getJobs(mockReq);
    expect(jobs.length).toBeGreaterThanOrEqual(3);

    const stats = recruitmentController.getStats(mockReq);
    expect(stats.openPositions).toBeGreaterThan(0);
    expect(stats.totalApplicants).toBeGreaterThanOrEqual(3);
  });

  it("creates a new job opening position", () => {
    const created = recruitmentController.createJob(mockReq, {
      jobTitle: "Assistant Accountant",
      departmentName: "Finance & Accounts",
      officeLocation: "Dhaka HQ (Banani)",
      vacancies: 1,
      experienceRequired: "1-2 Years in Tally / ERP",
      salaryRange: "BDT 30,000 - 38,000",
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("OPEN");
  });

  it("advances candidate through ATS pipeline stages", () => {
    const candidate = recruitmentController.updateCandidateStage("cand_1", mockReq, {
      stage: "OFFERED",
      interviewerNotes: "Candidate passed final interview with Country Director",
    });

    expect(candidate.stage).toBe("OFFERED");
    expect(candidate.interviewerNotes).toContain("Country Director");
  });

  it("converts hired candidate directly into employee master profile", () => {
    const res = recruitmentController.onboardCandidate("cand_2", mockReq, {
      joiningDate: "2026-09-01",
      salaryGrade: "Grade-4",
    });

    expect(res.success).toBe(true);
    expect(res.candidate.stage).toBe("HIRED");
    expect(res.employee.employeeCode).toMatch(/^EMP-\d+/);
    expect(res.employee.fullName).toBe("Mahmudul Hasan");

    // Verify employee exists in Employees directory
    const emp = employeesService.getEmployeeById(mockOrgId, res.employee.id);
    expect(emp.fullName).toBe("Mahmudul Hasan");
  });
});
