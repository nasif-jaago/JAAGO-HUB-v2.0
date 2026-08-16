import { describe, it, expect, beforeEach } from "vitest";
import { EmployeesService } from "../src/modules/hr/employees.service.js";
import { LeaveService } from "../src/modules/hr/leave.service.js";
import { ApprovalsService } from "../src/modules/approvals/approvals.service.js";
import { HrController } from "../src/modules/hr/hr.controller.js";

describe("HR & Leave Management Module", () => {
  let empService: EmployeesService;
  let approvalsService: ApprovalsService;
  let leaveService: LeaveService;
  let hrController: HrController;
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = { tenant: { orgId: mockOrgId }, user: { id: "emp_2", displayName: "Salma Khatun" }, headers: {} };

  beforeEach(() => {
    empService = new EmployeesService();
    approvalsService = new ApprovalsService();
    leaveService = new LeaveService(approvalsService);
    hrController = new HrController(empService, leaveService);
  });

  describe("Employee Directory CRUD & Stats", () => {
    it("returns list of employees with search and stats", () => {
      const res = hrController.getEmployees(mockReq);
      expect(res.items.length).toBeGreaterThanOrEqual(4);
      expect(res.total).toBeGreaterThanOrEqual(4);

      const stats = hrController.getStats(mockReq);
      expect(stats.totalHeadcount).toBeGreaterThanOrEqual(4);
      expect(stats.branchCount).toBeGreaterThanOrEqual(2);
    });

    it("creates a new employee with auto-assigned employee code", () => {
      const created = hrController.createEmployee(mockReq, {
        firstName: "Jannatul",
        lastName: "Ferdous",
        officialEmail: "jannat.ferdous@jaago.com.bd",
        phoneNumber: "+880 1711-998877",
        nidOrPassport: "19982692600009999",
        joiningDate: "2026-08-01",
        departmentName: "Education & Schools",
        officeName: "Habiganj School Branch",
        designation: "Assistant Teacher",
      });

      expect(created.id).toBeDefined();
      expect(created.employeeCode).toMatch(/^EMP-\d+/);
      expect(created.fullName).toBe("Jannatul Ferdous");

      const retrieved = hrController.getEmployeeById(created.id, mockReq);
      expect(retrieved.officialEmail).toBe("jannat.ferdous@jaago.com.bd");
    });
  });

  describe("Leave Quota & Application Submission", () => {
    it("returns available leave balances", () => {
      const balances = hrController.getLeaveBalances(mockReq);
      expect(balances.length).toBeGreaterThanOrEqual(3);

      const annual = balances.find((b) => b.leaveType === "ANNUAL");
      expect(annual?.totalQuota).toBe(18);
      expect(annual?.availableDays).toBe(10);
    });

    it("allows applying for leave when balance is sufficient", () => {
      const applied = hrController.applyForLeave(mockReq, {
        leaveType: "CASUAL",
        startDate: "2026-09-10",
        endDate: "2026-09-11",
        totalDays: 2,
        reason: "Personal leave",
      });

      expect(applied.id).toBeDefined();
      expect(applied.status).toBe("PENDING");
      expect(applied.employeeName).toBe("Salma Khatun");
    });

    it("rejects leave application when requested days exceed quota", () => {
      expect(() => {
        hrController.applyForLeave(mockReq, {
          leaveType: "CASUAL",
          startDate: "2026-09-10",
          endDate: "2026-09-30",
          totalDays: 20, // available is 8
          reason: "Excessive request",
        });
      }).toThrow("Insufficient CASUAL leave balance");
    });
  });
});
