export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean | undefined;
}

export interface SignupDto {
  email: string;
  password: string;
  displayName: string;
  orgId?: string | undefined;
}

export interface MfaVerifyDto {
  userId: string;
  mfaTicket: string;
  code: string;
}

export interface AcceptInvitationDto {
  token: string;
  password: string;
  displayName: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    displayName: string;
    orgId: string;
    roles: string[];
    permissions: string[];
    mfaEnabled: boolean;
  };
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  expiresIn?: number | undefined;
  requiresMfa?: boolean | undefined;
  mfaTicket?: string | undefined;
}

export interface MfaSetupResponseDto {
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
}

export interface UserSessionDto {
  id: string;
  deviceType: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  isCurrent: boolean;
  lastActivityAt: string;
  createdAt: string;
}
