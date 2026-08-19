/**
 * SECURITY TEST: Redaction
 *
 * CRITICAL REQUIREMENT: These tests MUST PASS before any code ships to production.
 *
 * This test proves that known secrets NEVER appear in the log output after redaction.
 * It tests both the primary layer (structural path-based redaction via Pino)
 * and the secondary backstop layer (regex patterns on serialized strings).
 *
 * If any test here fails, the logger is LEAKING SECRETS and must not be deployed.
 */

import { describe, it, expect } from "vitest";
import {
  applyRegexBackstop,
  deepRedact,
  REDACTED_PLACEHOLDER,
  PINO_REDACT_PATHS,
} from "../src/redaction.js";

// Known test secrets that must NEVER appear in log output
const FAKE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OX0.FAKE_SIGNATURE_NOT_REAL";
const FAKE_PASSWORD = "MyS3cr3tP@ssw0rd!";
const FAKE_API_KEY = "sk_live_FAKEKEYNOTREAL12345";
const FAKE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.FAKESERVICEROLE";
const FAKE_CARD_NUMBER = "4111 1111 1111 1111";
const FAKE_CARD_DASHES = "4111-1111-1111-1111";
const FAKE_NID = "1234567890123";

describe("Redaction — deepRedact()", () => {
  it("redacts password field", () => {
    const obj = { userId: "u1", password: FAKE_PASSWORD };
    const result = deepRedact(obj) as Record<string, unknown>;
    expect(result["password"]).toBe(REDACTED_PLACEHOLDER);
    expect(result["userId"]).toBe("u1"); // non-sensitive preserved
    // CRITICAL: The actual secret must NOT appear in the result
    expect(JSON.stringify(result)).not.toContain(FAKE_PASSWORD);
  });

  it("redacts token field", () => {
    const obj = { action: "reset", token: FAKE_JWT };
    const result = deepRedact(obj) as Record<string, unknown>;
    expect(result["token"]).toBe(REDACTED_PLACEHOLDER);
    expect(JSON.stringify(result)).not.toContain(FAKE_JWT);
  });

  it("redacts apiKey field", () => {
    const obj = { integration: "stripe", apiKey: FAKE_API_KEY };
    const result = deepRedact(obj) as Record<string, unknown>;
    expect(result["apiKey"]).toBe(REDACTED_PLACEHOLDER);
    expect(JSON.stringify(result)).not.toContain(FAKE_API_KEY);
  });

  it("redacts secret field", () => {
    const obj = { name: "webhook", secret: "wh_secret_fakeval12345" };
    const result = deepRedact(obj) as Record<string, unknown>;
    expect(result["secret"]).toBe(REDACTED_PLACEHOLDER);
  });

  it("redacts nid field", () => {
    const obj = { employeeId: "emp_1", nid: FAKE_NID };
    const result = deepRedact(obj) as Record<string, unknown>;
    expect(result["nid"]).toBe(REDACTED_PLACEHOLDER);
    expect(JSON.stringify(result)).not.toContain(FAKE_NID);
  });

  it("redacts nested sensitive fields", () => {
    const obj = {
      user: {
        name: "Alice",
        credentials: {
          password: FAKE_PASSWORD,
          apiKey: FAKE_API_KEY,
        },
      },
    };
    const result = deepRedact(obj) as { user: { credentials: Record<string, unknown> } };
    expect(result.user.credentials["password"]).toBe(REDACTED_PLACEHOLDER);
    expect(result.user.credentials["apiKey"]).toBe(REDACTED_PLACEHOLDER);
    expect(JSON.stringify(result)).not.toContain(FAKE_PASSWORD);
    expect(JSON.stringify(result)).not.toContain(FAKE_API_KEY);
  });

  it("preserves non-sensitive fields at all levels", () => {
    const obj = {
      correlationId: "corr_123",
      module: "hr.leave",
      userId: "user_abc",
      orgId: "org_xyz",
    };
    const result = deepRedact(obj) as Record<string, unknown>;
    expect(result["correlationId"]).toBe("corr_123");
    expect(result["module"]).toBe("hr.leave");
    expect(result["userId"]).toBe("user_abc");
    expect(result["orgId"]).toBe("org_xyz");
  });

  it("handles arrays without redacting non-sensitive content", () => {
    const obj = { tags: ["important", "flagged"], password: FAKE_PASSWORD };
    const result = deepRedact(obj) as Record<string, unknown>;
    expect(result["tags"]).toEqual(["important", "flagged"]);
    expect(result["password"]).toBe(REDACTED_PLACEHOLDER);
  });

  it("handles null and undefined gracefully", () => {
    expect(deepRedact(null)).toBeNull();
    expect(deepRedact(undefined)).toBeUndefined();
    expect(deepRedact("a string")).toBe("a string");
    expect(deepRedact(42)).toBe(42);
  });

  it("handles depth limit without crashing", () => {
    // Deeply nested object
    const deep: Record<string, unknown> = {};
    let current = deep;
    for (let i = 0; i < 20; i++) {
      const nested: Record<string, unknown> = {};
      current["nested"] = nested;
      current = nested;
    }
    current["password"] = FAKE_PASSWORD;
    // Should not throw or recurse infinitely
    expect(() => deepRedact(deep, 5)).not.toThrow();
  });
});

