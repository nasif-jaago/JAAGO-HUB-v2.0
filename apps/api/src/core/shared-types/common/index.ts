/**
 * Common domain types used across all modules.
 */

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  cursor: string | null;   // Opaque cursor for next page (null = last page)
  hasMore: boolean;
  /** Approximate total — not always exact for large tables */
  total?: number;
}

export interface PaginationParams {
  limit?: number;          // Default 50, max 200
  cursor?: string;
  sort?: string;
  dir?: "asc" | "desc";
}

// ─── API Response envelopes ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
    correlationId: string;
    traceId?: string;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

/**
 * Use this for internal service layer results (not HTTP-layer).
 * Keeps business logic free of HTTP concerns.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string | string[]>;
      };
    };

// ─── Money ────────────────────────────────────────────────────────────────────

/**
 * Money is ALWAYS stored and transmitted as a pair of (amount, currencyCode).
 * Never use floats — the actual DB type is NUMERIC(15,4).
 * On the wire we use string to avoid IEEE 754 float issues in JSON.
 */
export interface Money {
  /** Decimal string representation e.g. "12500.0000" */
  amount: string;
  currencyCode: string;
}

// ─── Audit base ───────────────────────────────────────────────────────────────

export interface AuditFields {
  createdAt: string;   // ISO 8601 UTC
  updatedAt: string;   // ISO 8601 UTC
  createdBy: string;   // user ID
  updatedBy: string;   // user ID
}

export interface SoftDeleteFields {
  deletedAt: string | null;
}

// ─── Tenant context ───────────────────────────────────────────────────────────

export interface TenantContext {
  orgId: string;
  userId: string;
  role: string;
  officeId?: string;
  departmentId?: string;
}

// ─── Reference number ─────────────────────────────────────────────────────────

export interface ReferenceNumber {
  referenceNumber: string;
  sequenceNumber: number;
}

// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  district?: string;
  division?: string;
  postalCode?: string;
  country: string;   // ISO 3166-1 alpha-2 e.g. "BD"
}

// ─── Filter / search ──────────────────────────────────────────────────────────

export interface DateRange {
  from: string;  // ISO date string "YYYY-MM-DD"
  to: string;    // ISO date string "YYYY-MM-DD"
}

// ─── Module Contract ──────────────────────────────────────────────────────────

export interface ModuleContract {
  id: string;
  name: string;
  version: string;
  dependencies: string[];
  permissions: Permission[];
  navigation: NavItem[];
  migrations: string[];
  entities: string[];
  settings?: Record<string, unknown>;
  featureFlags?: FeatureFlag[];
  auditActions: string[];
}

export interface Permission {
  key: string;       // e.g. "hr.employee.view"
  module: string;
  entity: string;
  action: string;
  description: string;
  isSensitive?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  permission?: string;
  children?: NavItem[];
  badge?: string | number;
}

export interface FeatureFlag {
  key: string;
  description: string;
  defaultValue: boolean;
}
