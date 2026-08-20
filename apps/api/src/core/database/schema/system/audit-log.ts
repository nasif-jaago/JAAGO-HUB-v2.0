import { pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { primaryKeyColumn, tenantColumn } from "../common.js";

export const auditLogs = pgTable("audit_log", {
  ...primaryKeyColumn,
  ...tenantColumn,
  userId: uuid("user_id").notNull(),
  action: text("action").notNull(),
  module: text("module").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  metadata: jsonb("metadata"),
  // Hash chain fields for tamper-evidence
  prevHash: text("prev_hash"),
  rowHash: text("row_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
