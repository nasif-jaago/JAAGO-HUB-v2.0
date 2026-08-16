"use client";

import { create } from "zustand";

export interface AuthStateUser {
  id: string;
  email: string;
  displayName: string;
  orgId: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
}

interface AuthStore {
  user: AuthStateUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthStateUser, token?: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@jaago.com.bd",
    displayName: "Nasif Kamal",
    orgId: "00000000-0000-0000-0000-000000000000",
    roles: ["SuperAdmin"],
    permissions: ["*"],
    mfaEnabled: true,
  },
  accessToken: "mock_jwt_token_development",
  isAuthenticated: true,

  setAuth: (user, token) =>
    set({
      user,
      accessToken: token ?? null,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    if (user.roles.includes("SuperAdmin") || user.roles.includes("super_admin")) return true;
    if (user.permissions.includes("*")) return true;
    return user.permissions.includes(permission);
  },

  hasRole: (role: string) => {
    const user = get().user;
    if (!user) return false;
    return user.roles.includes(role);
  },
}));
