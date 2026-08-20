/**
 * Common enums shared across all modules.
 * Use string enums for readability in logs, DB, and API responses.
 * Prefer lookup tables for values that admins may need to change — these are system-level invariants only.
 */

// ─── Entity status ────────────────────────────────────────────────────────────

export enum EntityStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
  DELETED = "deleted",
}

// ─── Approval / workflow ──────────────────────────────────────────────────────

export enum ApprovalStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  IN_REVIEW = "in_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  RETURNED = "returned",   // returned for revision — goes back to DRAFT
  CANCELLED = "cancelled",
}

export enum ApprovalActionType {
  SUBMIT = "submit",
  APPROVE = "approve",
  REJECT = "reject",
  RETURN = "return",     // return for revision
  CANCEL = "cancel",
  DELEGATE = "delegate",
  COMMENT = "comment",
}

export enum ApproverType {
  ROLE = "role",
  USER = "user",
  DEPARTMENT_HEAD = "department_head",
  REPORTING_MANAGER = "reporting_manager",
}

// ─── User / account ───────────────────────────────────────────────────────────

export enum UserStatus {
  INVITED = "invited",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  DEACTIVATED = "deactivated",
}

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
  REVOKED = "revoked",
}

// ─── Employment ───────────────────────────────────────────────────────────────

export enum EmploymentStatus {
  PROBATION = "probation",
  PERMANENT = "permanent",
  CONTRACTUAL = "contractual",
  PART_TIME = "part_time",
  INTERN = "intern",
  VOLUNTEER = "volunteer",
  ON_NOTICE = "on_notice",
  TERMINATED = "terminated",
  RESIGNED = "resigned",
}

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACTUAL = "contractual",
  INTERN = "intern",
  VOLUNTEER = "volunteer",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
  PREFER_NOT_TO_SAY = "prefer_not_to_say",
}

// ─── Leave ────────────────────────────────────────────────────────────────────

export enum LeaveRequestStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  RETURNED = "returned",
}

// ─── Procurement ──────────────────────────────────────────────────────────────

export enum PurchaseRequestStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  ORDERED = "ordered",   // PO raised
  COMPLETED = "completed",
}

export enum PurchaseOrderStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  SENT = "sent",           // Sent to vendor
  PARTIALLY_RECEIVED = "partially_received",
  RECEIVED = "received",
  INVOICED = "invoiced",
  PAID = "paid",
  CANCELLED = "cancelled",
  CLOSED = "closed",
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export enum ExpenseStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
  PAID = "paid",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REVERSED = "reversed",
  CANCELLED = "cancelled",
}

// ─── Asset ────────────────────────────────────────────────────────────────────

export enum AssetLifecycleStatus {
  AVAILABLE = "available",
  ASSIGNED = "assigned",
  UNDER_REPAIR = "under_repair",
  LOST = "lost",
  DAMAGED = "damaged",
  DISPOSED = "disposed",
  RETIRED = "retired",
}

// ─── Document ─────────────────────────────────────────────────────────────────

export enum DocumentVisibility {
  PRIVATE = "private",    // Owner only
  RESTRICTED = "restricted", // Explicit grants
  INTERNAL = "internal",  // All org members
  PUBLIC = "public",      // Externally accessible (rare)
}

// ─── Notification ─────────────────────────────────────────────────────────────

export enum NotificationType {
  APPROVAL_REQUIRED = "approval_required",
  APPROVED = "approved",
  REJECTED = "rejected",
  RETURNED = "returned",
  TASK_ASSIGNED = "task_assigned",
  DEADLINE_APPROACHING = "deadline_approaching",
  LEAVE_STATUS_CHANGED = "leave_status_changed",
  DOCUMENT_EXPIRING = "document_expiring",
  SYSTEM = "system",
  INFO = "info",
}

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  SMS = "sms",       // Future
  PUSH = "push",     // Future
}

// ─── Job / background tasks ───────────────────────────────────────────────────

export enum JobStatus {
  WAITING = "waiting",
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed",
  RETRYING = "retrying",
  DELAYED = "delayed",
  PAUSED = "paused",
  DEAD_LETTERED = "dead_lettered",
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export enum AuditAction {
  // Auth
  LOGIN = "login",
  LOGOUT = "logout",
  LOGIN_FAILED = "login_failed",
  PASSWORD_RESET = "password_reset",
  MFA_ENABLED = "mfa_enabled",
  MFA_DISABLED = "mfa_disabled",
  SESSION_REVOKED = "session_revoked",
  ACCOUNT_SUSPENDED = "account_suspended",

  // Data
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  RESTORE = "restore",
  EXPORT = "export",
  IMPORT = "import",

  // Workflow
  SUBMIT = "submit",
  APPROVE = "approve",
  REJECT = "reject",
  RETURN = "return",
  CANCEL = "cancel",
  DELEGATE = "delegate",

  // Access
  VIEW_SENSITIVE = "view_sensitive",
  ROLE_ASSIGNED = "role_assigned",
  ROLE_REMOVED = "role_removed",
  PERMISSION_CHANGED = "permission_changed",

  // Admin
  SETTINGS_CHANGED = "settings_changed",
  API_KEY_CREATED = "api_key_created",
  API_KEY_REVOKED = "api_key_revoked",
  CACHE_INVALIDATED = "cache_invalidated",
  BACKUP_CREATED = "backup_created",
  RESTORE_EXECUTED = "restore_executed",
  INTEGRATION_CONFIGURED = "integration_configured",
}

// ─── Currencies (supported) ───────────────────────────────────────────────────

export enum CurrencyCode {
  BDT = "BDT",
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
}

// ─── Log severity ─────────────────────────────────────────────────────────────

export enum LogSeverity {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}
