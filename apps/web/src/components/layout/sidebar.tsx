"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Fingerprint,
  Briefcase,
  ShoppingCart,
  Boxes,
  DollarSign,
  Layers,
  ShieldCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Employees", href: "/hr/employees", icon: Users },
  { name: "Attendance", href: "/hr/attendance", icon: Fingerprint },
  { name: "Leave & Time", href: "/hr/leave", icon: CalendarCheck },
  { name: "Recruitment", href: "/hr/recruitment", icon: Briefcase },
  { name: "Procurement", href: "/procurement", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Boxes },
  { name: "Finance", href: "/finance", icon: DollarSign },
  { name: "Assets & Fleet", href: "/assets", icon: Layers },
  { name: "Approvals", href: "/approvals", icon: ShieldCheck, badge: "3" },
  { name: "Admin Settings", href: "/admin/settings", icon: ShieldCheck },
  { name: "Observability", href: "/admin/observability", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    isMobileSidebarOpen,
    isSidebarCollapsed,
    setMobileSidebarOpen,
    toggleSidebarCollapse,
  } = useUiStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col glass-panel transition-all duration-300 ease-in-out border-r",
          // Mobile state
          isMobileSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0",
          // Desktop collapsed state
          isSidebarCollapsed ? "md:w-20" : "md:w-64",
        )}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/40">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-jaago-red via-primary to-jaago-teal text-white font-bold text-lg shadow-lg shadow-primary/20 shrink-0">
              J
            </div>
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-tight text-foreground whitespace-nowrap">
                  JAAGO <span className="text-primary font-bold">HUB</span>
                </span>
                <span className="text-xs text-muted-foreground font-mono">v2.0 Enterprise</span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />

                {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                  <span className="truncate flex-1">{item.name}</span>
                )}

                {item.badge && (!isSidebarCollapsed || isMobileSidebarOpen) && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full font-semibold",
                      isActive
                        ? "bg-white text-primary"
                        : "bg-primary/15 text-primary border border-primary/30",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Collapse Toggle (Desktop only) */}
        <div className="p-3 border-t border-border/40 hidden md:flex items-center justify-between">
          <button
            onClick={toggleSidebarCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse navigation</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
