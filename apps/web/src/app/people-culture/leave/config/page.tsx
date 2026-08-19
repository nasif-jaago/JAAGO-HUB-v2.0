"use client";

import { Sliders, Save } from "lucide-react";

export default function PCLeaveConfigPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Leave Policy Configuration</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Rules, multi-tier approval chains, and automated encashment policies.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Save className="w-3.5 h-3.5" />
          <span>Save Configuration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            Approval Chain Rules
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <span>Require Line Manager Approval</span>
              <input type="checkbox" defaultChecked className="rounded accent-amber-500 w-4 h-4" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <span>Require Head of Department Approval (&gt; 3 Days)</span>
              <input type="checkbox" defaultChecked className="rounded accent-amber-500 w-4 h-4" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <span>HR Partner Verification on Medical Leaves</span>
              <input type="checkbox" defaultChecked className="rounded accent-amber-500 w-4 h-4" />
            </label>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            Encashment & Notice Periods
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Minimum Advance Notice for Casual Leave</label>
              <input type="text" defaultValue="24 Hours" className="w-full px-3 py-1.5 rounded-lg border border-border bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Max Annual Leave Carry Forward Limit</label>
              <input type="text" defaultValue="30 Days" className="w-full px-3 py-1.5 rounded-lg border border-border bg-background" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
