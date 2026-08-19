"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, ShieldCheck, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface InsuranceInfo {
  id: string;
  policyNumber: string;
  provider: string;
  coverageType: string;
  eligibleCount: number;
  validUntil: string;
}

export default function PCInsurancePage() {
  const { data: insurance = [] } = useQuery<InsuranceInfo[]>({
    queryKey: ["pc", "insurance"],
    queryFn: () => apiClient<InsuranceInfo[]>("/v1/people-culture/insurance"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Insurance Information</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Corporate group health, accidental life, and critical care policies.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Policy</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insurance.map((ins) => (
          <div key={ins.id} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{ins.provider}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">Policy: {ins.policyNumber}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                ACTIVE
              </span>
            </div>

            <div className="text-xs space-y-1 pt-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Coverage:</span>
                <strong className="text-foreground">{ins.coverageType}</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Enrolled Staff:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{ins.eligibleCount} Employees</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Valid Until:</span>
                <span className="font-mono">{ins.validUntil}</span>
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
