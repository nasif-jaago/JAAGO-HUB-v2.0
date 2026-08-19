"use client";

import { useQuery } from "@tanstack/react-query";
import { Layers, Plus, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Department {
  id: string;
  name: string;
  headName: string;
  employeeCount: number;
  costCenter: string;
}

export default function PCDepartmentsPage() {
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["pc", "departments"],
    queryFn: () => apiClient<Department[]>("/v1/people-culture/departments"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Departments</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Organizational divisions, budget cost centers, and department leaders.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Department</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{dept.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">{dept.costCenter}</p>
                </div>
              </div>
            </div>

            <div className="text-xs space-y-1 pt-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Department Head:</span>
                <strong className="text-foreground">{dept.headName}</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Headcount:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{dept.employeeCount} Staff</span>
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
