import { pgTable, uuid, varchar, text, date, timestamp, integer, index, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { organizations } from "../system/organizations.js";
import { offices } from "./offices.js";
import { departments } from "./departments.js";
import { users } from "./users.js";

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // linked login user account
    employeeCode: varchar("employee_code", { length: 50 }).notNull(), // e.g. 'JF-00124'
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    banglaName: varchar("bangla_name", { length: 150 }),
    email: varchar("email", { length: 255 }).notNull(),
    personalEmail: varchar("personal_email", { length: 255 }),
    phone: varchar("phone", { length: 30 }).notNull(),
    dateOfBirth: date("date_of_birth"),
    gender: varchar("gender", { length: 20 }), // 'male', 'female', 'other'
    bloodGroup: varchar("blood_group", { length: 10 }), // 'A+', 'O+', etc.
    nid: varchar("nid", { length: 50 }), // National ID
    passportNumber: varchar("passport_number", { length: 50 }),

    // Employment structure
    officeId: uuid("office_id").notNull().references(() => offices.id, { onDelete: "restrict" }),
    departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "restrict" }),
    designation: varchar("designation", { length: 100 }).notNull(),
    employmentType: varchar("employment_type", { length: 30 }).notNull().default("full_time"), // 'full_time', 'part_time', 'contractual', 'intern'
    employmentStatus: varchar("employment_status", { length: 30 }).notNull().default("active"), // 'active', 'probation', 'notice_period', 'resigned', 'terminated'
    reportsToEmployeeId: uuid("reports_to_employee_id").references((): AnyPgColumn => employees.id, { onDelete: "set null" }),

    joinDate: date("join_date").notNull(),
    confirmationDate: date("confirmation_date"),
    resignationDate: date("resignation_date"),
    lastWorkingDay: date("last_working_day"),

    // Address & details
    presentAddress: text("present_address"),
    permanentAddress: text("permanent_address"),
    emergencyContactName: varchar("emergency_contact_name", { length: 150 }),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 30 }),
    emergencyContactRelation: varchar("emergency_contact_relation", { length: 50 }),

    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("idx_employees_org_code").on(t.orgId, t.employeeCode),
    uniqueIndex("idx_employees_org_email").on(t.orgId, t.email),
    index("idx_employees_org_id").on(t.orgId),
    index("idx_employees_user_id").on(t.userId),
    index("idx_employees_dept_id").on(t.departmentId),
    index("idx_employees_office_id").on(t.officeId),
    index("idx_employees_reports_to").on(t.reportsToEmployeeId),
    index("idx_employees_status").on(t.orgId, t.employmentStatus),
  ],
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
