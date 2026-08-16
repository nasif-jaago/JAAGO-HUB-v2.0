import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import {
  offices,
  departments,
  users,
  employees,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  invitations,
  sessions,
} from "../src/schema/identity/index.js";

describe("Identity & Access Management (IAM) Schemas", () => {
  it("defines offices table with mandatory orgId and code", () => {
    const cols = getTableColumns(offices);
    expect(cols.id).toBeDefined();
    expect(cols.orgId).toBeDefined();
    expect(cols.code).toBeDefined();
    expect(cols.isActive).toBeDefined();
  });

  it("defines departments table with hierarchical parent relationship", () => {
    const cols = getTableColumns(departments);
    expect(cols.id).toBeDefined();
    expect(cols.orgId).toBeDefined();
    expect(cols.parentDepartmentId).toBeDefined();
    expect(cols.code).toBeDefined();
  });

  it("defines users table with Supabase auth linking and security columns", () => {
    const cols = getTableColumns(users);
    expect(cols.supabaseUserId).toBeDefined();
    expect(cols.email).toBeDefined();
    expect(cols.mfaEnabled).toBeDefined();
    expect(cols.failedLoginAttempts).toBeDefined();
  });

  it("defines employees table with full HR lifecycle attributes", () => {
    const cols = getTableColumns(employees);
    expect(cols.orgId).toBeDefined();
    expect(cols.userId).toBeDefined();
    expect(cols.employeeCode).toBeDefined();
    expect(cols.officeId).toBeDefined();
    expect(cols.departmentId).toBeDefined();
    expect(cols.reportsToEmployeeId).toBeDefined();
  });

  it("defines RBAC tables (roles, permissions, rolePermissions, userRoles)", () => {
    const roleCols = getTableColumns(roles);
    const permCols = getTableColumns(permissions);
    const rpCols = getTableColumns(rolePermissions);
    const urCols = getTableColumns(userRoles);

    expect(roleCols.code).toBeDefined();
    expect(permCols.code).toBeDefined();
    expect(rpCols.roleId).toBeDefined();
    expect(rpCols.permissionId).toBeDefined();
    expect(urCols.userId).toBeDefined();
    expect(urCols.roleId).toBeDefined();
    expect(urCols.orgId).toBeDefined();
  });

  it("defines invitations and sessions tables", () => {
    const invCols = getTableColumns(invitations);
    const sessCols = getTableColumns(sessions);

    expect(invCols.tokenHash).toBeDefined();
    expect(invCols.expiresAt).toBeDefined();
    expect(sessCols.refreshTokenHash).toBeDefined();
    expect(sessCols.isRevoked).toBeDefined();
  });
});
