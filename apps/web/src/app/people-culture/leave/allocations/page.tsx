"use client";

import { Plus } from "lucide-react";

export default function PCLeaveAllocationsPage() {
  const quotas = [
    { type: "Casual Leave (CL)", annual: "14 Days", accrued: "1.16 / month", carryForward: "No", encashable: "No" },
    { type: "Sick Leave (SL)", annual: "14 Days", accrued: "1.16 / month", carryForward: "No", encashable: "No" },
    { type: "Earned / Annual Leave (AL)", annual: "18 Days", accrued: "1.5 / month", carryForward: "Up to 30 Days", encashable: "Yes" },
    { type: "Maternity Leave", annual: "112 Days (16 Wks)", accrued: "Full on approval", carryForward: "No", encashable: "No" },
    { type: "Paternity Leave", annual: "7 Days", accrued: "Full on approval", carryForward: "No", encashable: "No" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Leave Allocations & Quotas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Annual quota balances, accrual rules, and leave carry-forward settings.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Adjust Quota</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Leave Category</th>
              <th className="py-3 px-4 text-center">Annual Allowance</th>
              <th className="py-3 px-4 text-center">Accrual Frequency</th>
              <th className="py-3 px-4 text-center">Carry Forward Limit</th>
              <th className="py-3 px-4 text-center">Encashment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {quotas.map((q, idx) => (
              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">{q.type}</td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">{q.annual}</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">{q.accrued}</td>
                <td className="py-3.5 px-4 text-center text-foreground">{q.carryForward}</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">{q.encashable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
