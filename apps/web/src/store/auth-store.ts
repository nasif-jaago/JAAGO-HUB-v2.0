"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        email: "nasif.kamal@jaago.com.bd",
        displayName: "Nasif Kamal | Coordinator, Tech 4 Development",
        orgId: "00000000-0000-0000-0000-000000000000",
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
        mfaEnabled: true,
      },
      accessToken: "mock_jwt_token_development",
      isAuthenticated: true,

      setAuth: (user, token) =>
        set({
          user,
          accessToken: token ?? "mock_jwt_token_development",
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
        if (user.roles.includes("SUPER_ADMIN") || user.roles.includes("SuperAdmin") || user.roles.includes("super_admin"))
          return true;
        if (user.permissions.includes("*")) return true;
        return user.permissions.includes(permission);
      },

      hasRole: (role: string) => {
        const user = get().user;
        if (!user) return false;
        return user.roles.includes(role);
      },
    }),
    {
      name: "jaago-auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
