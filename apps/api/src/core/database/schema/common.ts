import { uuid, timestamp, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Standard primary key column helper.
 */
export const primaryKeyColumn = {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
};

/**
 * Standard tenant isolation column helper.
 */
export const tenantColumn = {
  orgId: uuid("org_id").notNull(),
};

/**
 * Standard audit tracking columns helper.
 */
export const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

/**
 * Standard soft-delete column helper.
 */
export const softDeleteColumn = {
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
};

/**
 * Standard reference number column helper.
 */
export const referenceNumberColumn = {
  referenceNumber: text("reference_number").notNull(),
};