describe("Redaction — applyRegexBackstop()", () => {
  it("removes JWT tokens from serialized strings", () => {
    const serialized = JSON.stringify({
      msg: "Auth failed",
      debug: { token: FAKE_JWT },
    });
    const result = applyRegexBackstop(serialized);
    expect(result).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(result).toContain("[REDACTED:JWT]");
  });

  it("removes Bearer tokens from serialized strings", () => {
    const serialized = `{"msg":"request","authorization":"Bearer ${FAKE_API_KEY}"}`;
    const result = applyRegexBackstop(serialized);
    expect(result).not.toContain(FAKE_API_KEY);
    expect(result).toContain("Bearer [REDACTED]");
  });

  it("removes 16-digit card numbers with spaces", () => {
    const serialized = JSON.stringify({ msg: "payment", card: FAKE_CARD_NUMBER });
    const result = applyRegexBackstop(serialized);
    expect(result).not.toContain("4111 1111 1111 1111");
    expect(result).toContain("[REDACTED:CARD]");
  });

  it("removes 16-digit card numbers with dashes", () => {
    const serialized = JSON.stringify({ msg: "payment", card: FAKE_CARD_DASHES });
    const result = applyRegexBackstop(serialized);
    expect(result).not.toContain("4111-1111-1111-1111");
    expect(result).toContain("[REDACTED:CARD]");
  });

  it("preserves non-sensitive serialized content", () => {
    const serialized = JSON.stringify({
      correlationId: "corr_abc",
      module: "hr.leave",
      msg: "Leave request created",
      referenceNumber: "LV-2026-000042",
    });
    const result = applyRegexBackstop(serialized);
    expect(result).toContain("corr_abc");
    expect(result).toContain("hr.leave");
    expect(result).toContain("Leave request created");
    expect(result).toContain("LV-2026-000042");
  });

  it("does not modify strings without sensitive patterns", () => {
    const clean = JSON.stringify({ level: "info", msg: "Healthy heartbeat", service: "api" });
    const result = applyRegexBackstop(clean);
    expect(result).toBe(clean);
  });
});

describe("Redaction — PINO_REDACT_PATHS completeness", () => {
  const criticalPaths = [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "apiKey",
    "secret",
    "headers.authorization",
    "cardNumber",
    "bankAccount",
    "nid",
    "encryptionKey",
  ];

  for (const path of criticalPaths) {
    it(`includes redact path: ${path}`, () => {
      const found =
        PINO_REDACT_PATHS.includes(path) ||
        PINO_REDACT_PATHS.includes(`*.${path}`) ||
        PINO_REDACT_PATHS.some((p) => p.startsWith(path));
      expect(
        found,
        `PINO_REDACT_PATHS must include "${path}" or "*.${path}" — add it to redaction.ts`,
      ).toBe(true);
    });
  }
});
