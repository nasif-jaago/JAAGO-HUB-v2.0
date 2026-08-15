/**
 * Audit Client Stub
 *
 * The audit client provides a typed interface for writing tamper-evident audit records.
 *
 * ARCHITECTURE IMPORTANT:
 * - Audit writes are SYNCHRONOUS within the business transaction.
 * - Audit records are NOT routed through the ring buffer or background flusher.
 * - If the audit write fails, the business transaction fails.
 * - This stub will be fully implemented in Phase 3 (Step 3.1) with:
 *   - Hash-chain generation (each row stores hash of prev_hash || payload)
 *   - DB write via Drizzle in the active transaction
 *   - Append-only enforcement (no UPDATE/DELETE grant for app role)
 *
 * DO NOT use the ring-buffer logger for audit events.
 * DO NOT make audit writes async/non-blocking.
 */

export interface AuditContext {
  userId: string;
  orgId: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Stub interface for the audit client.
 * Fully implemented in Phase 3.
 */
export interface AuditClient {
  /**
   * Write an audit record SYNCHRONOUSLY within the current DB transaction.
   *
   * MUST be called within a DB transaction context.
   * If the write fails, the transaction will be rolled back by the caller.
   *
   * @throws If the DB write fails — this is intentional. Money must not move unrecorded.
   */
  write(context: AuditContext): Promise<void>;
}

/**
 * No-op audit client stub — used until Phase 3 implementation.
 * In production, this is replaced by the real implementation that writes to audit_log.
 *
 * IMPORTANT: This stub accepts writes silently. DO NOT ship to production
 * without replacing it with the real implementation in Phase 3.
 */
export class NoOpAuditClient implements AuditClient {
  async write(context: AuditContext): Promise<void> {
    // STUB: Phase 3 will replace this with a real DB write
    // For now, log a warning to make it visible that audit is not yet persisted
    console.warn(
      `[AUDIT STUB - NOT PERSISTED] action=${context.action} module=${context.module} entity=${context.entityType}:${context.entityId} user=${context.userId}`,
    );
  }
}

export const noOpAuditClient = new NoOpAuditClient();
