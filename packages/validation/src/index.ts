/**
 * JAAGO ERP Shared Zod Validation Schemas
 * Single source of truth — used identically by apps/api (DTO validation) and apps/web (form validation).
 * Never import framework-specific code here.
 */

export * from "./common/index.js";
export * from "./auth/index.js";
export * from "./hr/index.js";
export * from "./procurement/index.js";
export * from "./finance/index.js";
