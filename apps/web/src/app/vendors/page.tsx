"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Star,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface VendorProfile {
  id: string;
  vendorCode: string;
  companyName: string;
  category: "STATIONERY_BOOKS" | "IT_HARDWARE_SOLAR" | "CONSTRUCTION_MAINTENANCE" | "FOOD_NUTRITION" | "TRANSPORT_LOGISTICS" | "GENERAL_SERVICES";
  tradeLicenseNumber: string;
  tinOrBinNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  bankAccountDetails: string;
  complianceStatus: "VERIFIED" | "PENDING_REVIEW" | "REJECTED" | "BLACKLISTED";
  ratingScore: number;
  totalOrdersFulfilled: number;
  onboardingDate: string;
  complianceRemarks?: string;
}

interface VendorStats {
  totalVendors: number;
  verifiedPercentage: number;
  activeRfqs: number;
  blacklistedCount: number;
}

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "TAX_LICENSE" | "PERFORMANCE">("DIRECTORY");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [auditVendor, setAuditVendor] = useState<VendorProfile | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Onboard Form State
  const [onboardForm, setOnboardForm] = useState({
    companyName: "",
    category: "STATIONERY_BOOKS" as VendorProfile["category"],
    tradeLicenseNumber: "",
    tinOrBinNumber: "",
    contactPerson: "",
    email: "",
    phone: "",
    bankAccountDetails: "",
  });

  // Audit Form State
  const [auditForm, setAuditForm] = useState({
    complianceStatus: "VERIFIED" as VendorProfile["complianceStatus"],
    ratingScore: 5.0,
    complianceRemarks: "",
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: vendors = [], isLoading } = useQuery<VendorProfile[]>({
    queryKey: ["vendors-list", selectedCategory, selectedStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      return apiClient<VendorProfile[]>(`/v1/vendors?${params.toString()}`);
    },
  });

  const { data: stats } = useQuery<VendorStats>({
    queryKey: ["vendors-stats"],
    queryFn: () => apiClient<VendorStats>("/v1/vendors/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const onboardMutation = useMutation({
    mutationFn: (dto: typeof onboardForm) =>
      apiClient<VendorProfile>("/v1/vendors", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (vnd) => {
      queryClient.invalidateQueries({ queryKey: ["vendors-list"] });
      queryClient.invalidateQueries({ queryKey: ["vendors-stats"] });
      setIsOnboardOpen(false);
      setOnboardForm({
        companyName: "",
        category: "STATIONERY_BOOKS",
        tradeLicenseNumber: "",
        tinOrBinNumber: "",
        contactPerson: "",
        email: "",
        phone: "",
        bankAccountDetails: "",
      });
      notify("success", `Vendor ${vnd.companyName} (${vnd.vendorCode}) onboarded successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const updateComplianceMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: typeof auditForm }) =>
      apiClient<VendorProfile>(`/v1/vendors/${id}/compliance`, {
        method: "PATCH",
        body: JSON.stringify(dto),
      }),
    onSuccess: (vnd) => {
      queryClient.invalidateQueries({ queryKey: ["vendors-list"] });
      queryClient.invalidateQueries({ queryKey: ["vendors-stats"] });
      setAuditVendor(null);
      notify("success", `Compliance status for ${vnd.companyName} updated to ${vnd.complianceStatus}!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const filteredVendors = vendors.filter(
    (v) =>
      v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Portal & Compliance"
        subtitle="Vendor onboarding, Trade License & TIN tax compliance verification, performance ratings, and blacklist screening."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Procurement & Supplier Compliance</span>
          </div>
        }
        actions={
          <button
            onClick={() => setIsOnboardOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Vendor</span>
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
          <span className="text-xs text-muted-foreground">Onboarded Vendors</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalVendors ?? vendors.length}</div>
          <span className="text-[11px] text-primary font-medium">Registered Suppliers</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Compliance Verification</span>
          <div className="text-2xl font-bold text-foreground">{stats?.verifiedPercentage ?? 85}%</div>
          <span className="text-[11px] text-emerald-400 font-medium">Audited Trade & Tax</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Active RFQ Bidding</span>
          <div className="text-2xl font-bold text-foreground">{stats?.activeRfqs ?? 3}</div>
          <span className="text-[11px] text-primary font-medium">Live Tender Quotations</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Blacklisted / Suspended</span>
          <div className="text-2xl font-bold text-foreground">{stats?.blacklistedCount ?? 0}</div>
          <span className="text-[11px] text-muted-foreground">Sanction Screening</span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "DIRECTORY", label: "Vendor Directory & Verification" },
          { id: "TAX_LICENSE", label: "Trade License & Tax Compliance" },
          { id: "PERFORMANCE", label: "Performance Rating & Order Fulfillment" },
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

      {/* ─── TAB 1: DIRECTORY ───────────────────────────────────────────────── */}
      {activeTab === "DIRECTORY" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Vendor Name, Code, or Contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {["ALL", "VERIFIED", "PENDING_REVIEW", "BLACKLISTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedStatus === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}

              <div className="h-4 w-px bg-border/40 mx-1" />

              {["ALL", "STATIONERY_BOOKS", "IT_HARDWARE_SOLAR", "TRANSPORT_LOGISTICS"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? "bg-secondary text-primary font-bold border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {cat === "ALL" ? "All Categories" : cat.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">Loading vendors...</div>
            ) : (
              filteredVendors.map((vendor) => (
                <div key={vendor.id} className="glass-card p-5 rounded-2xl border space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-primary font-bold">{vendor.vendorCode}</span>
                      <h4 className="font-bold text-foreground text-sm">{vendor.companyName}</h4>
                      <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-semibold inline-block">
                        {vendor.category.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                          vendor.complianceStatus === "VERIFIED"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : vendor.complianceStatus === "BLACKLISTED"
                              ? "bg-destructive/15 text-destructive border-destructive/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {vendor.complianceStatus === "VERIFIED" && <ShieldCheck className="w-3 h-3" />}
                        {vendor.complianceStatus === "BLACKLISTED" && <ShieldAlert className="w-3 h-3" />}
                        {vendor.complianceStatus.replace(/_/g, " ")}
                      </span>

                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{vendor.ratingScore.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/30">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Contact Person</span>
                      <span className="font-medium text-foreground">{vendor.contactPerson}</span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{vendor.phone}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground block">Orders Fulfilled</span>
                      <span className="font-bold text-foreground">{vendor.totalOrdersFulfilled} Contracts</span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    </div>
                  </div>

                  {vendor.complianceRemarks && (
                    <p className="text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-border/30">
                      {vendor.complianceRemarks}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setAuditVendor(vendor);
                        setAuditForm({
                          complianceStatus: vendor.complianceStatus,
                          ratingScore: vendor.ratingScore,
                          complianceRemarks: vendor.complianceRemarks || "",
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors border border-border/40"
                    >
                      Audit Compliance
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: TAX & LICENSE ───────────────────────────────────────────── */}
      {activeTab === "TAX_LICENSE" && (
        <div className="glass-card rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Trade License No.</th>
                  <th className="p-4">TIN / BIN Registration</th>
                  <th className="p-4">Settlement Bank Account</th>
                  <th className="p-4">Onboarding Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-foreground block">{vendor.companyName}</span>
                      <span className="font-mono text-[10px] text-primary">{vendor.vendorCode}</span>
                    </td>

                    <td className="p-4 font-mono text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{vendor.tradeLicenseNumber}</span>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-semibold text-foreground">{vendor.tinOrBinNumber}</td>

                    <td className="p-4 font-mono text-muted-foreground">{vendor.bankAccountDetails}</td>

                    <td className="p-4 text-muted-foreground">{vendor.onboardingDate}</td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          vendor.complianceStatus === "VERIFIED"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {vendor.complianceStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: PERFORMANCE ─────────────────────────────────────────────── */}
      {activeTab === "PERFORMANCE" && (
        <div className="glass-card rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="p-4">Vendor Code & Company</th>
                  <th className="p-4">Procurement Category</th>
                  <th className="p-4 text-center">Orders Fulfilled</th>
                  <th className="p-4 text-center">Quality Rating</th>
                  <th className="p-4">Tier Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-foreground block">{vendor.companyName}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{vendor.vendorCode}</span>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold">
                        {vendor.category.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-4 text-center font-bold text-foreground">{vendor.totalOrdersFulfilled}</td>

                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{vendor.ratingScore.toFixed(1)} / 5.0</span>
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="text-xs font-semibold text-emerald-400">
                        {vendor.ratingScore >= 4.5 ? "Preferred Grade-A Supplier" : "Standard Approved Supplier"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: ONBOARD VENDOR ─────────────────────────────────────────── */}
      {isOnboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>Onboard New Supplier / Vendor</span>
              </h3>
              <button onClick={() => setIsOnboardOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onboardMutation.mutate(onboardForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Company / Enterprise Legal Name</label>
                <input
                  type="text"
                  required
                  value={onboardForm.companyName}
                  onChange={(e) => setOnboardForm({ ...onboardForm, companyName: e.target.value })}
                  placeholder="e.g. Meghna Scientific & IT Solutions Ltd."
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Procurement Category</label>
                <select
                  value={onboardForm.category}
                  onChange={(e) => setOnboardForm({ ...onboardForm, category: e.target.value as VendorProfile["category"] })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="STATIONERY_BOOKS">Stationery, Books & Printing</option>
                  <option value="IT_HARDWARE_SOLAR">IT Equipment, Solar & Robotics</option>
                  <option value="CONSTRUCTION_MAINTENANCE">School Maintenance & Construction</option>
                  <option value="FOOD_NUTRITION">Student Nutrition & Meals</option>
                  <option value="TRANSPORT_LOGISTICS">Courier & Logistics</option>
                  <option value="GENERAL_SERVICES">General Corporate Services</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Trade License Number</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.tradeLicenseNumber}
                    onChange={(e) => setOnboardForm({ ...onboardForm, tradeLicenseNumber: e.target.value })}
                    placeholder="TRAD/DNCC/110948/2026"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">TIN / BIN Number</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.tinOrBinNumber}
                    onChange={(e) => setOnboardForm({ ...onboardForm, tinOrBinNumber: e.target.value })}
                    placeholder="TIN-551928374619"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.contactPerson}
                    onChange={(e) => setOnboardForm({ ...onboardForm, contactPerson: e.target.value })}
                    placeholder="Tanvir Ahmed"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                    placeholder="+8801719998877"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Official Email</label>
                  <input
                    type="email"
                    required
                    value={onboardForm.email}
                    onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                    placeholder="sales@meghnait.com"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Settlement Bank Account</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.bankAccountDetails}
                    onChange={(e) => setOnboardForm({ ...onboardForm, bankAccountDetails: e.target.value })}
                    placeholder="BRAC Bank A/C: 150-102-8821"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOnboardOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {onboardMutation.isPending ? "Submitting..." : "Submit Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: AUDIT COMPLIANCE ────────────────────────────────────────── */}
      {auditVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Audit Vendor Compliance & Rating</span>
              </h3>
              <button onClick={() => setAuditVendor(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-secondary/30 rounded-xl border border-border/30 space-y-1">
              <span className="font-bold text-foreground text-sm block">{auditVendor.companyName}</span>
              <span className="font-mono text-xs text-primary block">{auditVendor.vendorCode}</span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Trade: {auditVendor.tradeLicenseNumber} | TIN: {auditVendor.tinOrBinNumber}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateComplianceMutation.mutate({ id: auditVendor.id, dto: auditForm });
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Compliance Verification Decision</label>
                <select
                  value={auditForm.complianceStatus}
                  onChange={(e) => setAuditForm({ ...auditForm, complianceStatus: e.target.value as VendorProfile["complianceStatus"] })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="VERIFIED">VERIFIED (Trade & Tax Validated)</option>
                  <option value="PENDING_REVIEW">PENDING REVIEW (Awaiting Documents)</option>
                  <option value="REJECTED">REJECTED (Invalid Documentation)</option>
                  <option value="BLACKLISTED">BLACKLISTED (Sanctioned / Non-Compliant)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Supplier Rating Score (1.0 - 5.0)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={auditForm.ratingScore}
                  onChange={(e) => setAuditForm({ ...auditForm, ratingScore: parseFloat(e.target.value) || 5.0 })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Audit Remarks & Justification</label>
                <textarea
                  rows={3}
                  value={auditForm.complianceRemarks}
                  onChange={(e) => setAuditForm({ ...auditForm, complianceRemarks: e.target.value })}
                  placeholder="e.g. Verified physical store, audited 2026 tax returns and signed integrity pact."
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAuditVendor(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateComplianceMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {updateComplianceMutation.isPending ? "Saving..." : "Update Compliance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
