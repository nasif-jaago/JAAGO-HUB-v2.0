"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Team {
  id: string;
  name: string;
  department: string;
  leadName: string;
  memberCount: number;
}

export default function PCTeamsPage() {
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["pc", "teams"],
    queryFn: () => apiClient<Team[]>("/v1/people-culture/teams"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Teams</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Cross-functional units, project pods, and specialized teams.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Team</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((tm) => (
          <div key={tm.id} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{tm.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{tm.department}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-amber-600 dark:text-amber-400">
                {tm.memberCount} Members
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
              <span className="text-muted-foreground">Team Lead: <strong className="text-foreground">{tm.leadName}</strong></span>
              <div className="flex items-center gap-1">
                <button className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                <button className="p-1 text-rose-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
