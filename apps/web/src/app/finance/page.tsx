"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Scale,
  Building2,
  Search,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface Account {
  id: string;
  code: string;
  name: string;
  accountClass: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  normalBalance: "DEBIT" | "CREDIT";
  parentCode?: string;
  currentBalanceBDT: number;
  isActive: boolean;
}

interface VoucherLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitBDT: number;
  creditBDT: number;
  costCenterOrBranch?: string;
}

interface Voucher {
  id: string;
  voucherNumber: string;
  type: "JOURNAL_VOUCHER" | "PAYMENT_VOUCHER" | "RECEIPT_VOUCHER";
  voucherDate: string;
  payeeOrPayer?: string;
  narration: string;
  status: string;
  totalDebitBDT: number;
  totalCreditBDT: number;
  createdBy: string;
  approvedBy?: string;
  lines: VoucherLine[];
}

interface FinanceStats {
  totalAccounts: number;
  totalAssetBalanceBDT: number;
  totalExpenseThisMonthBDT: number;
  pendingVoucherApprovals: number;
}

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"COA" | "VOUCHERS" | "COST_CENTERS">("COA");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewVoucherOpen, setIsNewVoucherOpen] = useState(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New Account Form
  const [accountForm, setAccountForm] = useState({
    code: "",
    name: "",
    accountClass: "EXPENSE" as Account["accountClass"],
    normalBalance: "DEBIT" as Account["normalBalance"],
    initialBalanceBDT: 0,
  });

  // New Voucher Form
  const [voucherForm, setVoucherForm] = useState({
    type: "PAYMENT_VOUCHER" as Voucher["type"],
    payeeOrPayer: "",
    narration: "",
    lines: [
      { accountCode: "5020", description: "Learning Supplies & Kits", debitBDT: 50000, creditBDT: 0, costCenterOrBranch: "Rajshahi School" },
      { accountCode: "1010", description: "Online EFT Bank Transfer", debitBDT: 0, creditBDT: 50000, costCenterOrBranch: "Central HQ" },
    ],
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ["finance-accounts", selectedClass],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedClass !== "ALL") params.append("class", selectedClass);
      return apiClient<Account[]>(`/v1/finance/accounts?${params.toString()}`);
    },
  });

  const { data: vouchers = [], isLoading: isLoadingVouchers } = useQuery<Voucher[]>({
    queryKey: ["finance-vouchers"],
    queryFn: () => apiClient<Voucher[]>("/v1/finance/vouchers"),
  });

  const { data: stats } = useQuery<FinanceStats>({
    queryKey: ["finance-stats"],
    queryFn: () => apiClient<FinanceStats>("/v1/finance/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createAccountMutation = useMutation({
    mutationFn: (dto: typeof accountForm) =>
      apiClient<Account>("/v1/finance/accounts", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (acc) => {
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      setIsNewAccountOpen(false);
      setAccountForm({ code: "", name: "", accountClass: "EXPENSE", normalBalance: "DEBIT", initialBalanceBDT: 0 });
      notify("success", `Account ${acc.code} - ${acc.name} created successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const createVoucherMutation = useMutation({
    mutationFn: (dto: typeof voucherForm) =>
      apiClient<Voucher>("/v1/finance/vouchers", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (vch) => {
      queryClient.invalidateQueries({ queryKey: ["finance-vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      setIsNewVoucherOpen(false);
      notify("success", `Voucher ${vch.voucherNumber} created & posted to General Ledger!`);
    },
    onError: (err) => notify("error", err.message),
  });

  // Real-time double entry calculation
  const totalDebit = voucherForm.lines.reduce((sum, l) => sum + (Number(l.debitBDT) || 0), 0);
  const totalCredit = voucherForm.lines.reduce((sum, l) => sum + (Number(l.creditBDT) || 0), 0);
  const diff = totalDebit - totalCredit;
  const isBalanced = Math.abs(diff) < 0.01 && totalDebit > 0;

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.includes(searchTerm),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & General Ledger"
        subtitle="Chart of accounts, double-entry vouchers (JV / PV / RV), and financial reporting."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Double-Entry Financial System</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewAccountOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
            <button
              onClick={() => setIsNewVoucherOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <Scale className="w-4 h-4" />
              <span>New Voucher</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Total Liquid Assets</span>
          <div className="text-2xl font-bold text-foreground">
            BDT {(stats?.totalAssetBalanceBDT ?? 17470000).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Bank & Petty Cash</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Expenses (YTD)</span>
          <div className="text-2xl font-bold text-foreground">
            BDT {(stats?.totalExpenseThisMonthBDT ?? 4960000).toLocaleString()}
          </div>
          <span className="text-[11px] text-primary font-medium">Salaries & Programmes</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Chart of Accounts</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalAccounts ?? accounts.length}</div>
          <span className="text-[11px] text-muted-foreground">General Ledger Codes</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Vouchers Posted</span>
          <div className="text-2xl font-bold text-foreground">{vouchers.length}</div>
          <span className="text-[11px] text-emerald-400 font-medium">All Balanced & Audited</span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "COA", label: "Chart of Accounts" },
          { id: "VOUCHERS", label: "Financial Vouchers (JV / PV / RV)" },
          { id: "COST_CENTERS", label: "Branch & Programme Cost Centers" },
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

      {/* ─── TAB 1: CHART OF ACCOUNTS ───────────────────────────────────────── */}
      {activeTab === "COA" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Account Code or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedClass === cls
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">Account Code</th>
                    <th className="p-4">Account Title</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Normal Balance</th>
                    <th className="p-4 text-right">Current Balance (BDT)</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingAccounts ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading Chart of Accounts...
                      </td>
                    </tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-primary">{acc.code}</td>
                        <td className="p-4 font-semibold text-foreground">{acc.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold">
                            {acc.accountClass}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground font-semibold">
                          {acc.normalBalance}
                        </td>
                        <td className="p-4 font-mono font-bold text-right text-foreground">
                          BDT {acc.currentBalanceBDT.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
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

      {/* ─── TAB 2: VOUCHERS ────────────────────────────────────────────────── */}
      {activeTab === "VOUCHERS" && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">Voucher No.</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Payee / Narration</th>
                    <th className="p-4">Debit / Credit Breakdown</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingVouchers ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Loading vouchers...
                      </td>
                    </tr>
                  ) : vouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No financial vouchers recorded.
                      </td>
                    </tr>
                  ) : (
                    vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-primary">
                          {v.voucherNumber}
                          <span className="text-[10px] text-muted-foreground block">{v.createdBy}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[10px] font-semibold">
                            {v.type.replace("_", " ")}
                          </span>
                        </td>

                        <td className="p-4 text-muted-foreground">{v.voucherDate}</td>

                        <td className="p-4 max-w-xs">
                          {v.payeeOrPayer && <span className="font-bold text-foreground block">{v.payeeOrPayer}</span>}
                          <span className="text-muted-foreground text-[11px]">{v.narration}</span>
                        </td>

                        <td className="p-4 space-y-1">
                          {v.lines.map((l, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 text-[11px] font-mono">
                              <span className="text-foreground">
                                {l.accountCode} - {l.accountName.substring(0, 24)}...
                              </span>
                              <span className={l.debitBDT > 0 ? "text-emerald-400 font-semibold" : "text-primary"}>
                                {l.debitBDT > 0 ? `DR ${l.debitBDT.toLocaleString()}` : `CR ${l.creditBDT.toLocaleString()}`}
                              </span>
                            </div>
                          ))}
                        </td>

                        <td className="p-4 font-mono font-bold text-right text-foreground">
                          BDT {v.totalDebitBDT.toLocaleString()}
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {v.status}
                          </span>
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

      {/* ─── TAB 3: COST CENTERS & BRANCH ALLOCATIONS ───────────────────────── */}
      {activeTab === "COST_CENTERS" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { branch: "Rajshahi School Branch", budget: 1200000, spent: 890000, teachers: 14, students: 280 },
            { branch: "Bandarban School Branch", budget: 950000, spent: 710000, teachers: 10, students: 195 },
            { branch: "Habiganj School Branch", budget: 850000, spent: 620000, teachers: 9, students: 175 },
            { branch: "Chittagong School Branch", budget: 1400000, spent: 1050000, teachers: 16, students: 310 },
            { branch: "Gazipur School Branch", budget: 1100000, spent: 840000, teachers: 12, students: 240 },
            { branch: "Central Operations HQ (Dhaka)", budget: 3500000, spent: 2850000, teachers: 0, students: 0 },
          ].map((center, idx) => {
            const pct = Math.round((center.spent / center.budget) * 100);
            return (
              <div key={idx} className="glass-card p-5 rounded-2xl border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground text-xs">{center.branch}</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{pct}% Spent</span>
                </div>

                <div className="w-full bg-secondary/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Utilized (BDT)</span>
                    <span className="font-bold text-foreground">{center.spent.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Allocated Budget</span>
                    <span className="font-semibold text-muted-foreground">{center.budget.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: NEW VOUCHER (DOUBLE ENTRY) ───────────────────────────────── */}
      {isNewVoucherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-2xl w-full p-6 rounded-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <span>Create Double-Entry Financial Voucher</span>
              </h3>
              <button onClick={() => setIsNewVoucherOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isBalanced) return;
                createVoucherMutation.mutate(voucherForm);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Voucher Type</label>
                  <select
                    value={voucherForm.type}
                    onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value as Voucher["type"] })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="PAYMENT_VOUCHER">Payment Voucher (PV)</option>
                    <option value="RECEIPT_VOUCHER">Receipt Voucher (RV)</option>
                    <option value="JOURNAL_VOUCHER">Journal Voucher (JV)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Payee / Beneficiary / Payer</label>
                  <input
                    type="text"
                    value={voucherForm.payeeOrPayer}
                    onChange={(e) => setVoucherForm({ ...voucherForm, payeeOrPayer: e.target.value })}
                    placeholder="e.g. Bengal Paper & Stationery"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Narration & Purpose</label>
                <input
                  type="text"
                  required
                  value={voucherForm.narration}
                  onChange={(e) => setVoucherForm({ ...voucherForm, narration: e.target.value })}
                  placeholder="e.g. Science Lab microscope procurement settlement"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Multi-Line Debit / Credit Entries */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Double-Entry Journal Lines</label>
                  <button
                    type="button"
                    onClick={() =>
                      setVoucherForm({
                        ...voucherForm,
                        lines: [
                          ...voucherForm.lines,
                          {
                            accountCode: accounts[0]?.code || "1010",
                            description: "Voucher Line Entry",
                            debitBDT: 0,
                            creditBDT: 0,
                            costCenterOrBranch: "Rajshahi School",
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line</span>
                  </button>
                </div>

                {voucherForm.lines.map((line, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-secondary/30 border border-border/30 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <select
                        value={line.accountCode}
                        onChange={(e) => {
                          const newLines = [...voucherForm.lines];
                          newLines[idx]!.accountCode = e.target.value;
                          setVoucherForm({ ...voucherForm, lines: newLines });
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground"
                      >
                        {accounts.map((a) => (
                          <option key={a.code} value={a.code}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => {
                          const newLines = [...voucherForm.lines];
                          newLines[idx]!.description = e.target.value;
                          setVoucherForm({ ...voucherForm, lines: newLines });
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Debit BDT"
                        value={line.debitBDT}
                        onChange={(e) => {
                          const newLines = [...voucherForm.lines];
                          newLines[idx]!.debitBDT = parseFloat(e.target.value) || 0;
                          setVoucherForm({ ...voucherForm, lines: newLines });
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Credit BDT"
                        value={line.creditBDT}
                        onChange={(e) => {
                          const newLines = [...voucherForm.lines];
                          newLines[idx]!.creditBDT = parseFloat(e.target.value) || 0;
                          setVoucherForm({ ...voucherForm, lines: newLines });
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      {voucherForm.lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newLines = voucherForm.lines.filter((_, i) => i !== idx);
                            setVoucherForm({ ...voucherForm, lines: newLines });
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-time Balance Check Widget */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${
                  isBalanced
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                <div>
                  <span>Debit: BDT {totalDebit.toLocaleString()}</span>
                  <span className="mx-2">|</span>
                  <span>Credit: BDT {totalCredit.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isBalanced ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>BALANCED (Difference: 0)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>UNBALANCED (Diff: BDT {Math.abs(diff).toLocaleString()})</span>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewVoucherOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || createVoucherMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {createVoucherMutation.isPending ? "Posting..." : "Post to General Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: NEW ACCOUNT ──────────────────────────────────────────────── */}
      {isNewAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <span>Add Chart of Account</span>
              </h3>
              <button onClick={() => setIsNewAccountOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAccountMutation.mutate(accountForm);
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Account Code</label>
                  <input
                    type="text"
                    required
                    value={accountForm.code}
                    onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                    placeholder="e.g. 5040"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Account Class</label>
                  <select
                    value={accountForm.accountClass}
                    onChange={(e) => {
                      const cls = e.target.value as Account["accountClass"];
                      setAccountForm({
                        ...accountForm,
                        accountClass: cls,
                        normalBalance: cls === "ASSET" || cls === "EXPENSE" ? "DEBIT" : "CREDIT",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="ASSET">Asset (1xxx)</option>
                    <option value="LIABILITY">Liability (2xxx)</option>
                    <option value="EQUITY">Equity (3xxx)</option>
                    <option value="REVENUE">Revenue (4xxx)</option>
                    <option value="EXPENSE">Expense (5xxx)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Account Title / Name</label>
                <input
                  type="text"
                  required
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="e.g. Student Meal Nutrition Fund"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Normal Balance</label>
                  <select
                    value={accountForm.normalBalance}
                    onChange={(e) => setAccountForm({ ...accountForm, normalBalance: e.target.value as Account["normalBalance"] })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="DEBIT">Debit (DR)</option>
                    <option value="CREDIT">Credit (CR)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Opening Balance (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={accountForm.initialBalanceBDT}
                    onChange={(e) => setAccountForm({ ...accountForm, initialBalanceBDT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewAccountOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAccountMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createAccountMutation.isPending ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
