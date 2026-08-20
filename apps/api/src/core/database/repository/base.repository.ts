export class UnboundedQueryError extends Error {
  constructor(message = "Unbounded query rejected: A limit (maximum 200) is strictly required on all query operations.") {
    super(message);
    this.name = "UnboundedQueryError";
  }
}

export class TenantAccessViolationError extends Error {
  constructor(message = "Tenant access violation: orgId is strictly required for this operation.") {
    super(message);
    this.name = "TenantAccessViolationError";
  }
}

export interface QueryOptions {
  limit: number;
  cursor?: string;
  offset?: number;
  includeDeleted?: boolean;
}

export const MAX_QUERY_LIMIT = 200;
export const DEFAULT_QUERY_LIMIT = 50;

/**
 * BaseRepository
 *
 * All domain repositories inherit from or use this contract to ensure:
 * 1. Unbounded queries are impossible (runtime exception if limit is omitted or > 200)
 * 2. Multi-tenant isolation (orgId is always enforced)
 * 3. Soft-delete consistency
 */
export abstract class BaseRepository {
  /**
   * Validate and bound query parameters.
   * Throws UnboundedQueryError if limit is missing, non-positive, or exceeds MAX_QUERY_LIMIT.
   */
  protected validateQueryBounds(options?: Partial<QueryOptions>): { limit: number; offset: number } {
    if (!options || typeof options.limit !== "number") {
      throw new UnboundedQueryError(
        `Unbounded query rejected: 'limit' parameter is missing. Specify a limit between 1 and ${MAX_QUERY_LIMIT}.`,
      );
    }

    if (options.limit <= 0) {
      throw new UnboundedQueryError("Query limit must be greater than 0.");
    }

    if (options.limit > MAX_QUERY_LIMIT) {
      throw new UnboundedQueryError(
        `Query limit ${options.limit} exceeds maximum allowed limit of ${MAX_QUERY_LIMIT}.`,
      );
    }

    return {
      limit: options.limit,
      offset: options.offset && options.offset >= 0 ? options.offset : 0,
    };
  }

  /**
   * Validate tenant context.
   */
  protected validateTenant(orgId?: string): string {
    if (!orgId || typeof orgId !== "string" || orgId.trim() === "") {
      throw new TenantAccessViolationError();
    }
    return orgId;
  }
}
