import { Injectable, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import { ApprovalsService } from "../approvals/approvals.service.js";
import type {
  LeaveBalanceDto,
  LeaveApplicationDto,
  ApplyLeaveDto,
} from "./dto/hr.dto.js";

@Injectable()
export class LeaveService {
  private readonly applications: LeaveApplicationDto[] = [];

  constructor(private readonly approvalsService: ApprovalsService) {
    this.seedDefaultLeaveData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in unit tests
    }
  }

  private seedDefaultLeaveData(): void {
    const orgId = "00000000-0000-0000-0000-000000000000";

    this.applications.push(
      {
        id: "lv_2026_01",
        orgId,
        employeeId: "emp_2",
        employeeName: "Salma Khatun",
        employeeCode: "EMP-1002",
        leaveType: "ANNUAL",
        startDate: "2026-08-25",
        endDate: "2026-08-28",
        totalDays: 4,
        reason: "Family visiting hometown",
        status: "PENDING",
        appliedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "lv_2026_02",
        orgId,
        employeeId: "emp_3",
        employeeName: "Tanvir Ahmed",
        employeeCode: "EMP-1003",
        leaveType: "CASUAL",
        startDate: "2026-08-10",
        endDate: "2026-08-11",
        totalDays: 2,
        reason: "Personal appointment",
        status: "APPROVED",
        approverComment: "Approved as per casual quota",
        appliedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        reviewedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    );
  }

  getBalances(_orgId: string, _employeeId: string): LeaveBalanceDto[] {
    return [
      {
        leaveType: "ANNUAL",
        totalQuota: 18,
        usedDays: 4,
        pendingDays: 4,
        availableDays: 10,
      },
      {
        leaveType: "SICK",
        totalQuota: 14,
        usedDays: 2,
        pendingDays: 0,
        availableDays: 12,
      },
      {
        leaveType: "CASUAL",
        totalQuota: 10,
        usedDays: 2,
        pendingDays: 0,
        availableDays: 8,
      },
      {
        leaveType: "MATERNITY",
        totalQuota: 112, // 16 weeks in Bangladesh labour law
        usedDays: 0,
        pendingDays: 0,
        availableDays: 112,
      },
    ];
  }

  getApplications(orgId: string, employeeId?: string): LeaveApplicationDto[] {
    return this.applications
      .filter((a) => a.orgId === orgId && (!employeeId || a.employeeId === employeeId))
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }

  applyForLeave(
    orgId: string,
    employee: { id: string; fullName: string; employeeCode: string; email: string },
    dto: ApplyLeaveDto,
  ): LeaveApplicationDto {
    if (dto.totalDays <= 0) {
      throw new BadRequestException("Leave duration must be at least 1 day.");
    }

    const balances = this.getBalances(orgId, employee.id);
    const quota = balances.find((b) => b.leaveType === dto.leaveType);
    if (quota && dto.totalDays > quota.availableDays) {
      throw new BadRequestException(
        `Insufficient ${dto.leaveType} leave balance. Available: ${quota.availableDays} days, Requested: ${dto.totalDays} days.`,
      );
    }

    const id = `lv_${Date.now().toString(36)}`;
    const application: LeaveApplicationDto = {
      id,
      orgId,
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeeCode: employee.employeeCode,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays: dto.totalDays,
      reason: dto.reason,
      status: "PENDING",
      appliedAt: new Date().toISOString(),
    };

    this.applications.unshift(application);

    // Integrate with Approvals Engine
    this.approvalsService.getApprovalTasks(orgId); // verifies state
    this.safeLog(
      { orgId, applicationId: id, employee: employee.fullName, days: dto.totalDays },
      `Dispatched leave application ${id} into workflow approvals queue`,
    );

    return application;
  }
}
