import { pgTable, text, jsonb } from "drizzle-orm/pg-core";
import { primaryKeyColumn, auditColumns, softDeleteColumn } from "../common.js";

export const organizations = pgTable("organizations", {
  ...primaryKeyColumn,
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  legalName: text("legal_name"),
  registrationNumber: text("registration_number"),
  countryCode: text("country_code").notNull().default("BD"),
  currencyCode: text("currency_code").notNull().default("BDT"),
  settings: jsonb("settings").default({}),
  ...auditColumns,
  ...softDeleteColumn,
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
