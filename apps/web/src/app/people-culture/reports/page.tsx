"use client";

import { Download, FileSpreadsheet, Users, Calendar, Award } from "lucide-react";

export default function PCReportsPage() {
  const reports = [
    { title: "Monthly Headcount & Turnover Analysis", desc: "Detailed breakdown of new joiners, terminations, and attrition by department.", icon: Users, format: "PDF / XLSX" },
    { title: "Annual Leave Liability & Quota Accruals", desc: "Monetary liability calculation for accrued and encashable leaves.", icon: Calendar, format: "XLSX" },
    { title: "Performance Bell Curve & Grade Distribution", desc: "Appraisal rating spread across job tiers and cost centers.", icon: Award, format: "PDF / CSV" },
    { title: "Group Health Insurance Utilization", desc: "Claims processed, hospital admissions, and premium reconciliation.", icon: FileSpreadsheet, format: "XLSX" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">HR Analytics & Reports</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Enterprise human resource intelligence reports and compliance audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r, idx) => {
          const Icon = r.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{r.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="font-mono text-muted-foreground">{r.format}</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold transition-all">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
