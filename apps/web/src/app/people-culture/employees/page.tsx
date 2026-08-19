"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  CheckSquare,
  Square,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  Save,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { usePCOrganization } from "../layout";

interface Employee {
  id: string;
  employeeId?: string | undefined;
  fullName: string;
  email: string;
  phoneNumber?: string | undefined;
  organizationId?: string | undefined;
  organizationName?: string | undefined;
  department?: string | undefined;
  designation?: string | undefined;
  branch?: string | undefined;
  workingSchedule?: string | undefined;
  joiningDate?: string | undefined;
  confirmationDate?: string | undefined;
  status: "Active" | "Inactive" | "Terminated" | "Resigned";
}

const ORGANIZATIONS = [
  "ALL",
  "JAAGO Foundation",
  "JAAGO Foundation Trust",
  "JAAGO Foundation INC",
  "JAAGO Foundation UK",
];

const DEPARTMENTS = [
  "ALL",
  "Digital School Program",
  "Communications",
  "Program Implementation",
  "EMK Center",
  "Executive Leadership",
  "Human Resources",
  "Finance & Accounts",
  "School Operations",
];

export default function PCEmployeesPage() {
  const queryClient = useQueryClient();
  const { selectedOrg, setSelectedOrg } = usePCOrganization();

  // Filters & State
  const [statusTab, setStatusTab] = useState<"ALL" | "Active" | "Inactive" | "Terminated" | "Resigned">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; names: string[] } | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formEmpId, setFormEmpId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formOrg, setFormOrg] = useState("JAAGO Foundation");
  const [formDept, setFormDept] = useState("Digital School Program");
  const [formDesig, setFormDesig] = useState("Assistant Teacher");
  const [formBranch, setFormBranch] = useState("Head Office (Banani)");
  const [formSchedule, setFormSchedule] = useState("General 9 AM to 5 PM");

  const showBanner = (type: "success" | "error", message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 5000);
  };

  // ─── Auto-Open & Prefill from URL (e.g. redirected from Admin Users) ─────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        const name = params.get("name") || "";
        const email = params.get("email") || "";
        const dept = params.get("dept") || "";
        const desig = params.get("desig") || "";
        const phone = params.get("phone") || "";
        const org = params.get("org") || "JAAGO Foundation";

        if (name) setFormName(name);
        if (email) setFormEmail(email);
        if (dept) setFormDept(dept);
        if (desig) setFormDesig(desig);
        if (phone) setFormPhone(phone);
        if (org) setFormOrg(org);

        setShowAddModal(true);
      }
    }
  }, []);

  // ─── Query Employees ─────────────────────────────────────────────────────

  const { data: employees = [], isLoading, refetch } = useQuery<Employee[]>({
    queryKey: ["pc", "employees", selectedOrg, statusTab],
    queryFn: () =>
      apiClient<Employee[]>(
        `/v1/people-culture/employees?org=${encodeURIComponent(selectedOrg)}&status=${statusTab}`,
      ),
  });

  // ─── Query System Users (for connection status check) ─────────────────────

  const { data: adminUsers = [] } = useQuery<{ id: string; email: string; fullName: string }[]>({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient<{ id: string; email: string; fullName: string }[]>("/v1/admin/users"),
  });

  // ─── Create Employee Mutation ─────────────────────────────────────────────

  const createEmployeeMutation = useMutation({
    mutationFn: (payload: Partial<Employee>) =>
      apiClient<Employee>("/v1/people-culture/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pc", "employees"] });
      queryClient.invalidateQueries({ queryKey: ["pc", "dashboard"] });
      setShowAddModal(false);
      resetForm();
      showBanner("success", `Employee ${res?.fullName || "record"} successfully created & linked with Supabase.`);
    },
    onError: (err: any) => {
      showBanner("error", err?.message || "Failed to create employee");
    },
  });

  // ─── Update Employee Mutation ─────────────────────────────────────────────

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Employee> }) =>
      apiClient<Employee>(`/v1/people-culture/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pc", "employees"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowEditModal(false);
      setEditingEmployee(null);
      showBanner("success", `Employee ${res?.fullName || "record"} and linked User account successfully updated.`);
    },
    onError: (err: any) => {
      showBanner("error", err?.message || "Failed to update employee");
    },
  });

  // ─── Create User for Employee Mutation ───────────────────────────────────

  const createUserForEmployeeMutation = useMutation({
    mutationFn: (emp: Employee) =>
      apiClient<{ user: any }>("/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({
          fullName: emp.fullName,
          email: emp.email,
          phoneNumber: emp.phoneNumber || undefined,
          roleId: "r_staff",
          department: emp.department || "General Operations",
          designation: emp.designation || "Standard Employee",
          autoInvite: true,
        }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["pc", "employees"] });
      showBanner("success", `JAAGO HUB Login User account successfully created & invited for ${res?.user?.fullName || "employee"}.`);
    },
    onError: (err: any) => {
      showBanner("error", err?.message || "Failed to create user account");
    },
  });

  // ─── Delete & Bulk Delete Mutations ──────────────────────────────────────

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      apiClient<{ success: boolean; deletedCount: number; message: string }>("/v1/people-culture/employees/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pc", "employees"] });
      queryClient.invalidateQueries({ queryKey: ["pc", "dashboard"] });
      setSelectedIds(new Set());
      setShowDeleteModal(false);
      setDeleteTarget(null);
      showBanner("success", res?.message || "Selected employee(s) successfully deleted.");
    },
    onError: (err: any) => {
      showBanner("error", err?.message || "Failed to delete employee(s)");
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormEmpId("");
    setFormPhone("");
    setFormOrg("JAAGO Foundation");
    setFormDept("Digital School Program");
    setFormDesig("Assistant Teacher");
    setFormBranch("Head Office (Banani)");
    setFormSchedule("General 9 AM to 5 PM");
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.fullName);
    setFormEmail(emp.email);
    setFormEmpId(emp.employeeId || "");
    setFormPhone(emp.phoneNumber || "");
    setFormOrg(emp.organizationName || "JAAGO Foundation");
    setFormDept(emp.department || "Digital School Program");
    setFormDesig(emp.designation || "Assistant Teacher");
    setFormBranch(emp.branch || "Head Office (Banani)");
    setFormSchedule(emp.workingSchedule || "General 9 AM to 5 PM");
    setShowEditModal(true);
  };

  // ─── Filtered Data ────────────────────────────────────────────────────────

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (!e) return false;
      const matchSearch =
        searchQuery === "" ||
        e.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.designation?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = selectedDept === "ALL" || e.department === selectedDept;
      const matchStatus = statusTab === "ALL" || e.status === statusTab;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchQuery, selectedDept, statusTab]);

  const isAllSelected = filteredEmployees.length > 0 && filteredEmployees.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filteredEmployees.forEach((e) => next.add(e.id));
      setSelectedIds(next);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Trigger Bulk Delete
  const handleTriggerBulkDelete = () => {
    const list = filteredEmployees.filter((e) => selectedIds.has(e.id));
    if (list.length === 0) return;
    setDeleteTarget({
      ids: list.map((e) => e.id),
      names: list.map((e) => e.fullName),
    });
    setShowDeleteModal(true);
  };

  // Trigger Single Delete
  const handleTriggerSingleDelete = (emp: Employee) => {
    setDeleteTarget({
      ids: [emp.id],
      names: [emp.fullName],
    });
    setShowDeleteModal(true);
  };

  // ─── CSV Export ───────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const list = selectedIds.size > 0 ? filteredEmployees.filter((e) => selectedIds.has(e.id)) : filteredEmployees;
    if (list.length === 0) return;

    const headers = ["Employee ID", "Full Name", "Official Email", "Department", "Designation", "Organization", "Branch", "Schedule", "Joining Date", "Status"];
    const rows = list.map((e) => [
      `"${e.employeeId || ""}"`,
      `"${e.fullName || ""}"`,
      `"${e.email || ""}"`,
      `"${e.department || ""}"`,
      `"${e.designation || ""}"`,
      `"${e.organizationName || ""}"`,
      `"${e.branch || ""}"`,
      `"${e.workingSchedule || ""}"`,
      `"${e.joiningDate || ""}"`,
      `"${e.status || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jaago_employees_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">Employee List</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredEmployees.length} employee(s) total across all global entities
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Dynamic Bulk Action Button when Items are Selected */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleTriggerBulkDelete}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md animate-in fade-in zoom-in-95 duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE SELECTED ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>IMPORT</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ NEW EMPLOYEE</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>EXPORT</span>
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold ${
            banner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex items-center gap-6 border-b border-border/80 text-xs font-bold">
        {(["ALL", "Active", "Inactive", "Terminated", "Resigned"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`pb-2.5 uppercase tracking-wider transition-colors relative ${
              statusTab === tab
                ? "text-amber-500 border-b-2 border-amber-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Organization Breakdown Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground mr-1">Organization Breakdown:</span>
        {ORGANIZATIONS.map((org) => (
          <button
            key={org}
            onClick={() => setSelectedOrg(org)}
            className={`px-3 py-1 text-xs rounded-full font-semibold transition-all ${
              selectedOrg === org
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-muted hover:bg-muted/80 text-foreground border border-border/60"
            }`}
          >
            {org === "ALL" ? "All Entities" : org}
          </button>
        ))}
      </div>

      {/* Bulk Selection Notification Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckSquare className="w-4 h-4 text-rose-600" />
            <span>{selectedIds.size} of {filteredEmployees.length} employees selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={handleTriggerBulkDelete}
              className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d === "ALL" ? "All Departments" : d}</option>
            ))}
          </select>
        </div>

        <div className="text-xs font-medium text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredEmployees.length}</span> employees
        </div>
      </div>

      {/* Employee List Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-1 hover:bg-muted rounded text-foreground">
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Working Schedule</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Organization</th>
                <th className="py-3 px-3">Joining Date</th>
                <th className="py-3 px-3">Confirmation Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading employee records...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No employees matching current filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedIds.has(emp.id);
                  const isLinkedUser = adminUsers.some((u) => u.email?.toLowerCase() === emp.email?.toLowerCase());
                  const initials = emp.fullName
                    .split(" ")
                    .map((n) => n[0] || "")
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={emp.id} className={`hover:bg-muted/30 transition-colors ${isSelected ? "bg-amber-500/10" : ""}`}>
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => toggleSelect(emp.id)} className="p-1 hover:bg-muted rounded">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <span>{emp.fullName}</span>
                              {isLinkedUser && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <Check className="w-2.5 h-2.5" />
                                  User Active
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">ID: {emp.employeeId}</div>
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">{emp.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-foreground">{emp.workingSchedule}</td>
                      <td className="py-3 px-3 text-foreground font-medium">{emp.department}</td>
                      <td className="py-3 px-3 text-muted-foreground">{emp.designation}</td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-amber-700 dark:text-amber-300">{emp.organizationName}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-muted-foreground">{emp.joiningDate}</td>
                      <td className="py-3 px-3 font-mono text-muted-foreground">{emp.confirmationDate || "—"}</td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Create User Button (Only shown if NOT already a User) */}
                          {!isLinkedUser && (
                            <button
                              onClick={() => createUserForEmployeeMutation.mutate(emp)}
                              disabled={createUserForEmployeeMutation.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/40 transition-all whitespace-nowrap active:scale-95 shadow-2xs"
                              title="Create JAAGO HUB Login User for this Employee"
                            >
                              <UserPlus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>+ Create User</span>
                            </button>
                          )}

                          <button onClick={() => openEditModal(emp)} className="p-1.5 text-muted-foreground hover:text-blue-500 rounded hover:bg-blue-500/10" title="Edit Profile">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTriggerSingleDelete(emp)}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 rounded hover:bg-rose-500/10 transition-colors"
                            title="Delete Employee"
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

      {/* ─── MODAL: Delete Confirmation ────────────────────────────────────── */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Confirm Employee Deletion</h3>
                <p className="text-xs text-muted-foreground">Permanent action & access revocation</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-xs text-foreground space-y-2">
              <p>
                Are you sure you want to delete{" "}
                <strong className="text-rose-600">{deleteTarget.ids.length}</strong> employee record(s)?
              </p>
              <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] font-mono text-muted-foreground">
                {deleteTarget.names.map((name, i) => (
                  <div key={i}>• {name}</div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                This will remove their profile from the People & Culture directory and revoke login access from Supabase.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => bulkDeleteMutation.mutate(deleteTarget.ids)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add New Employee ──────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <UserPlus className="w-4 h-4 text-amber-500" />
                Add New Employee to People & Culture Directory
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createEmployeeMutation.mutate({
                  fullName: formName,
                  email: formEmail,
                  employeeId: formEmpId || undefined,
                  phoneNumber: formPhone || undefined,
                  organizationName: formOrg,
                  department: formDept,
                  designation: formDesig,
                  branch: formBranch,
                  workingSchedule: formSchedule,
                  status: "Active",
                });
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Shaheen Ahmed"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="shaheen@jaago.com.bd"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Organization / Entity *</label>
                  <select
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="JAAGO Foundation">JAAGO Foundation</option>
                    <option value="JAAGO Foundation Trust">JAAGO Foundation Trust</option>
                    <option value="JAAGO Foundation INC">JAAGO Foundation INC</option>
                    <option value="JAAGO Foundation UK">JAAGO Foundation UK</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Department *</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Designation</label>
                  <input
                    type="text"
                    value={formDesig}
                    onChange={(e) => setFormDesig(e.target.value)}
                    placeholder="e.g. Lead Coordinator"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Branch Location</label>
                  <input
                    type="text"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    placeholder="Head Office (Banani)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Working Schedule</label>
                  <input
                    type="text"
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value)}
                    placeholder="General 9 AM to 5 PM"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+880 1711-000000"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEmployeeMutation.isPending}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                >
                  {createEmployeeMutation.isPending ? "Registering & Syncing..." : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Employee ─────────────────────────────────────────── */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Edit2 className="w-4 h-4 text-blue-500" />
                Edit Employee Profile (Auto-Syncs with User Account)
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateEmployeeMutation.mutate({
                  id: editingEmployee.id,
                  payload: {
                    fullName: formName,
                    email: formEmail,
                    phoneNumber: formPhone || undefined,
                    organizationName: formOrg,
                    department: formDept,
                    designation: formDesig,
                    branch: formBranch,
                    workingSchedule: formSchedule,
                  },
                });
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Organization / Entity</label>
                  <select
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="JAAGO Foundation">JAAGO Foundation</option>
                    <option value="JAAGO Foundation Trust">JAAGO Foundation Trust</option>
                    <option value="JAAGO Foundation INC">JAAGO Foundation INC</option>
                    <option value="JAAGO Foundation UK">JAAGO Foundation UK</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Designation</label>
                  <input
                    type="text"
                    value={formDesig}
                    onChange={(e) => setFormDesig(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Branch Location</label>
                  <input
                    type="text"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Working Schedule</label>
                  <input
                    type="text"
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateEmployeeMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updateEmployeeMutation.isPending ? "Updating..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Import CSV ────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Upload className="w-4 h-4 text-emerald-500" />
                Bulk Import Employees
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-2 bg-muted/20">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-amber-500" />
              <div className="text-xs font-bold text-foreground">Upload Employee CSV Roster</div>
              <div className="text-[11px] text-muted-foreground">Columns: Full Name, Email, Organization, Department, Designation</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted"
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
