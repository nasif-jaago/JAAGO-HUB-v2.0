import { pgTable, uuid, varchar, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: varchar("refresh_token_hash", { length: 128 }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    deviceType: varchar("device_type", { length: 50 }), // 'desktop', 'mobile', 'tablet'
    operatingSystem: varchar("operating_system", { length: 50 }),
    browser: varchar("browser", { length: 50 }),
    isRevoked: boolean("is_revoked").notNull().default(false),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: varchar("revoked_reason", { length: 100 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_sessions_refresh_token").on(t.refreshTokenHash),
    index("idx_sessions_user_id").on(t.userId),
    index("idx_sessions_expires_at").on(t.expiresAt),
    index("idx_sessions_is_revoked").on(t.isRevoked),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
