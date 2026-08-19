"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Download } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: "On-Time" | "Late" | "Half-Day" | "Absent";
  location: string;
  deviceType: "Biometric" | "Mobile Geofence" | "Web Portal";
}

export default function PCAttendanceLogsPage() {
  const { data: logs = [], isLoading, refetch } = useQuery<AttendanceLog[]>({
    queryKey: ["pc", "attendance-logs"],
    queryFn: () => apiClient<AttendanceLog[]>("/v1/people-culture/attendance/logs"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Attendance Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live check-in records from biometric hardware, geofenced mobile apps, and portal.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground shadow-xs">
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export Log</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Check-In</th>
              <th className="py-3 px-4">Check-Out</th>
              <th className="py-3 px-4">Branch Location</th>
              <th className="py-3 px-4">Capture Device</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">{l.employeeName}</td>
                <td className="py-3.5 px-4 font-mono text-muted-foreground">{l.date}</td>
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{l.checkIn}</td>
                <td className="py-3.5 px-4 font-mono text-muted-foreground">{l.checkOut || "—"}</td>
                <td className="py-3.5 px-4 text-foreground">{l.location}</td>
                <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-muted font-mono">{l.deviceType}</span></td>
                <td className="py-3.5 px-4 text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    l.status === "On-Time" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                  }`}>
                    {l.status}
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
