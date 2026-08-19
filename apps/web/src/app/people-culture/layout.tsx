"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Clock,
  Award,
  DollarSign,
  FileCheck2,
  BarChart3,
  Megaphone,
  Settings,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Sun,
  Moon,
  Building,
  Briefcase,
  Target,
  Layers,
  HeartHandshake,
  FileSpreadsheet,
  CalendarDays,
  ListOrdered,
  CalendarCheck,
  Palmtree,
  Sliders,
  History,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PCContextType {
  selectedOrg: string;
  setSelectedOrg: (org: string) => void;
}

const PCContext = createContext<PCContextType>({
  selectedOrg: "ALL",
  setSelectedOrg: () => {},
});

export const usePCOrganization = () => useContext(PCContext);

export default function PeopleCultureLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [selectedOrg, setSelectedOrg] = useState("ALL");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Collapsible sub-menus state
  const [isOrgOpen, setIsOrgOpen] = useState(pathname.includes("/organization"));
  const [isLeaveOpen, setIsLeaveOpen] = useState(pathname.includes("/leave"));
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(pathname.includes("/attendance"));

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  const navItems = [
    { name: "DASHBOARD", href: "/people-culture/dashboard", icon: LayoutDashboard },
    { name: "EMPLOYEES", href: "/people-culture/employees", icon: Users },
  ];

  const orgSubItems = [
    { name: "ORGANIZATION & BRANCHES", href: "/people-culture/organization/companies", icon: Building2 },
    { name: "DESIGNATIONS", href: "/people-culture/organization/designations", icon: Briefcase },
    { name: "TEAMS", href: "/people-culture/organization/teams", icon: Users },
    { name: "DEPARTMENTS", href: "/people-culture/organization/departments", icon: Layers },
    { name: "PROJECTS", href: "/people-culture/organization/projects", icon: Target },
    { name: "INSURANCE INFO", href: "/people-culture/organization/insurance", icon: HeartHandshake },
  ];

  const leaveSubItems = [
    { name: "LEAVE CALENDAR", href: "/people-culture/leave/calendar", icon: CalendarDays },
    { name: "LEAVE REQUESTS", href: "/people-culture/leave/requests", icon: CalendarCheck },
    { name: "ALLOCATIONS", href: "/people-culture/leave/allocations", icon: ListOrdered },
    { name: "PUBLIC HOLIDAYS", href: "/people-culture/leave/holidays", icon: Palmtree },
    { name: "LEAVE CONFIG", href: "/people-culture/leave/config", icon: Sliders },
  ];

  const attendanceSubItems = [
    { name: "ATTENDANCE LOGS", href: "/people-culture/attendance/logs", icon: History },
    { name: "ON DUTY LOGS", href: "/people-culture/attendance/on-duty", icon: Timer },
    { name: "ATTENDANCE REPORT", href: "/people-culture/attendance/reports", icon: FileSpreadsheet },
    { name: "WORKING HOURS & SCHEDULES", href: "/people-culture/attendance/schedules", icon: Clock },
  ];

  const singleNavItems = [
    { name: "APPRAISALS", href: "/people-culture/appraisals", icon: Award },
    { name: "PAYROLL", href: "/people-culture/payroll", icon: DollarSign },
    { name: "REQUESTS", href: "/people-culture/requests", icon: FileCheck2 },
    { name: "REPORTS", href: "/people-culture/reports", icon: BarChart3 },
    { name: "ANNOUNCEMENTS", href: "/people-culture/announcements", icon: Megaphone },
    { name: "SETTINGS", href: "/people-culture/settings", icon: Settings },
  ];

  return (
    <PCContext.Provider value={{ selectedOrg, setSelectedOrg }}>
      <div className="min-h-screen bg-[#FBF8EF] dark:bg-[#111317] text-[#292524] dark:text-[#f3f4f6] flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-white">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 h-14 bg-[#1f1610] text-[#fbf8ef] border-b border-amber-900/30 flex items-center justify-between px-4 sm:px-6 shadow-md">
          <div className="flex items-center gap-3">
            {/* P&C Brand Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f59e0b] text-black font-black flex items-center justify-center text-xs tracking-wider shadow-sm">
                P&C
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold tracking-wide text-white">People and Culture</div>
                <div className="text-[10px] text-amber-300/80 font-mono">v1.0 HR Management</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-amber-200/60 ml-4 font-mono">
              <span>People and Culture</span>
              <span>&gt;</span>
              <span className="text-amber-400 capitalize">
                {pathname.replace("/people-culture/", "").replace("/", " > ") || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Global Organization Selector */}
            <div className="relative">
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 text-amber-200 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer transition-colors"
              >
                <option value="ALL">🏢 All Organizations</option>
                <option value="JAAGO Foundation">JAAGO Foundation</option>
                <option value="JAAGO Foundation Trust">JAAGO Foundation Trust</option>
                <option value="JAAGO Foundation INC">JAAGO Foundation INC (US)</option>
                <option value="JAAGO Foundation UK">JAAGO Foundation UK</option>
              </select>
            </div>

            {/* Back to JAAGO HUB */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-black transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to JAAGO HUB</span>
            </Link>

            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg hover:bg-white/10 text-amber-200 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-amber-900/50">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-xs shadow-xs">
                NK
              </div>
            </div>
          </div>
        </header>

        {/* Body Container with Sidebar & Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left P&C Dedicated Sidebar */}
          <aside className="w-64 shrink-0 bg-[#F4EFE6] dark:bg-[#181a20] border-r border-border/60 flex flex-col justify-between overflow-y-auto">
            <div className="p-3 space-y-1">
              {/* Back to Hub shortcut button */}
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
                <span>BACK TO JAAGO HUB</span>
              </Link>

              {/* Main Top Nav Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href === "/people-culture/dashboard" && pathname === "/people-culture");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                      isActive
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* ORGANIZATION Collapsible Section */}
              <div>
                <button
                  onClick={() => setIsOrgOpen(!isOrgOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-amber-500" />
                    <span>ORGANIZATION</span>
                  </div>
                  {isOrgOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {isOrgOpen && (
                  <div className="pl-6 pr-1 pt-1 space-y-0.5 border-l-2 border-amber-500/30 ml-4">
                    {orgSubItems.map((sub) => {
                      const isActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                            isActive
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                          )}
                        >
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TIME OFF / LEAVE Collapsible Section */}
              <div>
                <button
                  onClick={() => setIsLeaveOpen(!isLeaveOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>TIME OFF</span>
                  </div>
                  {isLeaveOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {isLeaveOpen && (
                  <div className="pl-6 pr-1 pt-1 space-y-0.5 border-l-2 border-amber-500/30 ml-4">
                    {leaveSubItems.map((sub) => {
                      const isActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                            isActive
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                          )}
                        >
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ATTENDANCE Collapsible Section */}
              <div>
                <button
                  onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>ATTENDANCE</span>
                  </div>
                  {isAttendanceOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {isAttendanceOpen && (
                  <div className="pl-6 pr-1 pt-1 space-y-0.5 border-l-2 border-amber-500/30 ml-4">
                    {attendanceSubItems.map((sub) => {
                      const isActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                            isActive
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                          )}
                        >
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Other Single Nav Items */}
              {singleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                      isActive
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Profile Info */}
            <div className="p-3 border-t border-border/60 bg-[#eee8dc] dark:bg-[#14161b] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black text-white font-bold flex items-center justify-center text-xs shrink-0">
                N
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate text-foreground">Nasif Kamal</div>
                <div className="text-[10px] text-muted-foreground truncate">Super Admin | Coordinator</div>
              </div>
            </div>
          </aside>

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </PCContext.Provider>
  );
}
