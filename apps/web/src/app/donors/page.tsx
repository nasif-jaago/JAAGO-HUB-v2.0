"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HeartHandshake,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Heart,
  Globe,
  DollarSign,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface Donor {
  id: string;
  name: string;
  donorType: "INSTITUTIONAL_FOUNDATION" | "CORPORATE_CSR" | "GOVERNMENT_AID" | "INDIVIDUAL_SPONSOR";
  country: string;
  contactPerson: string;
  email: string;
  phone?: string;
  totalPledgedBDT: number;
  activeGrantsCount: number;
  sponsoredChildrenCount: number;
}

interface GrantTranche {
  id: string;
  trancheNumber: number;
  expectedDate: string;
  disbursedDate?: string;
  amountBDT: number;
  status: "SCHEDULED" | "DISBURSED" | "UTILIZED" | "AUDITED";
  remarks?: string;
}

interface Grant {
  id: string;
  grantCode: string;
  projectTitle: string;
  donorId: string;
  donorName: string;
  totalAmountBDT: number;
  disbursedAmountBDT: number;
  utilizedAmountBDT: number;
  currency: string;
  startDate: string;
  endDate: string;
  targetSchoolBranch: string;
  status: string;
  tranches: GrantTranche[];
}

interface DonorStats {
  totalGrantPortfolioBDT: number;
  totalDonors: number;
  activeGrantsCount: number;
  totalSponsoredChildren: number;
}

