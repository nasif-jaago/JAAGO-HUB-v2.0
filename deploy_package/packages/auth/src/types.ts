import type { AuthUser, TenantContext } from "@jaago/shared-types";

export interface AuthenticatedRequestState {
  user: AuthUser;
  tenant: TenantContext;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  org_id?: string;
  app_metadata?: {
    roles?: string[];
    permissions?: string[];
    org_id?: string;
    [key: string]: unknown;
  };
  user_metadata?: {
    display_name?: string;
    [key: string]: unknown;
  };
  exp?: number;
  iat?: number;
  iss?: string;
}
