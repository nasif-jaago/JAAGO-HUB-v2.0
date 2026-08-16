"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  LayoutGrid,
  FileText,
  Clock,
  Briefcase,
  Building,
  Tag,
  Package,
  ShoppingCart,
  DollarSign,
  UserPlus,
  PenTool,
  Receipt,
  Calendar,
  Award,
  History,
  Target,
  Users,
  Network,
  Contact,
  UserCheck,
  Star,
  TrendingUp,
  CircleDot,
  CheckSquare,
  GraduationCap,
  Building2,
  ShieldCheck,
  Lock,
  Key,
  MapPin,
  Cpu,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mail,
  Activity,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

export function Sidebar() {
  const pathname = usePathname();
  const {
    isMobileSidebarOpen,
    isSidebarCollapsed,
    setMobileSidebarOpen,
    toggleSidebarCollapse,
  } = useUiStore();

  // Accordion open/close states
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [isRequestsOpen, setIsRequestsOpen] = useState(true);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isAdminObservabilityOpen, setIsAdminObservabilityOpen] = useState(true);

  const requestSubItems = [
    { name: "All Requests", href: "/approvals", icon: FileText },
    { name: "Leave Request", href: "/hr/leave", icon: Tag },
    { name: "General Requisition", href: "/procurement", icon: Package },
    { name: "Purchase Requisition", href: "/procurement", icon: ShoppingCart },
    { name: "Expenses", href: "/finance", icon: DollarSign },
    { name: "Recruitment Requisition", href: "/hr/recruitment", icon: UserPlus },
    { name: "Sign Request", href: "/reports", icon: PenTool },
    { name: "Tax & NOC Request", href: "/finance", icon: Receipt },
    { name: "Payment Voucher (PV)", href: "/finance", icon: FileText },
    { name: "Meeting Rooms", href: "/admin/settings", icon: Calendar },
    { name: "Volunteering Programmes", href: "/schools", icon: Award },
  ];

  const attendanceSubItems = [
    { name: "Attendance", href: "/hr/attendance", icon: History },
    { name: "My Leave", href: "/hr/leave", icon: Calendar },
    { name: "On Duty", href: "/hr/attendance", icon: Target },
  ];

  const organizationSubItems = [
    { name: "My Team", href: "/hr/employees", icon: Users },
    { name: "My Department", href: "/hr/employees", icon: Users },
    { name: "Cross Department", href: "/hr/employees", icon: Network },
    { name: "Contacts", href: "/hr/employees", icon: Contact },
    { name: "On Leave", href: "/hr/leave", icon: UserCheck },
    { name: "Performance & Appraisal", href: "/reports", icon: Star },
  ];

  const adminObservabilitySubItems = [
    { name: "Observability Telemetry", href: "/admin/observability", icon: Activity },
    { name: "RBAC & Role Matrix", href: "/admin/settings?tab=rbac", icon: ShieldCheck },
    { name: "Email Server (SMTP)", href: "/admin/settings?tab=smtp", icon: Mail },
    { name: "Attendance & Geofencing", href: "/admin/settings?tab=attendance", icon: MapPin },
    { name: "API & Access Tokens", href: "/admin/settings?tab=api-tokens", icon: Key },
    { name: "Security & MFA Policies", href: "/admin/settings?tab=security", icon: Lock },
    { name: "About & Architecture", href: "/admin/settings?tab=about", icon: Cpu },
  ];

  const departmentItems = [
    { name: "Admin & Procurement", href: "/procurement", icon: Briefcase },
    { name: "Child Welfare", href: "/schools", icon: Star },
    { name: "Digital & Creative (DKL)", href: "/reports", icon: TrendingUp },
    { name: "Founder's Office (FC)", href: "/reports", icon: FileText },
    { name: "Fundraising & Grants", href: "/donors", icon: DollarSign },
    { name: "Impact Investment", href: "/finance", icon: CircleDot },
    { name: "Project Implementation", href: "/reports", icon: CheckSquare },
    { name: "School Operations", href: "/schools", icon: GraduationCap },
    { name: "Vendor Management", href: "/vendors", icon: Building2 },
  ];

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
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-border/40",
          "bg-[#FBF8EF] text-[#292524] dark:bg-[#12141a] dark:text-[#f3f4f6]",
          // Mobile state
          isMobileSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0",
          // Desktop collapsed state
          isSidebarCollapsed ? "md:w-20" : "md:w-72",
        )}
      >
        {/* Top Brand Banner Card with Official JAAGO Logo and Yellow Neon Glow Border */}
        <div className="p-3">
          <div className="relative overflow-hidden rounded-2xl bg-[#FFC72C] p-1.5 text-black border-2 border-[#FFE500] shadow-[0_0_15px_rgba(255,229,0,0.7),0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_22px_rgba(255,229,0,0.9),0_0_40px_rgba(245,158,11,0.6)] transition-all duration-300 flex items-center justify-center">
            <Link href="/" className="flex items-center justify-center w-full">
              <img
                src="/jaago-logo.png"
                alt="JAAGO Foundation"
                className="w-full h-16 sm:h-20 object-contain rounded-xl"
              />
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-2 right-2 p-1 text-black/70 hover:text-black md:hidden"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto custom-sidebar-scroll text-xs">
          {/* ─── SECTION 1: DASHBOARD ────────────────────────────────────── */}
          <div className="space-y-1">
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Dashboard
              </div>
            )}

            {/* My Dashboard Expandable Header */}
            <button
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all shadow-sm",
                isDashboardOpen
                  ? "bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-black shadow-amber-500/20"
                  : "bg-amber-500/10 text-amber-500 dark:text-amber-400 hover:bg-amber-500/20",
              )}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 shrink-0" />
                {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                  <span className="text-sm font-semibold">My Dashboard</span>
                )}
              </div>
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                isDashboardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Expanded Dashboard Sub-menus */}
            {isDashboardOpen && (!isSidebarCollapsed || isMobileSidebarOpen) && (
              <div className="pt-1.5 pl-2 space-y-1 border-l-2 border-amber-300/40 dark:border-amber-500/20 ml-2">
                {/* 1. Overview */}
                <Link
                  href="/"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all text-xs",
                    pathname === "/"
                      ? "bg-amber-200/80 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  <LayoutGrid className="w-4 h-4 text-amber-500" />
                  <span>Overview</span>
                </Link>

                {/* 2. Requests Collapsible */}
                <div>
                  <button
                    onClick={() => setIsRequestsOpen(!isRequestsOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">Requests</span>
                    </div>
                    {isRequestsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isRequestsOpen && (
                    <div className="pl-4 pt-1 space-y-0.5 border-l border-border/40 ml-2">
                      {requestSubItems.map((sub) => {
                        const Icon = sub.icon;
                        const isActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all",
                              isActive
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Attendance & Leave Collapsible */}
                <div>
                  <button
                    onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">Attendance & Leave</span>
                    </div>
                    {isAttendanceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isAttendanceOpen && (
                    <div className="pl-4 pt-1 space-y-0.5 border-l border-border/40 ml-2">
                      {attendanceSubItems.map((sub) => {
                        const Icon = sub.icon;
                        const isActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all",
                              isActive
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Organization Collapsible */}
                <div>
                  <button
                    onClick={() => setIsOrgOpen(!isOrgOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">Organization</span>
                    </div>
                    {isOrgOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isOrgOpen && (
                    <div className="pl-4 pt-1 space-y-0.5 border-l border-border/40 ml-2">
                      {organizationSubItems.map((sub) => {
                        const Icon = sub.icon;
                        const isActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all",
                              isActive
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── SECTION 2: DEPARTMENTS ──────────────────────────────────── */}
          <div className="space-y-1 pt-2">
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Departments
              </div>
            )}

            <div className="space-y-0.5">
              {departmentItems.map((dept) => {
                const Icon = dept.icon;
                const isActive = pathname === dept.href;
                return (
                  <Link
                    key={dept.name}
                    href={dept.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                      isActive
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                    )}
                    title={isSidebarCollapsed ? dept.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-muted-foreground group-hover:text-amber-500" />
                    {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                      <span className="truncate">{dept.name}</span>
                    )}
                  </Link>
                );
              })}

              {/* ─── Department Item: Admin & Observability (Expandable Accordion) ─── */}
              <div>
                <button
                  onClick={() => setIsAdminObservabilityOpen(!isAdminObservabilityOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all group",
                    pathname?.startsWith("/admin")
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                  title={isSidebarCollapsed ? "Admin & Observability" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" />
                    {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                      <span className="truncate">Admin & Observability</span>
                    )}
                  </div>
                  {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                    isAdminObservabilityOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {(!isSidebarCollapsed || isMobileSidebarOpen) && isAdminObservabilityOpen && (
                  <div className="pl-4 pt-1 space-y-0.5 border-l border-border/40 ml-4 my-0.5">
                    {adminObservabilitySubItems.map((sub) => {
                      const Icon = sub.icon;
                      const isActive =
                        sub.href === "/admin/observability"
                          ? pathname === "/admin/observability"
                          : pathname === "/admin/settings" && (typeof window !== "undefined" ? window.location.search.includes(sub.href.split("?")[1] || "") : false);
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all",
                            isActive
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* ─── SECTION 3: BOTTOM QUICK ACTION DOCK ───────────────────────── */}
        <div className="p-3 border-t border-border/40 bg-black/5 dark:bg-black/20 flex flex-col gap-2">
          {(!isSidebarCollapsed || isMobileSidebarOpen) && (
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/reports"
                className="w-10 h-10 rounded-xl bg-[#855D29] hover:bg-[#996B2E] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                title="Internal Communications"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
              <Link
                href="/admin/settings"
                className="w-10 h-10 rounded-xl bg-[#292524] dark:bg-[#1E293B] hover:bg-[#3D3835] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                title="Email & Notifications"
              >
                <Mail className="w-4 h-4" />
              </Link>
              <Link
                href="/hr/leave"
                className="w-10 h-10 rounded-xl bg-[#855D29] hover:bg-[#996B2E] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                title="Calendar & Scheduling"
              >
                <Calendar className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebarCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
