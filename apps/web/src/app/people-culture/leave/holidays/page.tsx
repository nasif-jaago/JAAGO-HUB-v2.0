"use client";

import { Palmtree, Plus } from "lucide-react";

export default function PCPublicHolidaysPage() {
  const holidays = [
    { name: "Shaheed Day & International Mother Language Day", date: "21 Feb 2026", type: "National Holiday", jurisdiction: "Bangladesh" },
    { name: "Independence Day of Bangladesh", date: "26 Mar 2026", type: "National Holiday", jurisdiction: "Bangladesh" },
    { name: "Bengali New Year (Pohela Boishakh)", date: "14 Apr 2026", type: "Festival", jurisdiction: "Bangladesh" },
    { name: "May Day", date: "01 May 2026", type: "International", jurisdiction: "Global" },
    { name: "Eid-ul-Fitr Holidays", date: "19-23 Mar 2026", type: "Religious", jurisdiction: "Bangladesh / Global" },
    { name: "Eid-ul-Adha Holidays", date: "27-31 May 2026", type: "Religious", jurisdiction: "Bangladesh / Global" },
    { name: "Victory Day", date: "16 Dec 2026", type: "National Holiday", jurisdiction: "Bangladesh" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Public Holidays 2026</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Official gazetted public holidays and entity-specific regional observances.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Holiday</span>
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4">Holiday Name</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Entity / Jurisdiction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {holidays.map((h, idx) => (
              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                  <Palmtree className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{h.name}</span>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{h.date}</td>
                <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-muted font-semibold">{h.type}</span></td>
                <td className="py-3.5 px-4 text-foreground">{h.jurisdiction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
