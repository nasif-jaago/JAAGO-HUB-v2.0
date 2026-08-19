"use client";

import { Clock, Plus, Edit2 } from "lucide-react";

export default function PCWorkingSchedulesPage() {
  const shifts = [
    { name: "General HQ Schedule", time: "10:00 AM - 06:00 PM", grace: "15 mins", days: "Sunday - Thursday", staff: 180 },
    { name: "Digital School Morning Shift", time: "08:30 AM - 04:30 PM", grace: "10 mins", days: "Sunday - Thursday", staff: 340 },
    { name: "Digital School Afternoon Shift", time: "11:30 AM - 07:30 PM", grace: "10 mins", days: "Sunday - Thursday", staff: 195 },
    { name: "Global Chapter Flexible", time: "09:00 AM - 05:00 PM (Local)", grace: "30 mins", days: "Monday - Friday", staff: 26 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Working Hours & Schedules</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Define shift timings, grace periods, roster schedules, and weekend rules.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Shift</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shifts.map((s, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{s.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{s.days}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-amber-600 dark:text-amber-400">
                {s.staff} Assigned
              </span>
            </div>

            <div className="text-xs space-y-1 pt-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shift Hours:</span>
                <strong className="text-foreground font-mono">{s.time}</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Grace Period:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{s.grace}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-border/60">
              <button className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
