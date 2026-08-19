"use client";

import { useQuery } from "@tanstack/react-query";
import { Target, Plus, Calendar, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Project {
  id: string;
  name: string;
  donor: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Planning";
  assignedCount: number;
}

export default function PCProjectsPage() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["pc", "projects"],
    queryFn: () => apiClient<Project[]>("/v1/people-culture/projects"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Projects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Funded grant initiatives, programs, and staff allocation.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{p.name}</h3>
                  <p className="text-[11px] text-muted-foreground">Donor: {p.donor}</p>
                </div>
              </div>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                {p.status}
              </span>
            </div>

            <div className="text-xs space-y-1 pt-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Timeline:</span>
                <span className="font-mono">{p.startDate} ~ {p.endDate}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Assigned Workforce:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{p.assignedCount} Personnel</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/60">
              <button className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
              <button className="p-1 text-rose-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
