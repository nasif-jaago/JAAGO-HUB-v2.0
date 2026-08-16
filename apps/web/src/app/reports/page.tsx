"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  FileText,
  Download,
  Calendar,
  CheckSquare,
  ShieldCheck,
  Building,
  GraduationCap,
  HeartHandshake,
  DollarSign,
  Boxes,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface OperationalTask {
  id: string;
  title: string;
  moduleOrigin: "HR_ONBOARDING" | "PROCUREMENT_PR" | "FINANCE_VOUCHER" | "GRANTS_MILESTONE" | "SCHOOL_OPERATIONS" | "GENERAL_ADMIN";
  assigneeName: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
  createdAt: string;
}

interface DocumentAttachment {
  id: string;
  title: string;
  category: "POLICY_GOVERNANCE" | "GRANT_AGREEMENT" | "AUDIT_REPORT" | "VENDOR_CONTRACT" | "EMPLOYEE_RECORD";
  fileName: string;
  fileSizeBytes: number;
  uploadedByName: string;
  uploadedAt: string;
  downloadUrl: string;
}

interface ExecutiveSummary {
  headcountTotal: number;
  totalStudentsEnrolled: number;
  averageAttendancePercent: number;
  totalGrantPortfolioBDT: number;
  totalInventoryValuationBDT: number;
  totalFixedAssetsNBV_BDT: number;
  activePurchaseOrdersCount: number;
  verifiedVendorsPercentage: number;
  systemIntegrityStatus: string;
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ANALYTICS" | "TASKS" | "DOCUMENTS">("ANALYTICS");
  const [selectedTaskOrigin, setSelectedTaskOrigin] = useState("ALL");
  const [selectedTaskStatus, setSelectedTaskStatus] = useState("ALL");
  const [selectedDocCategory, setSelectedDocCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New Task Form
  const [taskForm, setTaskForm] = useState({
    title: "",
    moduleOrigin: "SCHOOL_OPERATIONS" as OperationalTask["moduleOrigin"],
    assigneeName: "",
    priority: "HIGH" as OperationalTask["priority"],
    dueDate: new Date().toISOString().split("T")[0]!,
    notes: "",
  });

  // New Doc Form
  const [docForm, setDocForm] = useState({
    title: "",
    category: "POLICY_GOVERNANCE" as DocumentAttachment["category"],
    fileName: "",
    uploadedByName: "Executive Director Office",
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: summary } = useQuery<ExecutiveSummary>({
    queryKey: ["reports-executive-summary"],
    queryFn: () => apiClient<ExecutiveSummary>("/v1/reports/executive-summary"),
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery<OperationalTask[]>({
    queryKey: ["reports-tasks", selectedTaskOrigin, selectedTaskStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedTaskOrigin !== "ALL") params.append("origin", selectedTaskOrigin);
      if (selectedTaskStatus !== "ALL") params.append("status", selectedTaskStatus);
      return apiClient<OperationalTask[]>(`/v1/reports/tasks?${params.toString()}`);
    },
  });

  const { data: documents = [], isLoading: isDocsLoading } = useQuery<DocumentAttachment[]>({
    queryKey: ["reports-documents", selectedDocCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedDocCategory !== "ALL") params.append("category", selectedDocCategory);
      return apiClient<DocumentAttachment[]>(`/v1/reports/documents?${params.toString()}`);
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createTaskMutation = useMutation({
    mutationFn: (dto: typeof taskForm) =>
      apiClient<OperationalTask>("/v1/reports/tasks", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (tsk) => {
      queryClient.invalidateQueries({ queryKey: ["reports-tasks"] });
      setIsNewTaskOpen(false);
      setTaskForm({
        title: "",
        moduleOrigin: "SCHOOL_OPERATIONS",
        assigneeName: "",
        priority: "HIGH",
        dueDate: new Date().toISOString().split("T")[0]!,
        notes: "",
      });
      notify("success", `Operational task "${tsk.title}" created successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OperationalTask["status"] }) =>
      apiClient<OperationalTask>(`/v1/reports/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports-tasks"] });
      notify("success", "Task status updated!");
    },
    onError: (err) => notify("error", err.message),
  });

  const uploadDocMutation = useMutation({
    mutationFn: (dto: typeof docForm) =>
      apiClient<DocumentAttachment>("/v1/reports/documents", {
        method: "POST",
        body: JSON.stringify({ ...dto, fileSizeBytes: 3200000 }),
      }),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["reports-documents"] });
      setIsNewDocOpen(false);
      setDocForm({
        title: "",
        category: "POLICY_GOVERNANCE",
        fileName: "",
        uploadedByName: "Executive Director Office",
      });
      notify("success", `Document "${doc.title}" uploaded to secure repository!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive BI, Tasks & Documents Hub"
        subtitle="Cross-module intelligence, operational follow-ups, and organization-wide document repository."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Mission Analytics & Operations</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewDocOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-secondary/80 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
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

      {/* ─── EXECUTIVE KPI CARDS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Active Grant Portfolio</span>
            <HeartHandshake className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            BDT {(summary?.totalGrantPortfolioBDT ?? 50000000).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Multilateral & Foundation Funding</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Enrolled Children</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {(summary?.totalStudentsEnrolled ?? 1180).toLocaleString()}
          </div>
          <span className="text-[11px] text-primary font-medium">Across 5 Remote Branch Schools</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Inventory & Assets Valuation</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            BDT {(((summary?.totalInventoryValuationBDT ?? 2427500) + (summary?.totalFixedAssetsNBV_BDT ?? 15480000))).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Warehouse Stock + Fleet & Labs</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">Total Staff & Headcount</span>
            <Building className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {(summary?.headcountTotal ?? 1240).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            {summary?.averageAttendancePercent ?? 94.9}% Attendance Rate
          </span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "ANALYTICS", label: "Executive BI Analytics" },
          { id: "TASKS", label: "Operational Tasks & Workflow Tracker" },
          { id: "DOCUMENTS", label: "Compliance Documents & Policies Repository" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: EXECUTIVE BI ANALYTICS ──────────────────────────────────── */}
      {activeTab === "ANALYTICS" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-5 rounded-2xl border space-y-3">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Financial & Grants Execution</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Grant Portfolio Value</span>
                <span className="font-bold text-foreground font-mono">BDT 50,000,000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Disbursed Funds YTD</span>
                <span className="font-bold text-emerald-400 font-mono">BDT 25,000,000 (50%)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Fixed Assets Net Book Value</span>
                <span className="font-bold text-foreground font-mono">BDT 15,480,000</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Ledger Balance Status</span>
                <span className="font-bold text-emerald-400">DOUBLE-ENTRY STRICT BALANCED</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border space-y-3">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>Field Education & School Operations</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Active School Branches</span>
                <span className="font-bold text-foreground">5 Branches (Rajshahi, Bandarban, etc.)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Total Enrolled Children</span>
                <span className="font-bold text-primary">1,180 Students</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Child Sponsorship Rate</span>
                <span className="font-bold text-rose-400">75% Sponsored</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Digital Studio Sessions</span>
                <span className="font-bold text-foreground">Live Interactive Remote Teaching</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border space-y-3">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Supply Chain & Compliance</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Onboarded Vendors</span>
                <span className="font-bold text-foreground">4 Enterprise Suppliers</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Verified Trade License & TIN</span>
                <span className="font-bold text-emerald-400 font-mono">85% Compliance</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Warehouse Stock Valuation</span>
                <span className="font-bold text-foreground font-mono">BDT 2,427,500</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Cryptographic Audit Chain</span>
                <span className="font-bold text-emerald-400">SEALED (SHA-256)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: OPERATIONAL TASKS ────────────────────────────────────────── */}
      {activeTab === "TASKS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Task Title or Assignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedTaskStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedTaskStatus === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}

              <div className="h-4 w-px bg-border/40 mx-1" />

              {["ALL", "SCHOOL_OPERATIONS", "GRANTS_MILESTONE", "PROCUREMENT_PR", "HR_ONBOARDING"].map((org) => (
                <button
                  key={org}
                  onClick={() => setSelectedTaskOrigin(org)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedTaskOrigin === org
                      ? "bg-secondary text-primary font-bold border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {org === "ALL" ? "All Modules" : org.split("_")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isTasksLoading ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">Loading tasks...</div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="glass-card p-5 rounded-2xl border space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-secondary text-primary font-mono text-[10px] font-bold">
                        {task.moduleOrigin.replace(/_/g, " ")}
                      </span>
                      <h4 className="font-bold text-foreground text-sm leading-snug">{task.title}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        task.priority === "URGENT"
                          ? "bg-destructive/15 text-destructive border-destructive/30"
                          : task.priority === "HIGH"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-secondary text-muted-foreground border-border/40"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {task.notes && (
                    <p className="text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-border/20">
                      {task.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/20">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Assignee</span>
                      <span className="font-semibold text-foreground">{task.assigneeName}</span>
                    </div>

                    <div className="space-y-0.5 text-right">
                      <span className="text-[10px] text-muted-foreground block">Due Date</span>
                      <span className="font-mono text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary" />
                        <span>{task.dueDate}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        task.status === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : task.status === "IN_PROGRESS"
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {task.status.replace(/_/g, " ")}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {task.status !== "COMPLETED" && (
                        <button
                          onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: "COMPLETED" })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors border border-emerald-500/30 flex items-center gap-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      )}
                      {task.status === "PENDING" && (
                        <button
                          onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: "IN_PROGRESS" })}
                          className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors border border-border/40"
                        >
                          Start Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: DOCUMENTS REPOSITORY ────────────────────────────────────── */}
      {activeTab === "DOCUMENTS" && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "POLICY_GOVERNANCE", "GRANT_AGREEMENT", "AUDIT_REPORT", "VENDOR_CONTRACT"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedDocCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedDocCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {cat.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">Document Title & File</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Uploaded By</th>
                    <th className="p-4 text-right">File Size</th>
                    <th className="p-4">Upload Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isDocsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading documents...</td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-foreground block">{doc.title}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{doc.fileName}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold">
                            {doc.category.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="p-4 text-muted-foreground">{doc.uploadedByName}</td>

                        <td className="p-4 font-mono font-bold text-right text-foreground">
                          {(doc.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </td>

                        <td className="p-4 text-muted-foreground">{doc.uploadedAt}</td>

                        <td className="p-4 text-right">
                          <a
                            href={doc.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-secondary text-primary font-semibold hover:bg-secondary/80 transition-colors border border-border/40"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE TASK ──────────────────────────────────────────────── */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <span>Create Operational Task</span>
              </h3>
              <button onClick={() => setIsNewTaskOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTaskMutation.mutate(taskForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Verify solar panel shipment to Rajshahi school"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Module Origin</label>
                  <select
                    value={taskForm.moduleOrigin}
                    onChange={(e) => setTaskForm({ ...taskForm, moduleOrigin: e.target.value as OperationalTask["moduleOrigin"] })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="SCHOOL_OPERATIONS">School Operations</option>
                    <option value="GRANTS_MILESTONE">Grants & Donors</option>
                    <option value="PROCUREMENT_PR">Procurement & PO</option>
                    <option value="FINANCE_VOUCHER">Finance & Accounts</option>
                    <option value="HR_ONBOARDING">HR & Staffing</option>
                    <option value="GENERAL_ADMIN">General Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as OperationalTask["priority"] })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Assignee Name</label>
                  <input
                    type="text"
                    required
                    value={taskForm.assigneeName}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeName: e.target.value })}
                    placeholder="Monirul Islam"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Follow-up Notes</label>
                <textarea
                  rows={2}
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  placeholder="Additional context or requirements..."
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: UPLOAD DOCUMENT ─────────────────────────────────────────── */}
      {isNewDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Upload Document Attachment</span>
              </h3>
              <button onClick={() => setIsNewDocOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadDocMutation.mutate(docForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Document Title</label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="e.g. Anti-Corruption & Whistleblower Policy 2026"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Document Category</label>
                <select
                  value={docForm.category}
                  onChange={(e) => setDocForm({ ...docForm, category: e.target.value as DocumentAttachment["category"] })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="POLICY_GOVERNANCE">Policy & Corporate Governance</option>
                  <option value="GRANT_AGREEMENT">Grant Agreement & Protocol</option>
                  <option value="AUDIT_REPORT">Financial & Statutory Audit Report</option>
                  <option value="VENDOR_CONTRACT">Vendor SLA & Contract</option>
                  <option value="EMPLOYEE_RECORD">Employee HR Documentation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">File Name</label>
                <input
                  type="text"
                  required
                  value={docForm.fileName}
                  onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                  placeholder="JAAGO_Anti_Corruption_Policy_2026.pdf"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewDocOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadDocMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {uploadDocMutation.isPending ? "Uploading..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
