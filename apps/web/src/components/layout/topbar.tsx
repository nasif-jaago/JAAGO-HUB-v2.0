"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  LogOut,
  User,
  Settings,
  RotateCw,
  Sun,
  Moon,
  Monitor,
  SidebarClose,
} from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { NotificationCenter } from "./notification-center";
import { createClient } from "@/lib/supabase-client";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, toggleMobileSidebar, toggleSidebarCollapse } = useUiStore();
  const { user, logout } = useAuthStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    logout();
    setIsUserMenuOpen(false);
    router.push("/login");
  };

  const getBreadcrumbTitle = (path: string) => {
    if (path === "/") return "My Dashboard";
    const segments = path.split("/").filter(Boolean);
    return segments
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
      .join(" / ");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-[#1A1817] dark:bg-[#12141a] text-white border-b border-black/20 shadow-sm">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="p-1.5 -ml-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 md:hidden"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
            JAAGO <span className="text-[#FBBF24]">HUB</span>
          </span>
          <span className="text-white/40 hidden sm:inline">|</span>
          <span className="text-white/70 hidden sm:inline">Dashboards</span>
          <span className="text-white/40 hidden sm:inline">❯</span>
          <span className="font-medium text-[#FBBF24] tracking-tight">
            {getBreadcrumbTitle(pathname)}
          </span>
        </div>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Toolbar icons */}
        <button
          onClick={() => window.location.reload()}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Reload Page"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <Sun className="w-4 h-4 text-[#FBBF24]" />
          ) : (
            <Moon className="w-4 h-4 text-sky-400" />
          )}
        </button>

        <button
          onClick={() => {}}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex"
          title="Display Mode"
        >
          <Monitor className="w-4 h-4" />
        </button>

        {/* Notifications Popover */}
        <NotificationCenter />

        {/* User Avatar Menu Trigger */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all focus:outline-none"
            aria-label="User Profile Menu"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-xs shadow-inner overflow-hidden">
              <User className="w-4 h-4 text-black" />
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1 ring-2 ring-black/40" />
          </button>

          {/* User Profile Dropdown Modal (Matching Reference Image) */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-3xl bg-[#FAF7EE] dark:bg-[#1C1F26] text-[#292524] dark:text-[#F3F4F6] border border-black/10 dark:border-white/10 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 z-50">
              {/* Profile Overview */}
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center text-amber-400 font-bold text-base overflow-hidden">
                    <User className="w-7 h-7 text-amber-400" />
                  </div>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-extrabold text-xs text-foreground leading-tight">
                    {user?.displayName || "Nasif Kamal | Coordinator, Tech 4 Development"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user?.email || "nasif.kamal@jaago.com.bd"}
                  </p>
                </div>
              </div>

              {/* Role Pill */}
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold font-mono tracking-wider border border-blue-500/20">
                  SUPER_ADMIN
                </span>
              </div>

              {/* Action Divider & Actions */}
              <div className="pt-2 border-t border-border/40 space-y-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                >
                  <Settings className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Admin Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition-all text-left uppercase tracking-wider"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Toggle Shortcut */}
        <button
          onClick={toggleSidebarCollapse}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors hidden md:flex"
          title="Toggle Navigation View"
        >
          <SidebarClose className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
