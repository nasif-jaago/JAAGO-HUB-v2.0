import type { AuthUser, UserStatus } from "@jaago/shared-types";
import type { JwtPayload } from "./types.js";

export class JwtVerifier {
  /**
   * Decode and parse JWT payload without external library dependencies.
   */
  static decodePayload(token: string): JwtPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3 || !parts[1]) return null;

      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = Buffer.from(base64, "base64").toString("utf8");
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Convert decoded JWT payload to standard AuthUser domain entity.
   */
  static toAuthUser(payload: JwtPayload): AuthUser {
    const roles = payload.app_metadata?.roles ?? (payload.role ? [payload.role] : ["authenticated"]);
    const permissions = payload.app_metadata?.permissions ?? [];
    const orgId = payload.app_metadata?.org_id ?? payload.org_id ?? "00000000-0000-0000-0000-000000000000";

    return {
      id: payload.sub,
      email: payload.email ?? "",
      orgId,
      status: "active" as UserStatus,
      roles,
      permissions,
      mfaEnabled: false,
    };
  }
}
