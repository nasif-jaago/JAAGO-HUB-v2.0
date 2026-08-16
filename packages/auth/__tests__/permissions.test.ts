import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  hasRole,
  requireRole,
  ForbiddenError,
  UnauthorizedError,
} from "../src/permissions.js";
import { UserStatus, type AuthUser } from "@jaago/shared-types";

describe("Permissions & Roles Helpers", () => {
  const normalUser: AuthUser = {
    id: "u_1",
    email: "officer@jaago.com.bd",
    orgId: "org_1",
    status: UserStatus.ACTIVE,
    roles: ["Officer", "Employee"],
    permissions: ["hr.leave.view", "hr.leave.apply"],
    mfaEnabled: false,
  };

  const superAdminUser: AuthUser = {
    id: "u_admin",
    email: "admin@jaago.com.bd",
    orgId: "org_1",
    status: UserStatus.ACTIVE,
    roles: ["SuperAdmin"],
    permissions: [],
    mfaEnabled: true,
  };

  it("checks single permission correctly", () => {
    expect(hasPermission(normalUser, "hr.leave.view")).toBe(true);
    expect(hasPermission(normalUser, "hr.leave.apply")).toBe(true);
    expect(hasPermission(normalUser, "finance.budget.approve")).toBe(false);
  });

  it("grants all permissions to super_admin / SuperAdmin", () => {
    expect(hasPermission(superAdminUser, "any.arbitrary.permission")).toBe(true);
    expect(hasPermission(superAdminUser, "finance.budget.approve")).toBe(true);
  });

  it("checks hasAnyPermission correctly", () => {
    expect(hasAnyPermission(normalUser, ["finance.budget.approve", "hr.leave.view"])).toBe(true);
    expect(hasAnyPermission(normalUser, ["finance.budget.approve", "procurement.order.create"])).toBe(false);
  });

  it("checks hasAllPermissions correctly", () => {
    expect(hasAllPermissions(normalUser, ["hr.leave.view", "hr.leave.apply"])).toBe(true);
    expect(hasAllPermissions(normalUser, ["hr.leave.view", "finance.budget.approve"])).toBe(false);
  });

  it("requirePermission succeeds for valid permissions and throws ForbiddenError for missing", () => {
    expect(() => requirePermission(normalUser, "hr.leave.view")).not.toThrow();
    expect(() => requirePermission(normalUser, "finance.budget.approve")).toThrow(ForbiddenError);
    expect(() => requirePermission(null, "hr.leave.view")).toThrow(UnauthorizedError);
  });

  it("checks hasRole and requireRole", () => {
    expect(hasRole(normalUser, "Officer")).toBe(true);
    expect(hasRole(normalUser, "Director")).toBe(false);

    expect(() => requireRole(normalUser, "Officer")).not.toThrow();
    expect(() => requireRole(normalUser, "Director")).toThrow(ForbiddenError);
    expect(() => requireRole(null, "Officer")).toThrow(UnauthorizedError);
  });
});
