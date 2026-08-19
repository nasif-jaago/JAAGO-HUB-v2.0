"use client";

import { Plus } from "lucide-react";

export default function PCOnDutyLogsPage() {
  const onDutyLogs = [
    { employee: "Abdullah Al Imran", destination: "Chittagong Digital School", purpose: "Solar classroom installation audit", start: "2026-08-18", end: "2026-08-20", status: "Approved" },
    { employee: "Abdullah Al Yousuf", destination: "Sylhet Tea Garden Schools", purpose: "Teacher training workshop", start: "2026-08-19", end: "2026-08-21", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">On Duty Movement Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Staff on official field duty, school visits, and external donor meetings.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Apply On-Duty</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Field Destination</th>
              <th className="py-3 px-4">Mission Purpose</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {onDutyLogs.map((d, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">{d.employee}</td>
                <td className="py-3.5 px-4 font-medium text-foreground">{d.destination}</td>
                <td className="py-3.5 px-4 text-muted-foreground">{d.purpose}</td>
                <td className="py-3.5 px-4 font-mono text-muted-foreground">{d.start} ~ {d.end}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
