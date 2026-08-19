"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "Draft" | "Processed" | "Disbursed";
}

export default function PCPayrollPage() {
  const { data: payroll = [] } = useQuery<PayrollEntry[]>({
    queryKey: ["pc", "payroll"],
    queryFn: () => apiClient<PayrollEntry[]>("/v1/people-culture/payroll"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Payroll & Compensation</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Salary structures, allowances, tax deductions, and bank disbursement sheets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground shadow-xs">
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bank Salary Advice</span>
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>+ Process Batch</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Pay Month</th>
              <th className="py-3 px-4 text-right">Basic Salary</th>
              <th className="py-3 px-4 text-right">Allowances</th>
              <th className="py-3 px-4 text-right">Deductions</th>
              <th className="py-3 px-4 text-right">Net Disbursement</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {payroll.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">{p.employeeName}</td>
                <td className="py-3.5 px-4 font-mono text-muted-foreground">{p.month}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">৳{p.basicSalary.toLocaleString()}</td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-600">+৳{p.allowances.toLocaleString()}</td>
                <td className="py-3.5 px-4 text-right font-mono text-rose-600">-৳{p.deductions.toLocaleString()}</td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                  ৳{p.netPay.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    {p.status}
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
