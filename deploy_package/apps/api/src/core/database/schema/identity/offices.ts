import { pgTable, uuid, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { organizations } from "../system/organizations.js";

export const offices = pgTable(
  "offices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(), // e.g. 'HQ-01', 'DHK-01'
    officeType: varchar("office_type", { length: 50 }).notNull().default("branch"), // 'hq', 'school', 'branch', 'hub'
    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull().default("Dhaka"),
    division: varchar("division", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 2 }).notNull().default("BD"),
    contactPhone: varchar("contact_phone", { length: 30 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_offices_org_id").on(t.orgId),
    index("idx_offices_code").on(t.orgId, t.code),
    index("idx_offices_is_active").on(t.orgId, t.isActive),
  ],
);

export type Office = typeof offices.$inferSelect;
export type NewOffice = typeof offices.$inferInsert;
