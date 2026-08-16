import { pgTable, uuid, varchar, text, boolean, timestamp, integer, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { organizations } from "../system/organizations.js";

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    parentDepartmentId: uuid("parent_department_id").references((): AnyPgColumn => departments.id, { onDelete: "set null" }),
    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(), // e.g. 'HR', 'FIN', 'EDU', 'OPS'
    description: text("description"),
    headEmployeeId: uuid("head_employee_id"), // linked to employees.id
    isActive: boolean("is_active").notNull().default(true),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_departments_org_id").on(t.orgId),
    index("idx_departments_code").on(t.orgId, t.code),
    index("idx_departments_parent").on(t.parentDepartmentId),
    index("idx_departments_is_active").on(t.orgId, t.isActive),
  ],
);

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
