"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";

export interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions = [],
  role,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasRole } = useAuthStore();

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (permissions.length > 0) {
    const check = requireAll
      ? permissions.every((p) => hasPermission(p))
      : permissions.some((p) => hasPermission(p));

    if (!check) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
