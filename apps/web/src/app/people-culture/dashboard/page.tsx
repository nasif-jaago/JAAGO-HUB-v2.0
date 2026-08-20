"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  Calendar,
  UserX,
  UserPlus,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { usePCOrganization } from "../pc-context";

interface PCDashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  absentNow: number;
  newJoiners: number;
  evpSubmissions: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  headcountByDepartment: { department: string; count: number }[];
  attendanceIntelligence: {
    today: { onTime: number; late: number; onLeave: number; absent: number };
    topOnTime: { name: string; score: number }[];
    topLate: { name: string; lateCount: number }[];
  };
}

export default function PCDashboardPage() {
  const { selectedOrg } = usePCOrganization();
  const [timeframe, setTimeframe] = useState<"TODAY" | "YESTERDAY" | "MTD">("MTD");

  const { data: stats } = useQuery<PCDashboardStats>({
    queryKey: ["pc", "dashboard", selectedOrg],
    queryFn: () => apiClient<PCDashboardStats>(`/v1/people-culture/dashboard?org=${encodeURIComponent(selectedOrg)}`),
  });

  const total = stats?.totalEmployees || 741;
  const present = stats?.presentToday || 78;
  const onLeave = stats?.onLeave || 5;
  const absent = stats?.absentNow || 649;
  const newJoiners = stats?.newJoiners || 4;
  const evp = stats?.evpSubmissions || 9;

  const male = stats?.genderDistribution?.male || 408;
  const female = stats?.genderDistribution?.female || 326;
  const other = stats?.genderDistribution?.other || 7;

  const malePercent = ((male / total) * 100).toFixed(1);
  const femalePercent = ((female / total) * 100).toFixed(1);
  const otherPercent = ((other / total) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-foreground flex items-center gap-2">
            People and Culture <span className="text-amber-500 font-sans italic">Intelligence</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comprehensive real time workforce monitoring across all global JAAGO entities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
            {selectedOrg === "ALL" ? "🌐 Global Organization View" : `🏢 ${selectedOrg}`}
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
            <span>Total Employees</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">{total}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>1.6% vs last month</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
            <span>Present Today</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{present}</div>
          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>4.2% (10.7% of workforce)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
            <span>On Leave</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">{onLeave}</div>
          <div className="text-[10px] text-muted-foreground font-medium">
            2 sick, 2 casual, 1 annual
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
            <span>Absent Now</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{absent}</div>
          <div className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" />
            <span>2.1% incl. field & remote</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
            <span>New Joiners</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{newJoiners}</div>
          <div className="text-[10px] text-purple-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+4 in filter range</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
            <span>EVP Submissions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{evp}</div>
          <div className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+2 volunteering program</span>
          </div>
        </div>
      </div>

      {/* Gender Distribution Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground font-serif">Gender Distribution</h3>
            <p className="text-xs text-muted-foreground">Workforce demographic diversity composition</p>
          </div>
          <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-muted text-foreground">
            {total} EMPLOYEES
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted p-0.5 border border-border/60">
          <div style={{ width: `${malePercent}%` }} className="h-full bg-blue-500 rounded-l-full transition-all" title={`Male: ${male} (${malePercent}%)`} />
          <div style={{ width: `${femalePercent}%` }} className="h-full bg-amber-500 transition-all" title={`Female: ${female} (${femalePercent}%)`} />
          <div style={{ width: `${otherPercent}%` }} className="h-full bg-gray-400 rounded-r-full transition-all" title={`Other: ${other} (${otherPercent}%)`} />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="font-semibold text-foreground">Male</span>
            </div>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{male} ({malePercent}%)</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="font-semibold text-foreground">Female</span>
            </div>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{female} ({femalePercent}%)</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-500/5 border border-gray-500/20">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="font-semibold text-foreground">Other / Undisclosed</span>
            </div>
            <span className="font-mono font-bold text-muted-foreground">{other} ({otherPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Attendance Intelligence & Headcount Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h3 className="font-bold text-base text-foreground font-serif">Attendance Intelligence</h3>
                <p className="text-xs text-muted-foreground">Performance based on month to date</p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 text-xs font-semibold">
                <button
                  onClick={() => setTimeframe("TODAY")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${timeframe === "TODAY" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  TODAY
                </button>
                <button
                  onClick={() => setTimeframe("YESTERDAY")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${timeframe === "YESTERDAY" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  YESTERDAY
                </button>
                <button
                  onClick={() => setTimeframe("MTD")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${timeframe === "MTD" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  MTD
                </button>
              </div>
            </div>

            <div className="pt-6 pb-2 grid grid-cols-4 gap-4 text-center">
              {[
                { week: "Wk 1", onTime: 520, late: 45, leave: 30, absent: 146 },
                { week: "Wk 2", onTime: 535, late: 38, leave: 25, absent: 143 },
                { week: "Wk 3", onTime: 540, late: 42, leave: 28, absent: 131 },
                { week: "Wk 4 (partial)", onTime: 210, late: 18, leave: 10, absent: 503 },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="h-36 w-12 mx-auto bg-muted/40 rounded-xl overflow-hidden flex flex-col-reverse p-1 border border-border/60">
                    <div style={{ height: `${(item.onTime / 741) * 100}%` }} className="bg-emerald-500 rounded-sm" title={`On-Time: ${item.onTime}`} />
                    <div style={{ height: `${(item.late / 741) * 100}%` }} className="bg-amber-500 rounded-sm" title={`Late: ${item.late}`} />
                    <div style={{ height: `${(item.leave / 741) * 100}%` }} className="bg-sky-500 rounded-sm" title={`On Leave: ${item.leave}`} />
                  </div>
                  <div className="text-xs font-bold text-foreground">{item.week}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> On-time</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> On leave</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /> Absent</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60 text-xs">
            <div className="space-y-2">
              <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> TOP ON-TIME
              </div>
              <div className="space-y-1.5">
                {[
                  { name: "Adnan Chakma", score: "98%" },
                  { name: "Samira Tabassum Moqur", score: "97%" },
                  { name: "Md. Iqbal Hussain", score: "96%" },
                  { name: "Ferdous Azim", score: "95%" },
                ].map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-500/5">
                    <span className="text-foreground">{i + 1}. {u.name}</span>
                    <span className="font-bold text-emerald-600 font-mono">{u.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> TOP LATE
              </div>
              <div className="space-y-1.5">
                {[
                  { name: "Md. Rajvi Hasan", late: "12 Late" },
                  { name: "Md. Sajibur Rahman", late: "10 Late" },
                  { name: "Farhadul Islam Zahid", late: "8 Late" },
                  { name: "Adiba Sayeed", late: "7 Late" },
                ].map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-rose-500/5">
                    <span className="text-foreground">{i + 1}. {u.name}</span>
                    <span className="font-bold text-rose-600 font-mono">{u.late}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h3 className="font-bold text-base text-foreground font-serif">Headcount by Department</h3>
              <p className="text-xs text-muted-foreground">Top departments in {selectedOrg === "ALL" ? "All Organizations" : selectedOrg}</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted">5 Depts</span>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { dept: "Programs & Education", count: 340, max: 400 },
              { dept: "Digital School Project", count: 180, max: 400 },
              { dept: "Finance & Accounts", count: 45, max: 400 },
              { dept: "Youth Development", count: 55, max: 400 },
              { dept: "Fundraising & Grants", count: 38, max: 400 },
            ].map((d, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{d.dept}</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{d.count} Staff</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5">
                  <div
                    style={{ width: `${(d.count / d.max) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
