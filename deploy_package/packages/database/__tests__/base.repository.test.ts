import { describe, it, expect } from "vitest";
import {
  BaseRepository,
  UnboundedQueryError,
  TenantAccessViolationError,
  MAX_QUERY_LIMIT,
  type QueryOptions,
} from "../src/repository/base.repository.js";
import { organizations, auditLogs } from "../src/schema/index.js";

// Test implementation of BaseRepository
class TestRepository extends BaseRepository {
  public testBounds(options?: Partial<QueryOptions>) {
    return this.validateQueryBounds(options);
  }

  public testTenant(orgId?: string) {
    return this.validateTenant(orgId);
  }
}

describe("BaseRepository — Unbounded Query Prevention", () => {
  const repo = new TestRepository();

  it("throws UnboundedQueryError when limit is omitted", () => {
    expect(() => repo.testBounds()).toThrow(UnboundedQueryError);
    expect(() => repo.testBounds({})).toThrow(UnboundedQueryError);
  });

  it("throws UnboundedQueryError when limit is 0 or negative", () => {
    expect(() => repo.testBounds({ limit: 0 })).toThrow(UnboundedQueryError);
    expect(() => repo.testBounds({ limit: -5 })).toThrow(UnboundedQueryError);
  });

  it("throws UnboundedQueryError when limit exceeds MAX_QUERY_LIMIT (200)", () => {
    expect(() => repo.testBounds({ limit: 201 })).toThrow(UnboundedQueryError);
    expect(() => repo.testBounds({ limit: 1000 })).toThrow(UnboundedQueryError);
  });

  it("accepts valid limit within boundaries [1, 200]", () => {
    const res1 = repo.testBounds({ limit: 50 });
    expect(res1.limit).toBe(50);
    expect(res1.offset).toBe(0);

    const res2 = repo.testBounds({ limit: MAX_QUERY_LIMIT, offset: 20 });
    expect(res2.limit).toBe(MAX_QUERY_LIMIT);
    expect(res2.offset).toBe(20);
  });

  it("throws TenantAccessViolationError when orgId is missing or empty", () => {
    expect(() => repo.testTenant()).toThrow(TenantAccessViolationError);
    expect(() => repo.testTenant("")).toThrow(TenantAccessViolationError);
    expect(() => repo.testTenant("   ")).toThrow(TenantAccessViolationError);
  });

  it("accepts valid orgId", () => {
    const validId = "11111111-2222-3333-4444-555555555555";
    expect(repo.testTenant(validId)).toBe(validId);
  });
});

describe("Drizzle Schema Definitions", () => {
  it("defines organizations table with expected columns", () => {
    expect(organizations.id).toBeDefined();
    expect(organizations.name).toBeDefined();
    expect(organizations.slug).toBeDefined();
    expect(organizations.createdAt).toBeDefined();
    expect(organizations.deletedAt).toBeDefined();
  });

  it("defines audit_log table with expected columns including hash-chain", () => {
    expect(auditLogs.id).toBeDefined();
    expect(auditLogs.orgId).toBeDefined();
    expect(auditLogs.userId).toBeDefined();
    expect(auditLogs.action).toBeDefined();
    expect(auditLogs.prevHash).toBeDefined();
    expect(auditLogs.rowHash).toBeDefined();
  });
});
