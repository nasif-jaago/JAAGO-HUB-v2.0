"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { createClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: ReactNode;
}

const ALLOWED_DOMAINS = ["jaago.com.bd", "emkcenter.org"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarCollapsed } = useUiStore();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname?.startsWith("/invite") ||
    pathname?.startsWith("/auth");

  // Sync Supabase authentication on mount
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userEmail = session.user.email?.toLowerCase() || "";
          const isAllowed = ALLOWED_DOMAINS.some((d) => userEmail.endsWith(`@${d}`));
          if (isAllowed) {
            setAuth(
              {
                id: session.user.id,
                email: userEmail,
                displayName:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.name ||
                  userEmail,
                orgId: "00000000-0000-0000-0000-000000000000",
                roles: ["SUPER_ADMIN"],
                permissions: ["*"],
                mfaEnabled: false,
              },
              session.access_token
            );
          }
        }
        setIsCheckingAuth(false);
      });
    } catch {
      setIsCheckingAuth(false);
    }
  }, [setAuth]);

  // Route protection: redirect to /login if unauthenticated on private route
  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated && !isPublicRoute) {
      router.push("/login");
    }
  }, [isCheckingAuth, isAuthenticated, isPublicRoute, router]);

  // If on login, signup, or invite pages -> Render standalone page without Sidebar or Topbar
  if (isPublicRoute) {
    return (
      <div className="min-h-screen w-full bg-[#F6F1E8] dark:bg-[#0F1117] text-[#292524] dark:text-[#F3F4F6]">
        {children}
      </div>
    );
  }

  // If not authenticated yet on a protected route, show nothing while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#F6F1E8] dark:bg-[#0F1117] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Standard Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Layout Area with responsive dynamic margin */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-72",
        )}
      >
        {/* Top Header */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
