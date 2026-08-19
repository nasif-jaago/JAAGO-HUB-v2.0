import { describe, it, expect } from "vitest";
import { JwtVerifier } from "../src/jwt-verifier.js";

describe("JwtVerifier", () => {
  it("decodes valid JWT payload", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: "11111111-2222-3333-4444-555555555555",
        email: "user@jaago.com.bd",
        role: "authenticated",
        app_metadata: {
          roles: ["HRManager"],
          permissions: ["hr.employee.view", "hr.employee.create"],
          org_id: "99999999-8888-7777-6666-555555555555",
        },
      }),
    ).toString("base64url");
    const token = `${header}.${payload}.signature`;

    const decoded = JwtVerifier.decodePayload(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("11111111-2222-3333-4444-555555555555");
    expect(decoded?.email).toBe("user@jaago.com.bd");

    const authUser = JwtVerifier.toAuthUser(decoded!);
    expect(authUser.id).toBe("11111111-2222-3333-4444-555555555555");
    expect(authUser.email).toBe("user@jaago.com.bd");
    expect(authUser.roles).toContain("HRManager");
    expect(authUser.permissions).toContain("hr.employee.create");
    expect(authUser.orgId).toBe("99999999-8888-7777-6666-555555555555");
  });

  it("returns null for malformed token", () => {
    expect(JwtVerifier.decodePayload("invalid-token")).toBeNull();
    expect(JwtVerifier.decodePayload("")).toBeNull();
  });
});
