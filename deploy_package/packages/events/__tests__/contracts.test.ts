import { describe, it, expect } from "vitest";
import { SYSTEM_MODULES } from "@jaago/shared-types";
import type {
  LeaveAppliedEvent,
  RequisitionSubmittedEvent,
  VoucherPostedEvent,
} from "../src/contracts/domain-contracts.js";

describe("Module Registry & Domain Event Contracts", () => {
  it("defines comprehensive module catalog with core and domain slices", () => {
    expect(SYSTEM_MODULES.length).toBeGreaterThanOrEqual(10);

    const hrModule = SYSTEM_MODULES.find((m) => m.code === "hr.employees");
    expect(hrModule).toBeDefined();
    expect(hrModule?.routeBase).toBe("/hr/employees");

    const approvalsModule = SYSTEM_MODULES.find((m) => m.code === "core.approvals");
    expect(approvalsModule).toBeDefined();
  });

  it("constructs type-safe domain events with correlation and tenant metadata", () => {
    const leaveEvent: LeaveAppliedEvent = {
      id: "evt_101",
      eventName: "hr.leave.applied",
      aggregateId: "lv_501",
      aggregateType: "leave_application",
      orgId: "00000000-0000-0000-0000-000000000000",
      correlationId: "cor_test_123",
      payload: {
        leaveApplicationId: "lv_501",
        employeeId: "emp_10",
        leaveType: "Casual Leave",
        startDate: "2026-08-20",
        endDate: "2026-08-21",
        days: 2,
      },
      occurredAt: new Date().toISOString(),
      version: 1,
    };

    expect(leaveEvent.eventName).toBe("hr.leave.applied");
    expect(leaveEvent.payload.days).toBe(2);
  });
});
