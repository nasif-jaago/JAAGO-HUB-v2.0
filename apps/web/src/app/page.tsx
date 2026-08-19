"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Building2,
  User,
  Inbox,
  Award,
  Zap,
  Info,
  Timer,
  LogOut,
  ChevronRight,
  Calculator,
  Flame,
  Heart,
  Users,
  Target,
} from "lucide-react";

export default function DashboardPage() {
  const [showTaxModal, setShowTaxModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      if (view === "people-hub-portal" || view === "people-and-culture") {
        router.push("/people-culture/dashboard");
      }
    }
  }, [router]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── BREADCRUMB ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Dashboards</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-semibold">My Dashboard</span>
      </div>

      {/* ─── USER PROFILE BANNER CARD ────────────────────────────────────────── */}
      <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Side: Avatar + Details */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 p-0.5 shadow-md">
                <div className="w-full h-full rounded-2xl bg-black/90 flex items-center justify-center text-amber-400 font-bold text-2xl overflow-hidden">
                  <User className="w-10 h-10 text-amber-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#181B22]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  Nasif Kamal
                </h1>
              </div>
              <p className="text-xs font-semibold text-muted-foreground">Coordinator</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>JAAGO Foundation Trust</span>
                </div>
                <span>•</span>
                <span>Founder&apos;s Office</span>
                <span>•</span>
                <span>Manager: S M Nayeem Rahman</span>
              </div>
            </div>
          </div>

          {/* Right Side: Biometric Clock-in Status */}
          <div className="flex items-center gap-3 shrink-0">
            {/* IN Badge */}
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500 animate-ping mb-1" />
              <span className="text-[11px] font-extrabold tracking-wider">IN</span>
            </div>

            {/* Check In / Out Time Box */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-secondary/40 border border-border/40 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/80 border border-border/30">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">Check In</div>
                  <div className="font-mono font-bold text-foreground">--:--</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/80 border border-border/30">
                <LogOut className="w-4 h-4 text-rose-500" />
                <div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">Check Out</div>
                  <div className="font-mono font-bold text-foreground">--:--</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 1: METRIC KPI CARDS (4 CARDS) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Working Hours Today */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
              Target: 8.0h
            </span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Working Hours Today</div>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight mt-1">
              00:00:00
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2">
            Schedule: General Schedule (10:00 AM - 6:00 PM)
          </div>
        </div>

        {/* Card 2: On Duty Status */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Recent Request
            </span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">On Duty Status</div>
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
              4 <span className="text-lg font-bold text-muted-foreground">Pending</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2">
            Field visits & remote assignments
          </div>
        </div>

        {/* Card 3: Available Time Off */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/30">
              In balance
            </span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Available Time Off</div>
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
              63 <span className="text-lg font-bold text-muted-foreground">Days</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2">
            Annual, Sick & Casual leave balance
          </div>
        </div>

        {/* Card 4: Active Approvals */}
        <div className="rounded-3xl p-5 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30">
              Action required
            </span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Active Approvals</div>
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
              2
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2">
            Pending PR & Leave authorisations
          </div>
        </div>
      </div>

      {/* ─── ROW 2: ATTENDANCE SUMMARY + HOLIDAYS + ANNOUNCEMENTS ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Monthly Attendance Summary */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">Monthly Attendance Summary</h3>
            </div>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 tracking-wider">
              NEEDS IMPROVEMENT
            </span>
          </div>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/30 text-center">
              <div className="text-[9px] uppercase font-bold text-muted-foreground">Working Days</div>
              <div className="text-base font-black text-foreground mt-0.5">10 / 11</div>
              <div className="text-[8px] font-bold text-emerald-500 uppercase mt-0.5">PRESENT / TARGET</div>
            </div>

            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/30 text-center">
              <div className="text-[9px] uppercase font-bold text-muted-foreground">Late Days</div>
              <div className="text-base font-black text-rose-500 mt-0.5">4</div>
              <div className="text-[8px] font-bold text-rose-500 uppercase mt-0.5">LATE ENTRIES</div>
            </div>

            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/30 text-center">
              <div className="text-[9px] uppercase font-bold text-muted-foreground">Auto Check</div>
              <div className="text-base font-black text-amber-500 mt-0.5">4</div>
              <div className="text-[8px] font-bold text-amber-500 uppercase mt-0.5">AUTO CHECKOUTS</div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium text-muted-foreground mb-1">
                <span>On-Time Performance</span>
                <span className="font-bold text-foreground font-mono">60.0%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/60 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "60%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-muted-foreground mb-1">
                <span>Late Penalty</span>
                <span className="font-bold text-foreground font-mono">40.0%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/60 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "40%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-muted-foreground mb-1">
                <span>Auto Check-out Rate</span>
                <span className="font-bold text-foreground font-mono">40.0%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/60 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "40%" }} />
              </div>
            </div>
          </div>

          {/* Attendance Curve / Sparkline */}
          <div className="pt-2">
            <svg viewBox="0 0 300 90" className="w-full h-24 overflow-visible">
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 10,60 Q 50,55 90,60 T 170,25 T 230,55 T 290,20 L 290,90 L 10,90 Z"
                fill="url(#curveGrad)"
              />
              <path
                d="M 10,60 Q 50,55 90,60 T 170,25 T 230,55 T 290,20"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
              />
              {/* Data points */}
              <circle cx="10" cy="60" r="3.5" fill="#10B981" />
              <circle cx="50" cy="58" r="3.5" fill="#10B981" />
              <circle cx="90" cy="60" r="3.5" fill="#10B981" />
              <circle cx="130" cy="58" r="3.5" fill="#10B981" />
              <circle cx="170" cy="25" r="3.5" fill="#E11D48" />
              <circle cx="210" cy="60" r="3.5" fill="#10B981" />
              <circle cx="250" cy="25" r="3.5" fill="#10B981" />
              <circle cx="290" cy="20" r="3.5" fill="#E11D48" />
            </svg>
            <div className="flex justify-between text-[9px] font-mono text-muted-foreground pt-1">
              <span>01 Aug</span>
              <span>02 Aug</span>
              <span>04 Aug</span>
              <span>09 Aug</span>
              <span>10 Aug</span>
              <span>11 Aug</span>
              <span>13 Aug</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground border-t border-border/30 pt-3">
            <span>Avg Hours: <strong className="text-foreground">10.1h</strong></span>
            <span>Total Worked: <strong className="text-foreground">101.3h</strong></span>
          </div>
        </div>

        {/* Col 2: Upcoming Holidays */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">Upcoming Holidays</h3>
            </div>

            <div className="py-16 text-center text-xs text-muted-foreground">
              No upcoming holidays found
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-muted-foreground border-t border-border/30 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>This Week</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>This Month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Later</span>
            </div>
          </div>
        </div>

        {/* Col 3: HR Announcement Board */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">HR Announcement Board</h3>
            </div>

            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm text-foreground">All Caught Up!</div>
              <p className="text-xs text-muted-foreground max-w-xs">
                No active announcements for your department.
              </p>
            </div>
          </div>

          <div className="text-center border-t border-border/30 pt-3">
            <Link
              href="/reports"
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline tracking-wider"
            >
              EXPLORE ALL ARCHIVES
            </Link>
          </div>
        </div>
      </div>

      {/* ─── ROW 3: TAX ADVISOR + VOLUNTEERING + PERSONAL SUMMARY ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: TAX Advisor */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">TAX Advisor</h3>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs space-y-1.5">
              <div className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 tracking-wider">
                SMART TIP
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Submit your investment proofs to HR before the end of the quarter to optimize your tax savings.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowTaxModal(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D97706] text-black font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span>TAX Calculator</span>
            </button>

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Info className="w-3 h-3 text-muted-foreground shrink-0" />
              <span>Need expert help? Contact JAAGO Finance Desk.</span>
            </div>
          </div>
        </div>

        {/* Col 2: Volunteering & Achievements */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">Volunteering & Achievements</h3>
            </div>
            <button className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-black text-[10px] font-extrabold shadow-sm hover:bg-[#D97706] transition-colors">
              + ADD CARD
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Item 1 */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-bold">
                  CORE
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">Spotlight</div>
                <div className="text-[10px] text-muted-foreground">Featured Employee</div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-bold">
                  CORE
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">Volunteering Program</div>
                <div className="text-[10px] text-muted-foreground">Volunteer Activities</div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-bold">
                  CORE
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">Cultural Club</div>
                <div className="text-[10px] text-muted-foreground">Club Member</div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-bold">
                  CORE
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">Goals</div>
                <div className="text-[10px] text-muted-foreground">Q2 Achievement Goals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Personal Summary */}
        <div className="rounded-3xl p-6 bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-extrabold text-sm text-foreground">Personal Summary</h3>
          </div>

          <div className="space-y-3 text-xs divide-y divide-border/30">
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Joining Date</span>
              <span className="font-bold text-foreground font-mono">3/9/2025</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-muted-foreground">NID</span>
              <span className="font-bold text-foreground font-mono">5067229434</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-muted-foreground">Work Location</span>
              <span className="font-bold text-foreground">JAAGO Foundation, HQ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAX CALCULATOR MODAL ────────────────────────────────────────────── */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-3xl max-w-md w-full p-6 bg-white dark:bg-[#181B22] border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                <span>Bangladesh Income Tax Estimator</span>
              </h3>
              <button
                onClick={() => setShowTaxModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="font-bold text-amber-600 dark:text-amber-400">National Board of Revenue (NBR) Slab</div>
                <p className="text-muted-foreground">FY 2025-2026 standard individual tax rebate bracket (0% up to 3.5 Lakh BDT).</p>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Monthly Gross Salary (BDT)</label>
                <input
                  type="text"
                  defaultValue="65,000"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border/40 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold">Eligible Investment / DPS Proof (BDT)</label>
                <input
                  type="text"
                  defaultValue="120,000"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border/40 font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTaxModal(false)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-black font-extrabold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
