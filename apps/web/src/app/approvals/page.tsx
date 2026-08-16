"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertCircle,
  Building,
  Calendar,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface ApprovalTask {
  id: string;
  orgId: string;
  entityType: "LEAVE" | "PURCHASE_REQUISITION" | "EXPENSE_VOUCHER" | "RECRUITMENT";
  entityId: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  assignedApproverId?: string;
  assignedRole: string;
  tierLevel: number;
  totalTiers: number;
  amountOrValue?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  comment?: string;
  decisionBy?: string;
  decisionAt?: string;
  createdAt: string;
  delegatedToId?: string;
  delegatedToName?: string;
}

interface ApprovalStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  urgentCount: number;
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Decision modal state
  const [activeTaskForDecision, setActiveTaskForDecision] = useState<ApprovalTask | null>(null);
  const [decisionType, setDecisionType] = useState<"APPROVED" | "REJECTED" | "CHANGES_REQUESTED">("APPROVED");
  const [decisionComment, setDecisionComment] = useState("");

  // Delegate modal state
  const [activeTaskForDelegate, setActiveTaskForDelegate] = useState<ApprovalTask | null>(null);
  const [delegateName, setDelegateName] = useState("");
  const [delegateReason, setDelegateReason] = useState("");

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: tasks = [], isLoading } = useQuery<ApprovalTask[]>({
    queryKey: ["approvals-list"],
    queryFn: () => apiClient<ApprovalTask[]>("/v1/approvals"),
  });

  const { data: stats } = useQuery<ApprovalStats>({
    queryKey: ["approvals-stats"],
    queryFn: () => apiClient<ApprovalStats>("/v1/approvals/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const decisionMutation = useMutation({
    mutationFn: ({ taskId, decision, comment }: { taskId: string; decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED"; comment: string }) =>
      apiClient<ApprovalTask>(`/v1/approvals/${taskId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, comment }),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["approvals-list"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-stats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setActiveTaskForDecision(null);
      setDecisionComment("");
      notify("success", `Decision recorded: Task ${updated.title} is now ${updated.status} (Tier ${updated.tierLevel})`);
    },
    onError: (err) => notify("error", err.message),
  });

  const delegateMutation = useMutation({
    mutationFn: ({ taskId, delegateToName, reason }: { taskId: string; delegateToName: string; reason: string }) =>
      apiClient<ApprovalTask>(`/v1/approvals/${taskId}/delegate`, {
        method: "POST",
        body: JSON.stringify({ delegateToUserId: "usr_delegated", delegateToName, reason }),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["approvals-list"] });
      setActiveTaskForDelegate(null);
      setDelegateName("");
      setDelegateReason("");
      notify("success", `Authority for '${updated.title}' delegated to ${updated.delegatedToName}`);
    },
    onError: (err) => notify("error", err.message),
  });

  const filteredTasks = tasks.filter((t) => {
    if (selectedFilter === "ALL") return true;
    return t.entityType === selectedFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals & Authorizations"
        subtitle="Review and process multi-tier approvals for leave applications, procurement requisitions, and financial disbursements."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Workflow Engine</span>
          </div>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.pendingCount ?? tasks.filter((t) => t.status === "PENDING").length}</div>
          <span className="text-[11px] text-amber-400 font-medium">Requires immediate action</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Multi-Tier High Level</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.urgentCount ?? 1}</div>
          <span className="text-[11px] text-muted-foreground">Tier 2+ Executive Sign-offs</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Approved (MTD)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.approvedCount ?? 28}</div>
          <span className="text-[11px] text-emerald-400 font-medium">Fully processed</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Returned / Rejected</span>
            <XCircle className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.rejectedCount ?? 2}</div>
          <span className="text-[11px] text-muted-foreground">Audit feedback provided</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "ALL", label: "All Workflows" },
          { id: "LEAVE", label: "Leave Requests" },
          { id: "PURCHASE_REQUISITION", label: "Procurement PRs" },
          { id: "EXPENSE_VOUCHER", label: "Finance Vouchers" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedFilter === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="glass-card p-12 text-center text-sm text-muted-foreground">
            Loading approval queue...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No Pending Approvals</h3>
            <p className="text-xs text-muted-foreground">You are all caught up across all domain workflows.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isPending = task.status === "PENDING";
            return (
              <div
                key={task.id}
                className="glass-card p-5 rounded-2xl border space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30">
                        {task.entityType}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">#{task.entityId}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          task.status === "PENDING"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : task.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-destructive/15 text-destructive border border-destructive/30"
                        }`}
                      >
                        {task.status}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-medium border border-border/40">
                        Tier {task.tierLevel} of {task.totalTiers}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground pt-1">{task.title}</h3>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  </div>

                  {task.amountOrValue && (
                    <div className="sm:text-right">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        Value / Duration
                      </span>
                      <span className="text-sm font-bold text-primary font-mono">{task.amountOrValue}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/30 gap-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>Requester: <strong className="text-foreground">{task.requesterName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    {task.delegatedToName && (
                      <span className="text-amber-400 text-[11px] font-medium">
                        Delegated to {task.delegatedToName}
                      </span>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          setActiveTaskForDelegate(task);
                          setDelegateName("");
                          setDelegateReason("");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium border border-border/40 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Delegate</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTaskForDecision(task);
                          setDecisionType("REJECTED");
                          setDecisionComment("");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTaskForDecision(task);
                          setDecisionType("APPROVED");
                          setDecisionComment("");
                        }}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{task.tierLevel < task.totalTiers ? `Approve (Tier ${task.tierLevel})` : "Final Approve"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── MODAL: DECISION (APPROVE / REJECT) ──────────────────────────────── */}
      {activeTaskForDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              {decisionType === "APPROVED" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Confirm Approval</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-destructive" />
                  <span>Reject Request</span>
                </>
              )}
            </h3>

            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40 text-xs space-y-1">
              <div className="font-semibold text-foreground">{activeTaskForDecision.title}</div>
              <div className="text-muted-foreground">{activeTaskForDecision.amountOrValue} • Requester: {activeTaskForDecision.requesterName}</div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                decisionMutation.mutate({
                  taskId: activeTaskForDecision.id,
                  decision: decisionType,
                  comment: decisionComment,
                });
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {decisionType === "APPROVED" ? "Reviewer Note (Optional)" : "Reason for Rejection (Required)"}
                </label>
                <textarea
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder={decisionType === "APPROVED" ? "e.g. Budget verified and approved." : "e.g. Incomplete quotation documents attached."}
                  rows={3}
                  required={decisionType === "REJECTED"}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTaskForDecision(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={decisionMutation.isPending}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-60 ${
                    decisionType === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                      : "bg-destructive hover:bg-destructive/90 shadow-destructive/20"
                  }`}
                >
                  {decisionMutation.isPending ? "Submitting..." : decisionType === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELEGATION ──────────────────────────────────────────────── */}
      {activeTaskForDelegate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>Delegate Approval Authority</span>
            </h3>

            <p className="text-xs text-muted-foreground">
              Temporarily assign this decision to a deputy officer or designated replacement.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                delegateMutation.mutate({
                  taskId: activeTaskForDelegate.id,
                  delegateToName: delegateName,
                  reason: delegateReason,
                });
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Delegate Officer Name</label>
                <input
                  type="text"
                  value={delegateName}
                  onChange={(e) => setDelegateName(e.target.value)}
                  placeholder="e.g. Deputy Director (Finance)"
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Reason for Delegation</label>
                <textarea
                  value={delegateReason}
                  onChange={(e) => setDelegateReason(e.target.value)}
                  placeholder="e.g. Out of office on emergency field audit"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTaskForDelegate(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={delegateMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {delegateMutation.isPending ? "Delegating..." : "Confirm Delegation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
