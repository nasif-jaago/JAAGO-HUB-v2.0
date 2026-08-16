import { pgTable, uuid, varchar, text, boolean, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "../system/organizations.js";
import { users } from "./users.js";

/** System Permissions Table (Global catalog of actions) */
export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 100 }).notNull().unique(), // e.g. 'hr.employee.view', 'finance.payment.approve'
    module: varchar("module", { length: 50 }).notNull(), // 'hr', 'finance', 'procurement', 'admin'
    entity: varchar("entity", { length: 50 }).notNull(), // 'employee', 'leave', 'voucher', 'po'
    action: varchar("action", { length: 50 }).notNull(), // 'view', 'create', 'update', 'delete', 'approve', 'export'
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_permissions_code").on(t.code),
    index("idx_permissions_module").on(t.module),
  ],
);

/** Roles Table (Tenant-scoped or Global templates) */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }), // null for system-wide default roles
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(), // e.g. 'super_admin', 'hr_manager', 'employee'
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_roles_org_id").on(t.orgId),
    uniqueIndex("idx_roles_org_code").on(t.orgId, t.code),
  ],
);

/** Role Permissions Mapping */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_role_permissions_unique").on(t.roleId, t.permissionId),
    index("idx_role_permissions_role_id").on(t.roleId),
  ],
);

/** User Roles Mapping (Tenant Contextual RBAC) */
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_user_roles_unique").on(t.userId, t.roleId, t.orgId),
    index("idx_user_roles_user_org").on(t.userId, t.orgId),
    index("idx_user_roles_org_role").on(t.orgId, t.roleId),
  ],
);

export type Permission = typeof permissions.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
