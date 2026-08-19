import { SetMetadata } from "@nestjs/common";

export const PERMISSION_METADATA_KEY = "require_permissions";
export const IS_PUBLIC_KEY = "is_public";

/**
 * Decorator to declare required permissions on a controller route.
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_METADATA_KEY, permissions);

/**
 * Decorator to mark a route as public (bypasses AuthGuard).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
