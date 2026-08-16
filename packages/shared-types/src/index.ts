/**
 * JAAGO ERP Shared Types
 * Single source of truth for domain types used across apps/api, apps/web, and packages.
 *
 * Rule: Zero framework imports here. Pure TypeScript only.
 */

// ─── Re-exports ───────────────────────────────────────────────────────────────
export * from "./enums/index.js";
export * from "./common/index.js";
export * from "./auth/index.js";
export * from "./hr/index.js";
export * from "./procurement/index.js";
export * from "./finance/index.js";
export * from "./modules/registry.js";
