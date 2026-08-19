"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PCLeaveCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Leave Calendar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visual organization-wide absence calendar and scheduled holidays.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs font-bold font-mono px-3">August 2026</span>
          <button className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground pb-4 border-b border-border/60">
          <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
        </div>
        <div className="grid grid-cols-7 gap-2 pt-4 min-h-[400px]">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <div key={day} className={`p-2 min-h-[70px] rounded-xl border border-border/50 bg-background/50 flex flex-col justify-between ${day === 19 ? "ring-2 ring-amber-500" : ""}`}>
              <span className="text-xs font-bold font-mono text-muted-foreground">{day}</span>
              {day === 20 && (
                <span className="text-[10px] p-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold truncate">Abdul Aziz (CL)</span>
              )}
              {day === 21 && (
                <span className="text-[10px] p-1 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold truncate">Imran (SL)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
