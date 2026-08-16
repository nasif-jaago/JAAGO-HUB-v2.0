"use client";

import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  Building2,
} from "lucide-react";
import { useUiStore } from "@/store/ui-store";

export function Topbar() {
  const pathname = usePathname();
  const { toggleMobileSidebar } = useUiStore();

  const getBreadcrumbTitle = (path: string) => {
    if (path === "/") return "Overview";
    const segments = path.split("/").filter(Boolean);
    return segments
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
      .join(" / ");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 glass-panel border-b">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 md:hidden"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:inline">JAAGO HUB</span>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <span className="font-medium text-foreground tracking-tight">
            {getBreadcrumbTitle(pathname)}
          </span>
        </div>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search quick button */}
        <button
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40 text-xs transition-colors"
          onClick={() => {}}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search (Ctrl+K)</span>
        </button>

        {/* Org badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary/60 border border-border/40 text-xs">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">JAAGO Foundation (HQ)</span>
        </div>

        {/* Notifications button */}
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-jaago-red ring-2 ring-background" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-2 sm:border-l border-border/40">
          <div className="relative">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-xs border border-primary/40">
              NK
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-tight">Nasif Kamal</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
