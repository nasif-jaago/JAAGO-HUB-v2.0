import type { UserStatus, InvitationStatus } from "../enums/index.js";

export interface AuthUser {
  id: string;
  email: string;
  orgId: string;
  status: UserStatus;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface UserProfile {
  id: string;
  userId: string;
  orgId: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
}

export interface LoginAuditEvent {
  id: string;
  userId: string;
  orgId: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

export interface Invitation {
  id: string;
  orgId: string;
  email: string;
  roleId: string;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}
