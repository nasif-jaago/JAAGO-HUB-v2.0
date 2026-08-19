"use client";

import { Shield, Bell, Save } from "lucide-react";

export default function PCSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">HR Settings & RBAC Policy</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Control permissions, automated workflows, and global People & Culture preferences.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            Module RBAC Enforcement
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <div>
                <div className="font-bold text-foreground">Strict Supabase Session Validation</div>
                <div className="text-[11px] text-muted-foreground">Verify JWT token before accessing employee compensation</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded accent-amber-500 w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <div>
                <div className="font-bold text-foreground">Audit Log for All Record Modifications</div>
                <div className="text-[11px] text-muted-foreground">Record user IP, timestamp, and changes made to HR profiles</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded accent-amber-500 w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <div>
                <div className="font-bold text-foreground">Employee Self-Service (ESS) Portal</div>
                <div className="text-[11px] text-muted-foreground">Allow employees to view their own pay slip & attendance</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded accent-amber-500 w-4 h-4" />
            </label>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            Automated Notification Alerts
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <div>
                <div className="font-bold text-foreground">Daily Absenteeism Digest to Line Managers</div>
                <div className="text-[11px] text-muted-foreground">Dispatched at 10:30 AM every morning via SMTP</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded accent-amber-500 w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
              <div>
                <div className="font-bold text-foreground">Probation Confirmation Reminders</div>
                <div className="text-[11px] text-muted-foreground">Alert HR partner 15 days before 90-day probation end</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded accent-amber-500 w-4 h-4" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
