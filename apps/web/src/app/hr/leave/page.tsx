"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  FileText,
  Palmtree,
  Stethoscope,
  Coffee,
  Baby,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface LeaveBalance {
  leaveType: "ANNUAL" | "SICK" | "CASUAL" | "MATERNITY";
  totalQuota: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

interface LeaveApplication {
  id: string;
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approverComment?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export default function LeavePage() {
  const queryClient = useQueryClient();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Apply Form State
  const [formData, setFormData] = useState({
    leaveType: "ANNUAL",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    totalDays: 2,
    reason: "",
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: balances = [] } = useQuery<LeaveBalance[]>({
    queryKey: ["leave-balances"],
    queryFn: () => apiClient<LeaveBalance[]>("/v1/hr/leave/balances"),
  });

  const { data: applications = [], isLoading } = useQuery<LeaveApplication[]>({
    queryKey: ["leave-applications"],
    queryFn: () => apiClient<LeaveApplication[]>("/v1/hr/leave/applications"),
  });

  // ─── Mutation ──────────────────────────────────────────────────────────────

  const applyMutation = useMutation({
    mutationFn: (payload: typeof formData) =>
      apiClient<LeaveApplication>("/v1/hr/leave/applications", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setIsApplyModalOpen(false);
      setFormData({
        leaveType: "ANNUAL",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        totalDays: 2,
        reason: "",
      });
      notify("success", `Leave request for ${app.totalDays} day(s) submitted to line manager!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const getLeaveIcon = (type: string) => {
    switch (type) {
      case "ANNUAL":
        return <Palmtree className="w-5 h-5 text-emerald-400" />;
      case "SICK":
        return <Stethoscope className="w-5 h-5 text-rose-400" />;
      case "CASUAL":
        return <Coffee className="w-5 h-5 text-amber-400" />;
      case "MATERNITY":
        return <Baby className="w-5 h-5 text-purple-400" />;
      default:
        return <CalendarDays className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave & Time-Off Management"
        subtitle="View annual leave quotas, track pending applications, and request time off with automated supervisor sign-off."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Leave Quotas</span>
          </div>
        }
        actions={
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        }
      />

      {/* Notification Toast */}
      {statusNotification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
            statusNotification.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-destructive/15 border border-destructive/30 text-destructive"
          }`}
        >
          {statusNotification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusNotification.msg}</span>
        </div>
      )}

      {/* Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => (
          <div key={b.leaveType} className="glass-card p-5 rounded-2xl border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{b.leaveType} LEAVE</span>
              <div className="p-2 rounded-xl bg-secondary/50 border border-border/40">
                {getLeaveIcon(b.leaveType)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-foreground">{b.availableDays}</span>
                <span className="text-xs text-muted-foreground">days available</span>
              </div>

              <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (b.usedDays / b.totalQuota) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Used: <strong>{b.usedDays}</strong> / {b.totalQuota}</span>
                {b.pendingDays > 0 && <span className="text-amber-400 font-medium">{b.pendingDays} pending</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leave Application History Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span>My Leave Applications & Team Records</span>
        </h3>

        <div className="glass-card rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">Duration & Dates</th>
                  <th className="p-4">Reason / Notes</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading leave requests...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No leave requests filed yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-medium text-foreground">
                        <div>{app.employeeName}</div>
                        <span className="font-mono text-[10px] text-muted-foreground">{app.employeeCode}</span>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30">
                          {app.leaveType}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-foreground">{app.totalDays} Day(s)</div>
                        <div className="text-[11px] text-muted-foreground">
                          {app.startDate} → {app.endDate}
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="line-clamp-2 text-muted-foreground max-w-xs">{app.reason}</p>
                        {app.approverComment && (
                          <span className="text-[10px] text-emerald-400 font-medium block pt-0.5">
                            Remark: {app.approverComment}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            app.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : app.status === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-destructive/15 text-destructive border border-destructive/30"
                          }`}
                        >
                          {app.status === "APPROVED" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : app.status === "REJECTED" ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{app.status}</span>
                        </span>
                      </td>

                      <td className="p-4 text-muted-foreground text-[11px]">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── MODAL: APPLY FOR LEAVE ─────────────────────────────────────────── */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Submit Leave Application</span>
              </h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyMutation.mutate(formData);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Leave Category</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="ANNUAL">Annual Leave (10 days available)</option>
                  <option value="SICK">Sick Leave (12 days available)</option>
                  <option value="CASUAL">Casual Leave (8 days available)</option>
                  <option value="MATERNITY">Maternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Total Days Count</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={formData.totalDays}
                  onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Reason & Emergency Handover</label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain the purpose of leave and handover instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
