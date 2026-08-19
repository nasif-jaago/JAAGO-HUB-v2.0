"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Appraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  period: string;
  selfRating: number;
  managerRating: number;
  status: "Draft" | "Submitted" | "Reviewed" | "Completed";
}

export default function PCAppraisalsPage() {
  const { data: appraisals = [] } = useQuery<Appraisal[]>({
    queryKey: ["pc", "appraisals"],
    queryFn: () => apiClient<Appraisal[]>("/v1/people-culture/appraisals"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Appraisals & Performance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">360-degree performance evaluation cycles, KPI goals, and talent grading.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Initiate Appraisal Cycle</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Appraisal Period</th>
              <th className="py-3 px-4 text-center">Self Rating</th>
              <th className="py-3 px-4 text-center">Manager Rating</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {appraisals.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">{a.employeeName}</td>
                <td className="py-3.5 px-4 text-foreground">{a.department}</td>
                <td className="py-3.5 px-4 font-mono text-muted-foreground">{a.period}</td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                  {a.selfRating} / 5.0
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {a.managerRating} / 5.0
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    {a.status}
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
