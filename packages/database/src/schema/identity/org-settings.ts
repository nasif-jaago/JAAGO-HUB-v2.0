import { pgTable, uuid, varchar, jsonb, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "../system/organizations.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string;
}

export interface ApiTokenItem {
  id: string;
  name: string;
  tokenPrefix: string;
  tokenHash: string;
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface SecurityPolicyConfig {
  mfaEnforced: boolean;
  sessionTimeoutMinutes: number;
  maxFailedLogins: number;
  passwordExpiryDays: number;
}

export const orgSettings = pgTable(
  "org_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    smtpConfig: jsonb("smtp_config").$type<SmtpConfig>(),
    apiTokens: jsonb("api_tokens").$type<ApiTokenItem[]>().default([]),
    securityPolicy: jsonb("security_policy").$type<SecurityPolicyConfig>().default({
      mfaEnforced: false,
      sessionTimeoutMinutes: 120,
      maxFailedLogins: 5,
      passwordExpiryDays: 90,
    }),
    version: integer("version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_org_settings_org_id").on(t.orgId),
  ],
);

export type OrgSettings = typeof orgSettings.$inferSelect;
export type NewOrgSettings = typeof orgSettings.$inferInsert;
