"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Search,
  Building,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  phoneNumber: string;
  nidOrPassport: string;
  joiningDate: string;
  departmentName: string;
  officeName: string;
  designation: string;
  employmentType: string;
  employmentStatus: "ACTIVE" | "PROBATION" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
  salaryGrade?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

interface EmployeesResponse {
  items: Employee[];
  total: number;
}

interface EmployeeStats {
  totalHeadcount: number;
  activeCount: number;
  onLeaveCount: number;
  branchCount: number;
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New Employee Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    officialEmail: "",
    phoneNumber: "+880 ",
    nidOrPassport: "",
    joiningDate: new Date().toISOString().split("T")[0],
    departmentName: "Education & Schools",
    officeName: "Dhaka HQ",
    designation: "",
    employmentType: "FULL_TIME",
    salaryGrade: "Grade-5",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: employeesData = { items: [], total: 0 }, isLoading } = useQuery<EmployeesResponse>({
    queryKey: ["employees-list", searchTerm, departmentFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (departmentFilter !== "ALL") params.set("department", departmentFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      return apiClient<EmployeesResponse>(`/v1/hr/employees?${params.toString()}`);
    },
  });

  const { data: stats } = useQuery<EmployeeStats>({
    queryKey: ["employees-stats"],
    queryFn: () => apiClient<EmployeeStats>("/v1/hr/employees/stats"),
  });

  // ─── Mutation ──────────────────────────────────────────────────────────────

  const createEmployeeMutation = useMutation({
    mutationFn: (newEmp: typeof formData) =>
      apiClient<Employee>("/v1/hr/employees", {
        method: "POST",
        body: JSON.stringify(newEmp),
      }),
    onSuccess: (emp) => {
      queryClient.invalidateQueries({ queryKey: ["employees-list"] });
      queryClient.invalidateQueries({ queryKey: ["employees-stats"] });
      setIsAddModalOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        officialEmail: "",
        phoneNumber: "+880 ",
        nidOrPassport: "",
        joiningDate: new Date().toISOString().split("T")[0],
        departmentName: "Education & Schools",
        officeName: "Dhaka HQ",
        designation: "",
        employmentType: "FULL_TIME",
        salaryGrade: "Grade-5",
        emergencyContactName: "",
        emergencyContactPhone: "",
      });
      notify("success", `Employee ${emp.fullName} (${emp.employeeCode}) enrolled successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory & Master Profiles"
        subtitle="Manage organization staff profiles, branch assignments, designations, and emergency contacts."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Human Resources</span>
          </div>
        }
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
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

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Total Headcount</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalHeadcount ?? employeesData.total}</div>
          <span className="text-[11px] text-primary font-medium">All Branches & HQ</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Active Staff</span>
          <div className="text-2xl font-bold text-foreground">{stats?.activeCount ?? 4}</div>
          <span className="text-[11px] text-emerald-400 font-medium">On Duty</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">On Leave Today</span>
          <div className="text-2xl font-bold text-foreground">{stats?.onLeaveCount ?? 0}</div>
          <span className="text-[11px] text-amber-400 font-medium">Approved time off</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Operating Locations</span>
          <div className="text-2xl font-bold text-foreground">{stats?.branchCount ?? 3}</div>
          <span className="text-[11px] text-muted-foreground">Schools & Regional Offices</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 glass-card p-3 rounded-2xl border">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, email, designation..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Departments</option>
            <option value="Executive">Executive Leadership</option>
            <option value="Education">Education & Schools</option>
            <option value="Finance">Finance & Accounts</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="glass-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                <th className="p-4">Employee</th>
                <th className="p-4">Department & Role</th>
                <th className="p-4">Office Branch</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading employee directory...
                  </td>
                </tr>
              ) : employeesData.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No employees matching the current filters.
                  </td>
                </tr>
              ) : (
                employeesData.items.map((emp) => (
                  <tr key={emp.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs border border-primary/30 shrink-0">
                          {emp.firstName.charAt(0)}
                          {emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-sm">{emp.fullName}</div>
                          <span className="font-mono text-[11px] text-muted-foreground">{emp.employeeCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{emp.designation}</div>
                        <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                          <Building className="w-3 h-3 text-primary" />
                          <span>{emp.departmentName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1 text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{emp.officeName}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5 text-muted-foreground">
                        <div className="flex items-center gap-1 text-[11px] text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{emp.officialEmail}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{emp.phoneNumber}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          emp.employmentStatus === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : emp.employmentStatus === "ON_LEAVE"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-secondary text-muted-foreground border border-border/40"
                        }`}
                      >
                        {emp.employmentStatus}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="px-3 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold border border-border/40 transition-colors"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: ADD EMPLOYEE ────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-2xl w-full p-6 rounded-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <span>Enroll New Employee Master Profile</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createEmployeeMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Jannatul"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Ferdous"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Official Email</label>
                  <input
                    type="email"
                    required
                    value={formData.officialEmail}
                    onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. jannat.ferdous@jaago.com.bd"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="+880 1711-000000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">NID / Smart Card / Passport</label>
                  <input
                    type="text"
                    required
                    value={formData.nidOrPassport}
                    onChange={(e) => setFormData({ ...formData, nidOrPassport: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. 19982692600009999"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Assistant Teacher"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <select
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Education & Schools">Education & Schools</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Procurement & Supply Chain">Procurement & Supply Chain</option>
                    <option value="Executive Leadership">Executive Leadership</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Branch / Office Location</label>
                  <select
                    value={formData.officeName}
                    onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Dhaka HQ">Dhaka HQ (Banani)</option>
                    <option value="Rajshahi School Branch">Rajshahi School Branch</option>
                    <option value="Chittagong School Branch">Chittagong School Branch</option>
                    <option value="Habiganj School Branch">Habiganj School Branch</option>
                    <option value="Bandarban School Branch">Bandarban School Branch</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Salary Grade</label>
                  <input
                    type="text"
                    value={formData.salaryGrade}
                    onChange={(e) => setFormData({ ...formData, salaryGrade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Grade-5"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEmployeeMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  <span>{createEmployeeMutation.isPending ? "Enrolling..." : "Enroll Employee"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VIEW PROFILE ────────────────────────────────────────────── */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-base border border-primary/30">
                  {selectedEmployee.firstName.charAt(0)}
                  {selectedEmployee.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedEmployee.fullName}</h3>
                  <span className="font-mono text-xs text-primary">{selectedEmployee.employeeCode}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/40 space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Designation</span>
                <p className="font-bold text-foreground">{selectedEmployee.designation}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Department</span>
                <p className="font-bold text-foreground">{selectedEmployee.departmentName}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Location / Branch</span>
                <p className="font-bold text-foreground">{selectedEmployee.officeName}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Joining Date</span>
                <p className="font-bold text-foreground">{selectedEmployee.joiningDate}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/40 space-y-0.5 col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">National ID / Passport</span>
                <p className="font-mono text-foreground">{selectedEmployee.nidOrPassport}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-secondary/80 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
