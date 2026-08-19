import { describe, it, expect } from "vitest";
import {
  loginSchema,
  createEmployeeSchema,
  createLeaveRequestSchema,
  createPurchaseRequestSchema,
} from "../src/index.js";
import { EmploymentType } from "@jaago/shared-types";

describe("Shared Validation Schemas (Zod)", () => {
  it("validates login schema correctly", () => {
    const valid = loginSchema.safeParse({
      email: "nasif@jaago.com.bd",
      password: "password123",
    });
    expect(valid.success).toBe(true);

    const invalidEmail = loginSchema.safeParse({
      email: "not-an-email",
      password: "pass",
    });
    expect(invalidEmail.success).toBe(false);
  });

  it("validates employee creation schema", () => {
    const valid = createEmployeeSchema.safeParse({
      fullName: "Nasif Kamal",
      departmentId: "11111111-2222-3333-4444-555555555555",
      officeId: "22222222-3333-4444-5555-666666666666",
      designationId: "33333333-4444-5555-6666-777777777777",
      phone: "+8801700000000",
      employmentType: EmploymentType.FULL_TIME,
      joinDate: "2026-08-01",
    });
    expect(valid.success).toBe(true);

    const missingName = createEmployeeSchema.safeParse({
      departmentId: "11111111-2222-3333-4444-555555555555",
    });
    expect(missingName.success).toBe(false);
  });

  it("validates leave request schema", () => {
    const valid = createLeaveRequestSchema.safeParse({
      leaveTypeId: "11111111-2222-3333-4444-555555555555",
      fromDate: "2026-08-20",
      toDate: "2026-08-22",
      reason: "Annual family trip",
    });
    expect(valid.success).toBe(true);

    const invalidDateOrder = createLeaveRequestSchema.safeParse({
      leaveTypeId: "11111111-2222-3333-4444-555555555555",
      fromDate: "2026-08-25",
      toDate: "2026-08-20",
    });
    expect(invalidDateOrder.success).toBe(false);
  });

  it("validates procurement purchase request schema", () => {
    const valid = createPurchaseRequestSchema.safeParse({
      purpose: "Classroom Supplies for Sylhet School Operations",
      departmentId: "11111111-2222-3333-4444-555555555555",
      lineItems: [
        {
          description: "Whiteboard Markers (Pack of 12)",
          quantity: 50,
          unit: "box",
        },
      ],
    });
    expect(valid.success).toBe(true);
  });
});
