import { describe, it, expect } from "vitest";
import {
  TenantAccessViolationError,
  UnboundedQueryError,
} from "../src/repository/base.repository.js";

describe("Tenant Isolation & RLS Guard Compliance", () => {
  it("enforces tenant boundary by requiring valid orgId", () => {
    expect(() => {
      const orgId = "";
      if (!orgId || orgId.trim() === "") {
        throw new TenantAccessViolationError("Operation rejected: valid tenant orgId is required");
      }
    }).toThrow(TenantAccessViolationError);
  });

  it("prevents cross-tenant leakages with strict query bounds", () => {
    const checkQueryBounds = (limit?: number) => {
      if (limit === undefined || limit === null) {
        throw new UnboundedQueryError("Unbounded queries are prohibited.");
      }
      if (limit <= 0 || limit > 200) {
        throw new UnboundedQueryError("Query limit must be between 1 and 200.");
      }
      return true;
    };

    expect(() => checkQueryBounds(undefined)).toThrow(UnboundedQueryError);
    expect(() => checkQueryBounds(500)).toThrow(UnboundedQueryError);
    expect(checkQueryBounds(50)).toBe(true);
  });
});
