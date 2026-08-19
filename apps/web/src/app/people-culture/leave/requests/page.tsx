"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Check, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedAt: string;
}

export default function PCLeaveRequestsPage() {
  const { data: requests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["pc", "leave-requests"],
    queryFn: () => apiClient<LeaveRequest[]>("/v1/people-culture/leave/requests"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Leave Requests</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage workforce leave applications, approvals, and medical verifications.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Apply Leave</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Applicant</th>
              <th className="py-3 px-4">Leave Type</th>
              <th className="py-3 px-4">Dates & Duration</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">{r.employeeName}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">
                    {r.leaveType}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-muted-foreground">
                  {r.startDate} to {r.endDate} ({r.days} days)
                </td>
                <td className="py-3.5 px-4 text-foreground">{r.reason}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    r.status === "Approved" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {r.status === "Pending" ? (
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded" title="Approve"><Check className="w-4 h-4" /></button>
                      <button className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded" title="Reject"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
