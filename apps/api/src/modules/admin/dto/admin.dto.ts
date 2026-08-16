export interface RoleDto {
  id: string;
  name: string;
  code: string;
  description?: string | undefined;
  isSystem: boolean;
  permissions: string[];
  userCount?: number | undefined;
}

export interface CreateRoleDto {
  name: string;
  code: string;
  description?: string | undefined;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string | undefined;
  description?: string | undefined;
  permissions?: string[] | undefined;
}

export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  entity: string;
  action: string;
  description?: string | undefined;
}

export interface SmtpConfigDto {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string | undefined;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | undefined;
}

export interface TestEmailDto {
  recipientEmail: string;
}

export interface CreateApiTokenDto {
  name: string;
  scopes: string[];
  expiresInDays?: number | undefined;
}

export interface ApiTokenResponseDto {
  id: string;
  name: string;
  tokenPrefix: string;
  rawSecretToken?: string | undefined;
  scopes: string[];
  expiresAt?: string | undefined;
  createdAt: string;
  lastUsedAt?: string | undefined;
}
