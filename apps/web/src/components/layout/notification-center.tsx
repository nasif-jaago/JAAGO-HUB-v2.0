"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface NotificationItem {
  id: string;
  userId: string;
  orgId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "action_required";
  actionUrl?: string | undefined;
  isRead: boolean;
  createdAt: string;
}

interface NotificationResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export function NotificationCenter() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data = { items: [], unreadCount: 0 }, isLoading } = useQuery<NotificationResponse>({
    queryKey: ["notifications"],
    queryFn: () => apiClient<NotificationResponse>("/v1/notifications"),
    refetchInterval: 15000, // Poll every 15s for live updates
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient<NotificationItem>(`/v1/notifications/${id}/read`, {
        method: "PUT",
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<NotificationResponse>(["notifications"], (old) => {
        if (!old) return old;
        return {
          items: old.items.map((n) => (n.id === updated.id ? updated : n)),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiClient<{ success: boolean; updatedCount: number }>("/v1/notifications/read-all", {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.setQueryData<NotificationResponse>(["notifications"], (old) => {
        if (!old) return old;
        return {
          items: old.items.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });
    },
  });

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case "action_required":
        return <AlertCircle className="w-4 h-4 text-jaago-red shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {data.unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-jaago-red rounded-full ring-2 ring-background animate-pulse">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-card border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                {data.unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-primary/20 text-primary rounded-full">
                    {data.unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {data.unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-border/20">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Loading notifications...
                </div>
              ) : data.items.length === 0 ? (
                <div className="p-8 text-center space-y-1">
                  <p className="text-xs font-semibold text-foreground">All caught up!</p>
                  <p className="text-[11px] text-muted-foreground">No notifications at this time.</p>
                </div>
              ) : (
                data.items.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors flex items-start gap-3 ${
                      n.isRead ? "bg-background/40 hover:bg-secondary/20" : "bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <div className="pt-0.5">{getIcon(n.type)}</div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className={`text-xs ${n.isRead ? "font-medium text-foreground" : "font-bold text-foreground"}`}>
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <button
                            onClick={() => markAsReadMutation.mutate(n.id)}
                            className="text-[10px] text-primary hover:underline whitespace-nowrap shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {n.actionUrl && (
                          <Link
                            href={n.actionUrl}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
