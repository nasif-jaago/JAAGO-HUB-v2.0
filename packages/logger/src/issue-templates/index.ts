/**
 * Curated Issue Template Registry
 *
 * CRITICAL RULE: These templates are AUTHORED by engineers and reviewed in the repo.
 * They are NEVER generated at runtime. The UI shows them only when a matching
 * errorCode is found. If no template exists for an error, the UI shows:
 * "No known troubleshooting guidance for this error code yet."
 *
 * Resolution estimates are NEVER fabricated. The `resolutionEstimate` field
 * must only be populated with data backed by real historical resolution data.
 * When unknown, leave it null — the UI shows "Unable to estimate reliably."
 *
 * Template versioning: increment `templateVersion` when guidance is updated
 * so the UI can indicate whether guidance is up-to-date.
 */

export type IssueSeverity = "info" | "warning" | "error" | "critical";

export interface IssueTemplate {
  errorCode: string;
  templateVersion: number;
  severity: IssueSeverity;
  plainLanguage: string;
  likelyCauses: string[];
  suggestedActions: string[];
  docsLink?: string;
  /** Only include if backed by actual historical data. Otherwise null. */
  resolutionEstimate: string | null;
}

const templates: IssueTemplate[] = [
  // ─── Auth ────────────────────────────────────────────────────────────────
  {
    errorCode: "AUTH_JWT_EXPIRED",
    templateVersion: 1,
    severity: "warning",
    plainLanguage: "The user's login session has expired.",
    likelyCauses: [
      "The JWT access token has passed its expiry time (typically 1 hour).",
      "The refresh token rotation may have failed.",
    ],
    suggestedActions: [
      "The user should log in again.",
      "Check if refresh token rotation is working correctly.",
      "If users are frequently hitting this, check the token expiry configuration in Supabase.",
    ],
    resolutionEstimate: null,
  },
  {
    errorCode: "AUTH_MFA_REQUIRED",
    templateVersion: 1,
    severity: "info",
    plainLanguage: "Multi-factor authentication is required for this account.",
    likelyCauses: ["The organization has enforced MFA for all accounts."],
    suggestedActions: [
      "The user must complete MFA setup before proceeding.",
      "Admins can check MFA policy in Admin → Settings → Security.",
    ],
    resolutionEstimate: null,
  },
  {
    errorCode: "AUTH_PERMISSION_DENIED",
    templateVersion: 1,
    severity: "warning",
    plainLanguage: "The user does not have permission to perform this action.",
    likelyCauses: [
      "The user's role does not include the required permission.",
      "The user's session may be stale — their role may have changed.",
    ],
    suggestedActions: [
      "Check the user's assigned roles in Admin → Users.",
      "If the user's role was recently changed, ask them to log out and back in.",
      "Review the permission requirements for this operation in the module documentation.",
    ],
    resolutionEstimate: null,
  },

  // ─── Database ────────────────────────────────────────────────────────────
  {
    errorCode: "DB_CONNECTION_FAILED",
    templateVersion: 1,
    severity: "critical",
    plainLanguage: "The system could not connect to the database.",
    likelyCauses: [
      "The database server is temporarily unavailable.",
      "Connection pool is exhausted due to high traffic.",
      "The DATABASE_URL environment variable is misconfigured.",
      "Network connectivity issue between the API server and Supabase.",
    ],
    suggestedActions: [
      "Check the Supabase project status at status.supabase.com.",
      "Check the connection pool metrics in the Observability Center.",
      "Verify DATABASE_URL is correctly set in the environment.",
      "Check for recent deployment changes that may have affected database connectivity.",
    ],
    docsLink: "/docs/OPERATIONS.md#database",
    resolutionEstimate: null,
  },
  {
    errorCode: "DB_UNBOUNDED_QUERY_REJECTED",
    templateVersion: 1,
    severity: "error",
    plainLanguage: "A database query was rejected because it lacked a result limit.",
    likelyCauses: [
      "A developer wrote a query without a mandatory limit parameter.",
      "This is a programming error — the repository base class enforces bounded queries.",
    ],
    suggestedActions: [
      "Find the query in the error's stack trace and add a limit parameter.",
      "Review the repository base class contract in packages/database.",
    ],
    resolutionEstimate: null,
  },

  // ─── Queue / Worker ──────────────────────────────────────────────────────
  {
    errorCode: "QUEUE_JOB_FAILED",
    templateVersion: 1,
    severity: "error",
    plainLanguage: "A background job failed after all retry attempts.",
    likelyCauses: [
      "The job encountered an unhandled error.",
      "An external dependency (email, storage, third-party API) was unavailable.",
      "The job data was malformed.",
    ],
    suggestedActions: [
      "Inspect the full job error in Background Jobs Center → Dead Letter Queue.",
      "Check if the job can be safely retried (idempotency confirmed).",
      "Look for related errors in the Integrations log if the job calls an external service.",
    ],
    resolutionEstimate: null,
  },

  // ─── Logger self ─────────────────────────────────────────────────────────
  {
    errorCode: "LOGGER_BUFFER_OVERFLOW",
    templateVersion: 1,
    severity: "warning",
    plainLanguage: "The log buffer is full. Some debug logs are being dropped to protect application performance.",
    likelyCauses: [
      "The log transport (file, HTTP endpoint, or stdout processor) is slower than log generation.",
      "An unusually high volume of debug-level logs is being generated.",
      "A log consumer downstream of this service is overwhelmed or unresponsive.",
    ],
    suggestedActions: [
      "Check the transport health — is the log sink (stdout processor, Loki, etc.) running?",
      "Consider reducing debug log verbosity in this component.",
      "This does NOT affect error or warning logs — only debug logs are dropped.",
      "Check `logs_dropped_total` metric trend in the Observability Center.",
    ],
    resolutionEstimate: null,
  },

  // ─── Audit chain ────────────────────────────────────────────────────────
  {
    errorCode: "AUDIT_CHAIN_BROKEN",
    templateVersion: 1,
    severity: "critical",
    plainLanguage: "The audit log hash chain has been broken. A record may have been tampered with.",
    likelyCauses: [
      "A database record in the audit_log table was modified or deleted (unauthorized change).",
      "A database restore was applied to a partial subset of audit records.",
      "A bug in the audit write path generated an incorrect hash.",
    ],
    suggestedActions: [
      "Do NOT modify or delete any audit_log records.",
      "Immediately escalate to IT and Management.",
      "Identify the exact record where the chain breaks using the Audit Logs verifier report.",
      "Cross-reference with database access logs to identify who accessed the audit_log table.",
      "Preserve a database snapshot immediately for forensic analysis.",
    ],
    docsLink: "/docs/SECURITY.md#audit",
    resolutionEstimate: null,
  },
];

const templateMap = new Map<string, IssueTemplate>(
  templates.map((t) => [t.errorCode, t]),
);

export function getIssueTemplate(errorCode: string): IssueTemplate | null {
  return templateMap.get(errorCode) ?? null;
}

export function getAllTemplates(): IssueTemplate[] {
  return [...templates];
}
