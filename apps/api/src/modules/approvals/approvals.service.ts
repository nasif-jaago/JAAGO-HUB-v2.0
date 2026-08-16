import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import type {
  ApprovalTaskDto,
  ApprovalDecisionDto,
  DelegateApprovalDto,
  ApprovalStatsDto,
} from "./dto/approvals.dto.js";

@Injectable()
export class ApprovalsService {
  private readonly tasks: ApprovalTaskDto[] = [];

  constructor() {
    this.seedDefaultApprovalTasks();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in unit tests
    }
  }

  private seedDefaultApprovalTasks(): void {
    const orgId = "00000000-0000-0000-0000-000000000000";

    this.tasks.push(
      {
        id: "appr_101",
        orgId,
        entityType: "LEAVE",
        entityId: "lv_2026_01",
        title: "Annual Leave Request — 4 Days",
        description: "Salma Khatun requested Annual Leave from 2026-08-25 to 2026-08-28",
        requesterId: "00000000-0000-0000-0000-000000000002",
        requesterName: "Salma Khatun",
        requesterEmail: "salma.khatun@jaago.com.bd",
        assignedRole: "HR Manager",
        tierLevel: 1,
        totalTiers: 1,
        amountOrValue: "4 Days (Casual/Annual)",
        status: "PENDING",
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "appr_102",
        orgId,
        entityType: "PURCHASE_REQUISITION",
        entityId: "pr_2026_08_0042",
        title: "Purchase Requisition — Classroom Tablets",
        description: "Procurement of 25 Android learning tablets for Rajshahi branch school",
        requesterId: "00000000-0000-0000-0000-000000000002",
        requesterName: "Field Project Officer",
        requesterEmail: "officer@jaago.com.bd",
        assignedRole: "Finance Officer",
        tierLevel: 1,
        totalTiers: 2,
        amountOrValue: "BDT 350,000",
        status: "PENDING",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: "appr_103",
        orgId,
        entityType: "EXPENSE_VOUCHER",
        entityId: "vch_2026_08_0105",
        title: "Payment Voucher — School Solar Maintenance",
        description: "Quarterly preventative maintenance fee for Bandarban solar power unit",
        requesterId: "00000000-0000-0000-0000-000000000003",
        requesterName: "Operations Lead",
        assignedRole: "Director of Operations",
        tierLevel: 2,
        totalTiers: 2,
        amountOrValue: "BDT 42,500",
        status: "PENDING",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    );
  }

  getApprovalTasks(
    orgId: string,
    filters?: { status?: string | undefined; entityType?: string | undefined },
  ): ApprovalTaskDto[] {
    return this.tasks.filter((t) => {
      if (t.orgId !== orgId) return false;
      if (filters?.status && t.status !== filters.status) return false;
      if (filters?.entityType && t.entityType !== filters.entityType) return false;
      return true;
    });
  }

  getStats(orgId: string): ApprovalStatsDto {
    const tenantTasks = this.tasks.filter((t) => t.orgId === orgId);
    return {
      pendingCount: tenantTasks.filter((t) => t.status === "PENDING").length,
      approvedCount: tenantTasks.filter((t) => t.status === "APPROVED").length,
      rejectedCount: tenantTasks.filter((t) => t.status === "REJECTED").length,
      urgentCount: tenantTasks.filter((t) => t.status === "PENDING" && t.tierLevel > 1).length,
    };
  }

  makeDecision(
    orgId: string,
    taskId: string,
    dto: ApprovalDecisionDto,
    actor: { id: string; name: string },
  ): ApprovalTaskDto {
    const task = this.tasks.find((t) => t.id === taskId && t.orgId === orgId);
    if (!task) {
      throw new NotFoundException(`Approval task ${taskId} not found`);
    }

    if (task.status !== "PENDING") {
      throw new BadRequestException(`Task is already finalized with status '${task.status}'`);
    }

    if (dto.decision === "APPROVED") {
      if (task.tierLevel < task.totalTiers) {
        // Multi-tier progression
        task.tierLevel += 1;
        task.comment = dto.comment;
        task.decisionBy = `${actor.name} (Tier ${task.tierLevel - 1} Approved)`;
        this.safeLog(
          { orgId, taskId, nextTier: task.tierLevel },
          `Approval task ${taskId} advanced to tier ${task.tierLevel}`,
        );
      } else {
        task.status = "APPROVED";
        task.comment = dto.comment;
        task.decisionBy = actor.name;
        task.decisionAt = new Date().toISOString();
        this.safeLog({ orgId, taskId }, `Approval task ${taskId} fully APPROVED`);
      }
    } else {
      task.status = dto.decision === "REJECTED" ? "REJECTED" : "CHANGES_REQUESTED";
      task.comment = dto.comment;
      task.decisionBy = actor.name;
      task.decisionAt = new Date().toISOString();
      this.safeLog({ orgId, taskId, decision: task.status }, `Approval task ${taskId} marked as ${task.status}`);
    }

    return task;
  }

  delegateTask(
    orgId: string,
    taskId: string,
    dto: DelegateApprovalDto,
    actor: { id: string; name: string },
  ): ApprovalTaskDto {
    const task = this.tasks.find((t) => t.id === taskId && t.orgId === orgId);
    if (!task) {
      throw new NotFoundException(`Approval task ${taskId} not found`);
    }

    task.delegatedToId = dto.delegateToUserId;
    task.delegatedToName = dto.delegateToName;
    task.comment = `Delegated by ${actor.name}: ${dto.reason}`;

    this.safeLog(
      { orgId, taskId, delegatedTo: dto.delegateToName },
      `Delegated approval task ${taskId} to ${dto.delegateToName}`,
    );

    return task;
  }
}
