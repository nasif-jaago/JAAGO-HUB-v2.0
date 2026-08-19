"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface HRRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  requestType: "NOC" | "Salary Certificate" | "Tax Document" | "ID Card" | "Transfer";
  details: string;
  status: "Submitted" | "In Review" | "Approved" | "Rejected";
  submittedAt: string;
}

export default function PCRequestsPage() {
  const { data: requests = [] } = useQuery<HRRequest[]>({
    queryKey: ["pc", "requests"],
    queryFn: () => apiClient<HRRequest[]>("/v1/people-culture/requests"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Employee Requests</h1>
          <p className="text-xs text-muted-foreground mt-0.5">NOC letters, salary certificates, tax documents, and job transfers.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Submit Request</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Applicant</th>
              <th className="py-3 px-4">Request Type</th>
              <th className="py-3 px-4">Details / Purpose</th>
              <th className="py-3 px-4">Submitted Date</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">{r.employeeName}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">
                    {r.requestType}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-foreground">{r.details}</td>
                <td className="py-3.5 px-4 font-mono text-muted-foreground">{r.submittedAt}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    {r.status}
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
