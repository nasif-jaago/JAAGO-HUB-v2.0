import type { AuthUser } from "@jaago/shared-types";

export class ForbiddenError extends Error {
  readonly code = "AUTH_PERMISSION_DENIED";
  readonly statusCode = 403;

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  readonly code = "AUTH_UNAUTHORIZED";
  readonly statusCode = 401;

  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Check if a user has a specific permission.
 * SuperAdmin role or '*' permission grants all permissions.
 */
export function hasPermission(user: AuthUser | undefined | null, permission: string): boolean {
  if (!user) return false;
  if (user.roles.includes("super_admin") || user.roles.includes("SuperAdmin")) return true;
  if (user.permissions.includes("*")) return true;
  return user.permissions.includes(permission);
}

/**
 * Check if a user has any of the listed permissions.
 */
export function hasAnyPermission(user: AuthUser | undefined | null, permissions: string[]): boolean {
  if (!user) return false;
  if (user.roles.includes("super_admin") || user.roles.includes("SuperAdmin")) return true;
  if (user.permissions.includes("*")) return true;
  return permissions.some((p) => user.permissions.includes(p));
}

/**
 * Check if a user has all of the listed permissions.
 */
export function hasAllPermissions(user: AuthUser | undefined | null, permissions: string[]): boolean {
  if (!user) return false;
  if (user.roles.includes("super_admin") || user.roles.includes("SuperAdmin")) return true;
  if (user.permissions.includes("*")) return true;
  return permissions.every((p) => user.permissions.includes(p));
}

/**
 * Require a permission or throw a 403 ForbiddenError.
 */
export function requirePermission(user: AuthUser | undefined | null, permission: string): void {
  if (!user) {
    throw new UnauthorizedError();
  }
  if (!hasPermission(user, permission)) {
    throw new ForbiddenError(`Missing required permission: ${permission}`);
  }
}

/**
 * Check if a user has a specific role.
 */
export function hasRole(user: AuthUser | undefined | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Require a role or throw a 403 ForbiddenError.
 */
export function requireRole(user: AuthUser | undefined | null, role: string): void {
  if (!user) {
    throw new UnauthorizedError();
  }
  if (!hasRole(user, role)) {
    throw new ForbiddenError(`Missing required role: ${role}`);
  }
}
