"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, User } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Announcement {
  id: string;
  title: string;
  category: "General" | "Policy" | "Event" | "Holiday";
  content: string;
  publishedAt: string;
  targetDepartment: string;
  author: string;
}

export default function PCAnnouncementsPage() {
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["pc", "announcements"],
    queryFn: () => apiClient<Announcement[]>("/v1/people-culture/announcements"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Announcements & Notices</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Official organizational circulars, townhalls, and HR policy broadcasts.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>+ Post Announcement</span>
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {ann.category}
                </span>
                <span className="text-xs text-muted-foreground">• {ann.targetDepartment}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{ann.publishedAt}</span>
            </div>

            <h3 className="text-base font-bold text-foreground">{ann.title}</h3>
            <p className="text-xs text-foreground/80 leading-relaxed">{ann.content}</p>

            <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Published by: <strong>{ann.author}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
