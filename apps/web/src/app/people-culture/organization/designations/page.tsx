"use client";

import { useQuery } from "@tanstack/react-query";
import { Briefcase, Plus, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Designation {
  id: string;
  title: string;
  department: string;
  grade: string;
  employeeCount: number;
}

export default function PCDesignationsPage() {
  const { data: designations = [] } = useQuery<Designation[]>({
    queryKey: ["pc", "designations"],
    queryFn: () => apiClient<Designation[]>("/v1/people-culture/designations"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Designations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage organizational hierarchy, roles, job grades, and rank tiers.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Designation</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Designation Title</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4 text-center">Job Grade</th>
              <th className="py-3 px-4 text-center">Employees Assigned</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {designations.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                  <span>{d.title}</span>
                </td>
                <td className="py-3.5 px-4 text-foreground">{d.department}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-muted font-mono font-bold">{d.grade}</span>
                </td>
                <td className="py-3.5 px-4 text-center font-bold font-mono text-amber-600 dark:text-amber-400">
                  {d.employeeCount}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="p-1 text-muted-foreground hover:text-foreground mr-1"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button className="p-1 text-rose-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
