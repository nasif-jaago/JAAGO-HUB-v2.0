"use client";

import { Download } from "lucide-react";

export default function PCAttendanceReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Attendance Intelligence Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Aggregate workforce punctuality, absenteeism trends, and timesheet exports.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Download className="w-3.5 h-3.5" />
          <span>Export Timesheet (.XLSX)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase">Average Punctuality Rate</div>
          <div className="text-2xl font-black text-emerald-600">93.4%</div>
          <p className="text-[11px] text-muted-foreground">Across all 741 registered global staff</p>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase">Average Daily Work Hours</div>
          <div className="text-2xl font-black text-amber-600">8.25 hrs</div>
          <p className="text-[11px] text-muted-foreground">Standard 8h working baseline</p>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase">Late Arrivals This Month</div>
          <div className="text-2xl font-black text-rose-600">142 Cases</div>
          <p className="text-[11px] text-muted-foreground">-8% lower than previous cycle</p>
        </div>
      </div>
    </div>
  );
}