export default function DonorsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"GRANTS" | "DONORS" | "TRANCHES">("GRANTS");
  const [donorTypeFilter, setDonorTypeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewGrantOpen, setIsNewGrantOpen] = useState(false);
  const [isNewDonorOpen, setIsNewDonorOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New Donor Form State
  const [donorForm, setDonorForm] = useState({
    name: "",
    donorType: "INSTITUTIONAL_FOUNDATION" as Donor["donorType"],
    country: "United Kingdom",
    contactPerson: "",
    email: "",
    phone: "",
    totalPledgedBDT: 5000000,
  });

  // New Grant Form State
  const [grantForm, setGrantForm] = useState({
    grantCode: "",
    projectTitle: "",
    donorId: "",
    totalAmountBDT: 10000000,
    startDate: new Date().toISOString().split("T")[0]!,
    endDate: "2027-12-31",
    targetSchoolBranch: "All JAAGO Branch Schools",
    tranchesCount: 2,
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: donors = [], isLoading: isLoadingDonors } = useQuery<Donor[]>({
    queryKey: ["donors-list", donorTypeFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (donorTypeFilter !== "ALL") params.append("type", donorTypeFilter);
      return apiClient<Donor[]>(`/v1/donors?${params.toString()}`);
    },
  });

  const { data: grants = [], isLoading: isLoadingGrants } = useQuery<Grant[]>({
    queryKey: ["donors-grants"],
    queryFn: () => apiClient<Grant[]>("/v1/donors/grants"),
  });

  const { data: stats } = useQuery<DonorStats>({
    queryKey: ["donors-stats"],
    queryFn: () => apiClient<DonorStats>("/v1/donors/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createDonorMutation = useMutation({
    mutationFn: (dto: typeof donorForm) =>
      apiClient<Donor>("/v1/donors", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (dnr) => {
      queryClient.invalidateQueries({ queryKey: ["donors-list"] });
      queryClient.invalidateQueries({ queryKey: ["donors-stats"] });
      setIsNewDonorOpen(false);
      setDonorForm({
        name: "",
        donorType: "INSTITUTIONAL_FOUNDATION",
        country: "United Kingdom",
        contactPerson: "",
        email: "",
        phone: "",
        totalPledgedBDT: 5000000,
      });
      notify("success", `Donor ${dnr.name} registered successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const createGrantMutation = useMutation({
    mutationFn: (dto: typeof grantForm) =>
      apiClient<Grant>("/v1/donors/grants", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (grnt) => {
      queryClient.invalidateQueries({ queryKey: ["donors-grants"] });
      queryClient.invalidateQueries({ queryKey: ["donors-list"] });
      queryClient.invalidateQueries({ queryKey: ["donors-stats"] });
      setIsNewGrantOpen(false);
      setGrantForm({
        grantCode: "",
        projectTitle: "",
        donorId: "",
        totalAmountBDT: 10000000,
        startDate: new Date().toISOString().split("T")[0]!,
        endDate: "2027-12-31",
        targetSchoolBranch: "All JAAGO Branch Schools",
        tranchesCount: 2,
      });
      notify("success", `Grant Agreement ${grnt.grantCode} activated with ${grnt.tranches.length} tranches!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const filteredGrants = grants.filter(
    (g) =>
      g.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.grantCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.donorName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donors & Grant Management"
        subtitle="Institutional grants portfolio, donor partnerships, milestone disbursements, and child sponsorship tracking."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Fundraising & Grants Portfolio</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewDonorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Donor Partner</span>
            </button>
            <button
              onClick={() => {
                if (donors.length > 0) {
                  setGrantForm((prev) => ({ ...prev, donorId: donors[0]!.id }));
                }
                setIsNewGrantOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>Register Grant</span>
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

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Total Grant Portfolio</span>
          <div className="text-2xl font-bold text-foreground">
            BDT {(stats?.totalGrantPortfolioBDT ?? 50000000).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Multilateral & Foundations</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Active Donor Partners</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalDonors ?? donors.length}</div>
          <span className="text-[11px] text-primary font-medium">Foundations, CSR & Donors</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Sponsored Children</span>
          <div className="text-2xl font-bold text-foreground flex items-center gap-1.5">
            <span>{stats?.totalSponsoredChildren ?? 248}</span>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
          </div>
          <span className="text-[11px] text-rose-400 font-medium">1-to-1 Child Sponsorship</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Active Projects</span>
          <div className="text-2xl font-bold text-foreground">{stats?.activeGrantsCount ?? grants.length}</div>
          <span className="text-[11px] text-muted-foreground">Under Implementation</span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "GRANTS", label: "Institutional Grants & Projects" },
          { id: "DONORS", label: "Donor & Partner Directory" },
          { id: "TRANCHES", label: "Tranche Disbursements & Milestones" },
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

      {/* ─── TAB 1: GRANTS ──────────────────────────────────────────────────── */}
      {activeTab === "GRANTS" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Grant Code, Project, or Donor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingGrants ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">Loading grants portfolio...</div>
            ) : (
              filteredGrants.map((grant) => {
                const burnPct = Math.round((grant.utilizedAmountBDT / grant.totalAmountBDT) * 100);
                return (
                  <div key={grant.id} className="glass-card p-5 rounded-2xl border space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] text-primary font-bold">{grant.grantCode}</span>
                        <h4 className="font-bold text-foreground text-sm leading-snug">{grant.projectTitle}</h4>
                        <span className="text-xs text-primary font-semibold block">{grant.donorName}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        {grant.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-muted-foreground">
                          Utilized: BDT {grant.utilizedAmountBDT.toLocaleString()} / {grant.totalAmountBDT.toLocaleString()}
                        </span>
                        <span className="font-bold text-foreground">{burnPct}% Burn</span>
                      </div>
                      <div className="w-full bg-secondary/60 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${burnPct}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Disbursed</span>
                        <span className="font-semibold text-emerald-400">
                          BDT {grant.disbursedAmountBDT.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Target Branches</span>
                        <span className="font-semibold text-foreground truncate block">{grant.targetSchoolBranch}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Tranches</span>
                        <span className="font-semibold text-primary">{grant.tranches.length} Scheduled</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: DONOR DIRECTORY ─────────────────────────────────────────── */}
      {activeTab === "DONORS" && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "INSTITUTIONAL_FOUNDATION", "CORPORATE_CSR", "GOVERNMENT_AID", "INDIVIDUAL_SPONSOR"].map((type) => (
              <button
                key={type}
                onClick={() => setDonorTypeFilter(type)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  donorTypeFilter === type
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {type.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">Donor / Partner Organization</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Country</th>
                    <th className="p-4">Contact Person & Email</th>
                    <th className="p-4 text-right">Total Pledged (BDT)</th>
                    <th className="p-4 text-center">Sponsored Children</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingDonors ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading donors...</td>
                    </tr>
                  ) : (
                    donors.map((donor) => (
                      <tr key={donor.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-foreground text-sm block">{donor.name}</span>
                          <span className="text-[10px] text-muted-foreground">{donor.activeGrantsCount} Active Grants</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold">
                            {donor.donorType.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{donor.country}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-medium text-foreground block">{donor.contactPerson}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{donor.email}</span>
                        </td>

                        <td className="p-4 font-mono font-bold text-right text-emerald-400">
                          BDT {donor.totalPledgedBDT.toLocaleString()}
                        </td>

                        <td className="p-4 text-center font-bold text-foreground">
                          {donor.sponsoredChildrenCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-400">
                              <Heart className="w-3 h-3 fill-rose-400/20" />
                              <span>{donor.sponsoredChildrenCount}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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

      {/* ─── TAB 3: TRANCHES ────────────────────────────────────────────────── */}
      {activeTab === "TRANCHES" && (
        <div className="glass-card rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="p-4">Grant Reference</th>
                  <th className="p-4">Project & Milestone Remarks</th>
                  <th className="p-4">Tranche No.</th>
                  <th className="p-4">Expected Date</th>
                  <th className="p-4 text-right">Tranche Amount (BDT)</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {grants.flatMap((grant) =>
                  grant.tranches.map((tranche) => (
                    <tr key={tranche.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary">{grant.grantCode}</td>
                      <td className="p-4">
                        <span className="font-semibold text-foreground block">{grant.projectTitle}</span>
                        <span className="text-[10px] text-muted-foreground">{tranche.remarks}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-foreground">Tranche #{tranche.trancheNumber}</td>
                      <td className="p-4 text-muted-foreground">{tranche.expectedDate}</td>
                      <td className="p-4 font-mono font-bold text-right text-foreground">
                        BDT {tranche.amountBDT.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            tranche.status === "DISBURSED"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {tranche.status}
                        </span>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTER GRANT ───────────────────────────────────────────── */}
      {isNewGrantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Register Institutional Grant Agreement</span>
              </h3>
              <button onClick={() => setIsNewGrantOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createGrantMutation.mutate(grantForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Donor Partner Organization</label>
                <select
                  value={grantForm.donorId}
                  onChange={(e) => setGrantForm({ ...grantForm, donorId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Grant Reference Code</label>
                  <input
                    type="text"
                    required
                    value={grantForm.grantCode}
                    onChange={(e) => setGrantForm({ ...grantForm, grantCode: e.target.value })}
                    placeholder="GRNT-UNICEF-2026-02"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Total Grant Amount (BDT)</label>
                  <input
                    type="number"
                    min="100000"
                    required
                    value={grantForm.totalAmountBDT}
                    onChange={(e) => setGrantForm({ ...grantForm, totalAmountBDT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Project Title</label>
                <input
                  type="text"
                  required
                  value={grantForm.projectTitle}
                  onChange={(e) => setGrantForm({ ...grantForm, projectTitle: e.target.value })}
                  placeholder="e.g. Science Laboratory Apparatus & Teacher Training"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    required
                    value={grantForm.startDate}
                    onChange={(e) => setGrantForm({ ...grantForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    required
                    value={grantForm.endDate}
                    onChange={(e) => setGrantForm({ ...grantForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Target School Branches</label>
                  <input
                    type="text"
                    required
                    value={grantForm.targetSchoolBranch}
                    onChange={(e) => setGrantForm({ ...grantForm, targetSchoolBranch: e.target.value })}
                    placeholder="e.g. Rajshahi & Bandarban Schools"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Tranche Installments</label>
                  <select
                    value={grantForm.tranchesCount}
                    onChange={(e) => setGrantForm({ ...grantForm, tranchesCount: parseInt(e.target.value, 10) || 2 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value={1}>1 Lump Sum Tranche</option>
                    <option value={2}>2 Milestone Tranches</option>
                    <option value={4}>4 Quarterly Tranches</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewGrantOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGrantMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createGrantMutation.isPending ? "Creating..." : "Save Grant Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD DONOR ────────────────────────────────────────────────── */}
      {isNewDonorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-primary" />
                <span>Add Donor Partner Profile</span>
              </h3>
              <button onClick={() => setIsNewDonorOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDonorMutation.mutate(donorForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Organization / Donor Name</label>
                <input
                  type="text"
                  required
                  value={donorForm.name}
                  onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                  placeholder="e.g. Global Education Development Trust"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Donor Type</label>
                  <select
                    value={donorForm.donorType}
                    onChange={(e) => setDonorForm({ ...donorForm, donorType: e.target.value as Donor["donorType"] })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="INSTITUTIONAL_FOUNDATION">Institutional Foundation</option>
                    <option value="CORPORATE_CSR">Corporate CSR</option>
                    <option value="GOVERNMENT_AID">Government / Multilateral Aid</option>
                    <option value="INDIVIDUAL_SPONSOR">Individual Child Sponsor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Country</label>
                  <input
                    type="text"
                    required
                    value={donorForm.country}
                    onChange={(e) => setDonorForm({ ...donorForm, country: e.target.value })}
                    placeholder="Australia"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={donorForm.contactPerson}
                    onChange={(e) => setDonorForm({ ...donorForm, contactPerson: e.target.value })}
                    placeholder="Dr. Alistair Finch"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    value={donorForm.email}
                    onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                    placeholder="contact@gedt.org"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Total Pledged Commitment (BDT)</label>
                <input
                  type="number"
                  min="0"
                  value={donorForm.totalPledgedBDT}
                  onChange={(e) => setDonorForm({ ...donorForm, totalPledgedBDT: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewDonorOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDonorMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createDonorMutation.isPending ? "Adding..." : "Save Donor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
