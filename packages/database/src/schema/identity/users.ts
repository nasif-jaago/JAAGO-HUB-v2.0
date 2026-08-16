import { pgTable, uuid, varchar, text, boolean, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "../system/organizations.js";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supabaseUserId: uuid("supabase_user_id").notNull(), // Foreign key to auth.users.id
    defaultOrgId: uuid("default_org_id").references(() => organizations.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 150 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 30 }),
    avatarUrl: text("avatar_url"),
    status: varchar("status", { length: 30 }).notNull().default("active"), // 'active', 'invited', 'suspended', 'deactivated'
    isSuperAdmin: boolean("is_super_admin").notNull().default(false),
    mfaEnabled: boolean("mfa_enabled").notNull().default(false),
    mfaEnforced: boolean("mfa_enforced").notNull().default(false),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    lastLoginIp: varchar("last_login_ip", { length: 45 }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("idx_users_supabase_user_id").on(t.supabaseUserId),
    uniqueIndex("idx_users_email").on(t.email),
    index("idx_users_default_org_id").on(t.defaultOrgId),
    index("idx_users_status").on(t.status),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
