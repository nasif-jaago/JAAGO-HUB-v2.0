"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  Unlock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface AdminUser {
  id: string;
  orgId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  roleId: string;
  department: string;
  designation?: string;
  accessStatus: "ACTIVE" | "INVITED" | "REVOKED" | "PENDING";
  authProvider: "PASSWORD" | "GOOGLE" | "SAML_SSO";
  mfaEnabled: boolean;
  supabaseUid?: string;
  invitedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface UserInviteResult {
  success: boolean;
  userId: string;
  email: string;
  temporaryPassword?: string;
  loginUrl: string;
  invitedAt: string;
  emailDispatched: boolean;
  message: string;
}

interface BulkImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  createdUsers: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    temporaryPassword: string;
    status: string;
  }[];
  errors: {
    row: number;
    email?: string;
    error: string;
  }[];
}

const DEPARTMENTS = [
  "Executive Leadership",
  "Human Resources",
  "Finance & Accounts",
  "Admin & Procurement",
  "School Operations",
  "Child Welfare",
  "Digital & Creative (DKL)",
  "Founder's Office (FC)",
  "Fundraising & Grants",
  "Impact Investment",
  "Project Implementation",
  "Vendor Management",
  "General Operations",
];

const ROLES = [
  { id: "r_admin", name: "Super Administrator" },
  { id: "r_hr_manager", name: "HR Manager" },
  { id: "r_finance_officer", name: "Finance Officer" },
  { id: "r_employee", name: "Standard Employee" },
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<UserInviteResult | null>(null);
  const [importSummaryModal, setImportSummaryModal] = useState<BulkImportResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Add user form state
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRoleId, setNewRoleId] = useState("r_employee");
  const [newDepartment, setNewDepartment] = useState("Human Resources");
  const [newDesignation, setNewDesignation] = useState("");
  const [newAutoInvite, setNewAutoInvite] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Import file parsing state
  const [importedRows, setImportedRows] = useState<
    { fullName: string; email: string; role: string; department: string; designation: string; phoneNumber: string }[]
  >([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Notification banner state
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showBanner = (type: "success" | "error", message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 6000);
  };

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data: users = [], isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient<AdminUser[]>("/v1/admin/users"),
  });

  // ─── Mutations ───────────────────────────────────────────────────────────

  const createUserMutation = useMutation({
    mutationFn: (payload: {
      fullName: string;
      email: string;
      phoneNumber?: string | undefined;
      roleId: string;
      department: string;
      designation?: string | undefined;
      autoInvite: boolean;
    }) =>
      apiClient<{ user: AdminUser; inviteResult?: UserInviteResult }>("/v1/admin/users", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowAddUserModal(false);
      resetAddUserForm();
      if (res.inviteResult) {
        setCredentialsModal(res.inviteResult);
      }
      showBanner("success", `User ${res.user.fullName} (${res.user.email}) successfully created.`);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to create user");
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient<UserInviteResult>(`/v1/admin/users/${userId}/invite`, { method: "POST" }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setCredentialsModal(res);
      showBanner("success", `Invitation & login link generated for ${res.email}.`);
    },
    onError: (err: Error) => {
      showBanner("error", err.message || "Failed to invite user");
    },
  });

  const revokeUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient<{ success: boolean; user: AdminUser; message: string }>(`/v1/admin/users/${userId}/revoke`, {
        method: "PATCH",
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showBanner("success", res.message);
    },
    onError: (err: Error) => {
      showBanner("error", err.message || "Failed to revoke access");
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient<{ success: boolean; user: AdminUser; message: string }>(`/v1/admin/users/${userId}/restore`, {
        method: "PATCH",
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showBanner("success", res.message);
    },
    onError: (err: Error) => {
      showBanner("error", err.message || "Failed to restore access");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient<UserInviteResult>(`/v1/admin/users/${userId}/reset-password`, { method: "POST" }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setCredentialsModal(res);
      showBanner("success", `Password reset for ${res.email}. New temporary credentials generated.`);
    },
    onError: (err: Error) => {
      showBanner("error", err.message || "Failed to reset password");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient<{ success: boolean; message: string }>(`/v1/admin/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showBanner("success", res.message);
    },
    onError: (err: Error) => {
      showBanner("error", err.message || "Failed to delete user");
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: (items: { fullName: string; email: string; role: string; department: string; designation: string; phoneNumber: string }[]) =>
      apiClient<BulkImportResult>("/v1/admin/users/import", {
        method: "POST",
        body: JSON.stringify({ users: items }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowImportModal(false);
      setImportedRows([]);
      setImportFileName(null);
      setImportSummaryModal(res);
      showBanner(
        "success",
        `Bulk import completed: ${res.successCount} users imported successfully, ${res.failedCount} failures.`,
      );
    },
    onError: (err: Error) => {
      setImportError(err.message || "Failed to import users");
    },
  });

  // ─── Filtered Data ────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        searchQuery === "" ||
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.designation && u.designation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === "ALL" || u.roleId === roleFilter || u.role === roleFilter;
      const matchStatus = statusFilter === "ALL" || u.accessStatus === statusFilter;
      const matchDept = deptFilter === "ALL" || u.department === deptFilter;

      return matchSearch && matchRole && matchStatus && matchDept;
    });
  }, [users, searchQuery, roleFilter, statusFilter, deptFilter]);

  // ─── KPI Metrics ──────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.accessStatus === "ACTIVE").length;
    const invited = users.filter((u) => u.accessStatus === "INVITED").length;
    const revoked = users.filter((u) => u.accessStatus === "REVOKED").length;
    return { total, active, invited, revoked };
  }, [users]);

  // ─── Form Helpers ─────────────────────────────────────────────────────────

  const resetAddUserForm = () => {
    setNewFullName("");
    setNewEmail("");
    setNewPhone("");
    setNewRoleId("r_employee");
    setNewDepartment("Human Resources");
    setNewDesignation("");
    setNewAutoInvite(true);
    setFormError(null);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailTrimmed = newEmail.trim().toLowerCase();
    if (!emailTrimmed.endsWith("@jaago.com.bd") && !emailTrimmed.endsWith("@emkcenter.org")) {
      setFormError("Domain restriction: Only @jaago.com.bd and @emkcenter.org email addresses are authorized.");
      return;
    }

    createUserMutation.mutate({
      fullName: newFullName.trim(),
      email: emailTrimmed,
      phoneNumber: newPhone.trim() || undefined,
      roleId: newRoleId,
      department: newDepartment,
      designation: newDesignation.trim() || undefined,
      autoInvite: newAutoInvite,
    });
  };

  // ─── Copy to Clipboard ───────────────────────────────────────────────────

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ─── CSV Export ───────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;

    const headers = [
      "ID",
      "Full Name",
      "Official Email",
      "Role",
      "Department",
      "Designation",
      "Phone Number",
      "Access Status",
      "Auth Provider",
      "MFA Enabled",
      "Invited Date",
      "Last Login",
      "Created Date",
    ];

    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.fullName.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.department}"`,
      `"${u.designation || ""}"`,
      `"${u.phoneNumber || ""}"`,
      `"${u.accessStatus}"`,
      `"${u.authProvider}"`,
      `"${u.mfaEnabled ? "Yes" : "No"}"`,
      `"${u.invitedAt || ""}"`,
      `"${u.lastLoginAt || ""}"`,
      `"${u.createdAt}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jaago_hub_users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Download Sample CSV Template ─────────────────────────────────────────

  const handleDownloadSampleTemplate = () => {
    const templateHeaders = ["Full Name", "Official Email", "Role", "Department", "Designation", "Phone Number"];
    const sampleRows = [
      ["Nasif Kamal", "nasif.kamal@jaago.com.bd", "Super Administrator", "Executive Leadership", "Coordinator, Tech 4 Development", "+880 1711-000111"],
      ["Salma Khatun", "salma.khatun@jaago.com.bd", "HR Manager", "Human Resources", "Lead People Partner", "+880 1819-223344"],
      ["Tanvir Rahman", "tanvir.rahman@jaago.com.bd", "Finance Officer", "Finance & Accounts", "Senior Accounts Officer", "+880 1912-334455"],
      ["Farhana Ahmed", "farhana.ahmed@jaago.com.bd", "Standard Employee", "School Operations", "Assistant Teacher", "+880 1714-556677"],
    ];

    const csvContent = [
      templateHeaders.join(","),
      ...sampleRows.map((r) => r.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "jaago_user_import_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── CSV File Reader ──────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setImportError("CSV file is empty or missing data rows.");
          return;
        }

        // Parse rows (ignoring header)
        const parsed: {
          fullName: string;
          email: string;
          role: string;
          department: string;
          designation: string;
          phoneNumber: string;
        }[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          // Simple regex CSV splitter handling quotes
          const match = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
          if (match && match.length >= 2) {
            const clean = match.map((m) => m.replace(/^,/, "").replace(/^"|"$/g, "").trim());
            const fullName = clean[0] || "";
            const email = clean[1] || "";
            const role = clean[2] || "Standard Employee";
            const department = clean[3] || "General Operations";
            const designation = clean[4] || role;
            const phoneNumber = clean[5] || "";

            if (fullName && email) {
              parsed.push({ fullName, email, role, department, designation, phoneNumber });
            }
          }
        }

        if (parsed.length === 0) {
          setImportError("Could not parse valid user records from CSV. Please check formatting.");
        } else {
          setImportedRows(parsed);
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Failed to parse file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="System Administration: Users & Access Control"
        description="Enterprise identity lifecycle management, Supabase Auth synchronization, automated credentials delivery, and granular permission controls."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/80 text-foreground transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleDownloadSampleTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/80 text-foreground transition-all shadow-xs"
            title="Download CSV sample template with proper column headers"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
            Sample Template
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/80 text-foreground transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setImportedRows([]);
              setImportFileName(null);
              setImportError(null);
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/80 text-foreground transition-all shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            Import CSV
          </button>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add User
          </button>
        </div>
      </PageHeader>

      {/* Global Status Banner */}
      {banner && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium transition-all ${
            banner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{kpis.total}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total System Users</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {kpis.active}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Active Login Access</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {kpis.invited}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Pending Invitations</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {kpis.revoked}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Revoked / Suspended</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card/70 backdrop-blur-sm shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background/80 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background/80 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INVITED">Invited (Pending)</option>
              <option value="REVOKED">Revoked (Suspended)</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background/80 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[160px]"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredUsers.length}</span> of {users.length} users
        </div>
      </div>

      {/* Main Users Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Auth / MFA</th>
                <th className="py-3 px-3 text-center">Login Access</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading system user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isRevoked = user.accessStatus === "REVOKED";
                  const isInvited = user.accessStatus === "INVITED";
                  const isActive = user.accessStatus === "ACTIVE";

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isRevoked ? "opacity-60 bg-red-500/[0.02]" : ""
                      }`}
                    >
                      {/* User Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {user.fullName}
                              {user.supabaseUid && (
                                <span
                                  className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  title={`Supabase UID: ${user.supabaseUid}`}
                                >
                                  Synced
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            user.roleId === "r_admin" || user.role === "Super Administrator"
                              ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                              : user.roleId === "r_hr_manager" || user.role === "HR Manager"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                              : user.roleId === "r_finance_officer" || user.role === "Finance Officer"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Department Column */}
                      <td className="py-3 px-3">
                        <div className="text-foreground">{user.department}</div>
                        {user.designation && (
                          <div className="text-[10px] text-muted-foreground">{user.designation}</div>
                        )}
                      </td>

                      {/* Auth / MFA Column */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                              user.authProvider === "GOOGLE"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-muted text-foreground border border-border"
                            }`}
                          >
                            {user.authProvider === "GOOGLE" ? "Google SSO" : "Password"}
                          </span>
                          {user.mfaEnabled && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              title="2-Factor Authentication Enforced"
                            >
                              MFA
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Login Access Status Column */}
                      <td className="py-3 px-3 text-center">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        )}
                        {isInvited && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Invited
                          </span>
                        )}
                        {isRevoked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <ShieldOff className="w-3 h-3 text-rose-500" />
                            Revoked
                          </span>
                        )}
                      </td>

                      {/* Last Active Column */}
                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never logged in"}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Invite / Re-Invite Button */}
                          <button
                            onClick={() => inviteUserMutation.mutate(user.id)}
                            disabled={inviteUserMutation.isPending}
                            className="p-1.5 text-amber-600 hover:bg-amber-500/10 rounded-md transition-colors"
                            title="Send/Re-send invitation email with temporary credentials"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => resetPasswordMutation.mutate(user.id)}
                            disabled={resetPasswordMutation.isPending}
                            className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded-md transition-colors"
                            title="Generate new temporary password & trigger email"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Revoke / Restore Access Button */}
                          {isRevoked ? (
                            <button
                              onClick={() => restoreUserMutation.mutate(user.id)}
                              disabled={restoreUserMutation.isPending}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-md transition-colors"
                              title="Restore login access for this user"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to revoke login access for ${user.fullName} (${user.email})?`,
                                  )
                                ) {
                                  revokeUserMutation.mutate(user.id);
                                }
                              }}
                              disabled={revokeUserMutation.isPending}
                              className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors"
                              title="Revoke / Suspend login access"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete User Button */}
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Permanently delete user record for ${user.fullName}? This cannot be undone.`,
                                )
                              ) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors"
                            title="Delete user from directory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: Add User Modal ─────────────────────────────────────── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <UserPlus className="w-4 h-4 text-amber-500" />
                Add System User
              </div>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  resetAddUserForm();
                }}
                className="p-1 hover:bg-muted rounded-md text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nasif Kamal"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Official Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. nasif.kamal@jaago.com.bd"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <div className="text-[11px] text-muted-foreground mt-1">
                  Restricted to authorized <span className="font-mono text-amber-600 dark:text-amber-400">@jaago.com.bd</span> or{" "}
                  <span className="font-mono text-amber-600 dark:text-amber-400">@emkcenter.org</span> domains.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">RBAC Role</label>
                  <select
                    value={newRoleId}
                    onChange={(e) => setNewRoleId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Coordinator"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+880 1711-000000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Auto-Generate Password & Invite
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Generates a 14-character secure password, sends email invite, and shows credentials modal.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newAutoInvite}
                  onChange={(e) => setNewAutoInvite(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    resetAddUserForm();
                  }}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5"
                >
                  {createUserMutation.isPending ? "Creating..." : "Save & Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Credentials & Login Information Modal ─────────────── */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Invitation Credentials Ready
              </div>
              <button
                onClick={() => setCredentialsModal(null)}
                className="p-1 hover:bg-muted rounded-md text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              Login access has been provisioned for{" "}
              <span className="font-semibold text-foreground">{credentialsModal.email}</span>. An email with login
              instructions was dispatched. You can also copy the temporary credentials below to share directly:
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">Email:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">{credentialsModal.email}</span>
                  <button
                    onClick={() => copyToClipboard(credentialsModal.email, "cred_email")}
                    className="p-1 hover:bg-muted rounded"
                    title="Copy Email"
                  >
                    {copiedKey === "cred_email" ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {credentialsModal.temporaryPassword && (
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="text-muted-foreground text-[11px]">Temp Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {credentialsModal.temporaryPassword}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(credentialsModal.temporaryPassword!, "cred_pass")
                      }
                      className="p-1 hover:bg-muted rounded"
                      title="Copy Password"
                    >
                      {copiedKey === "cred_pass" ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span className="text-muted-foreground text-[11px]">Login Portal:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-500 hover:underline">{credentialsModal.loginUrl}</span>
                  <button
                    onClick={() => copyToClipboard(credentialsModal.loginUrl, "cred_url")}
                    className="p-1 hover:bg-muted rounded"
                    title="Copy Login URL"
                  >
                    {copiedKey === "cred_url" ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const summaryText = `JAAGO HUB Login Credentials:\nEmail: ${credentialsModal.email}\nTemporary Password: ${credentialsModal.temporaryPassword}\nLogin Portal: ${credentialsModal.loginUrl}`;
                  copyToClipboard(summaryText, "copy_all");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border bg-card hover:bg-muted text-foreground"
              >
                {copiedKey === "copy_all" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedKey === "copy_all" ? "All Copied!" : "Copy Full Info"}
              </button>

              <button
                onClick={() => setCredentialsModal(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Bulk Import CSV Modal ──────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Upload className="w-4 h-4 text-emerald-500" />
                Bulk Import Users via CSV
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportedRows([]);
                  setImportFileName(null);
                }}
                className="p-1 hover:bg-muted rounded-md text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              Upload a <span className="font-semibold text-foreground">.csv</span> file with column headers:{" "}
              <span className="font-mono text-amber-600 dark:text-amber-400">
                Full Name, Official Email, Role, Department, Designation, Phone Number
              </span>
              . Download the sample template if needed.
            </div>

            {/* Drag & Drop / File Input Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-amber-500/60 rounded-xl p-6 text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all space-y-2"
            >
              <FileSpreadsheet className="w-8 h-8 mx-auto text-amber-500 opacity-80" />
              <div className="text-xs font-semibold text-foreground">
                {importFileName ? importFileName : "Click to browse or drop .csv file here"}
              </div>
              <div className="text-[11px] text-muted-foreground">Supports standard comma-separated (.csv) format</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {importError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Parsed Rows Preview */}
            {importedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Found {importedRows.length} user records ready to import:</span>
                  <button onClick={handleDownloadSampleTemplate} className="text-amber-600 hover:underline text-[11px]">
                    Compare with Sample Template
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold sticky top-0">
                      <tr className="border-b border-border">
                        <th className="py-2 px-2.5">#</th>
                        <th className="py-2 px-2.5">Full Name</th>
                        <th className="py-2 px-2.5">Email</th>
                        <th className="py-2 px-2.5">Role</th>
                        <th className="py-2 px-2.5">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {importedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-1.5 px-2.5 text-muted-foreground font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 font-medium text-foreground">{row.fullName}</td>
                          <td className="py-1.5 px-2.5 font-mono text-muted-foreground">{row.email}</td>
                          <td className="py-1.5 px-2.5">{row.role}</td>
                          <td className="py-1.5 px-2.5 text-muted-foreground">{row.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importedRows.length > 10 && (
                  <div className="text-[11px] text-muted-foreground text-center">
                    + {importedRows.length - 10} more rows will be imported
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportedRows([]);
                  setImportFileName(null);
                }}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importedRows.length === 0 || bulkImportMutation.isPending}
                onClick={() => bulkImportMutation.mutate(importedRows)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {bulkImportMutation.isPending
                  ? "Importing & Generating Credentials..."
                  : `Import ${importedRows.length} Users`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Bulk Import Summary Report Modal ────────────────────── */}
      {importSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Import Execution Report
              </div>
              <button
                onClick={() => setImportSummaryModal(null)}
                className="p-1 hover:bg-muted rounded-md text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl border border-border bg-muted/40">
                <div className="text-lg font-bold text-foreground">{importSummaryModal.totalProcessed}</div>
                <div className="text-[11px] text-muted-foreground">Total Processed</div>
              </div>
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {importSummaryModal.successCount}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Successfully Imported</div>
              </div>
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10">
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {importSummaryModal.failedCount}
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-300">Failed Records</div>
              </div>
            </div>

            {/* Created Users Credentials List */}
            {importSummaryModal.createdUsers.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground">
                  Generated Temporary Login Credentials ({importSummaryModal.createdUsers.length}):
                </div>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-border text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground sticky top-0">
                      <tr className="border-b border-border">
                        <th className="py-2 px-2.5">User</th>
                        <th className="py-2 px-2.5">Email</th>
                        <th className="py-2 px-2.5">Temporary Password</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {importSummaryModal.createdUsers.map((u, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 font-mono">
                          <td className="py-1.5 px-2.5 font-sans font-medium text-foreground">{u.fullName}</td>
                          <td className="py-1.5 px-2.5 text-muted-foreground">{u.email}</td>
                          <td className="py-1.5 px-2.5 text-amber-600 dark:text-amber-400 font-semibold">
                            {u.temporaryPassword}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors List if any */}
            {importSummaryModal.errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-rose-600">Import Errors:</div>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 space-y-1 text-xs text-rose-700 dark:text-rose-300">
                  {importSummaryModal.errors.map((err, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-mono font-bold">Row {err.row}:</span>
                      <span>{err.email ? `${err.email} — ` : ""}{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const csvData = [
                    ["Full Name", "Email", "Role", "Temporary Password", "Portal URL"].join(","),
                    ...importSummaryModal.createdUsers.map((u) =>
                      [`"${u.fullName}"`, `"${u.email}"`, `"${u.role}"`, `"${u.temporaryPassword}"`, '"http://hub.jaago.com.bd/login"'].join(
                        ",",
                      ),
                    ),
                  ].join("\n");

                  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `jaago_imported_credentials_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border bg-card hover:bg-muted text-foreground"
              >
                <Download className="w-3.5 h-3.5" />
                Download Credentials CSV
              </button>

              <button
                onClick={() => setImportSummaryModal(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
