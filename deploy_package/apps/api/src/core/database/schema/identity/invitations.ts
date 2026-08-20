import { pgTable, uuid, varchar, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "../system/organizations.js";
import { users } from "./users.js";
import { roles } from "./roles-permissions.js";

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    invitedBy: uuid("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 30 }).notNull().default("pending"), // 'pending', 'accepted', 'revoked', 'expired'
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_invitations_token_hash").on(t.tokenHash),
    index("idx_invitations_org_email").on(t.orgId, t.email),
    index("idx_invitations_status").on(t.status),
  ],
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
