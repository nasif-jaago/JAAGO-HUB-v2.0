"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  FileSpreadsheet,
  Plus,
  X,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Award,
  PackageCheck,
  Send,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface PRItem {
  id: string;
  itemDescription: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalEstimatedPrice: number;
}

interface VendorQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  quotedAmount: number;
  deliveryLeadDays: number;
  warrantyPeriod: string;
  validUntil: string;
  isLowestBidder?: boolean;
  isRecommended?: boolean;
  remarks?: string;
  submittedAt: string;
}

interface PurchaseRequisition {
  id: string;
  referenceNumber: string;
  title: string;
  departmentName: string;
  officeLocation: string;
  requesterName: string;
  estimatedTotalAmount: number;
  currency: string;
  justification: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "QUOTING" | "CS_READY" | "PO_ISSUED" | "DELIVERED" | "REJECTED";
  items: PRItem[];
  quotes: VendorQuote[];
  awardedVendorName?: string;
  associatedPoNumber?: string;
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  prReference: string;
  vendorName: string;
  orderTotalAmount: number;
  currency: string;
  paymentTerms: string;
  deliveryLocation: string;
  deliveryDeadline: string;
  status: string;
  issuedAt: string;
}

interface ProcurementStats {
  openRequisitions: number;
  csInReview: number;
  issuedPOs: number;
  totalCommittedSpendBDT: number;
}

export default function ProcurementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ALL" | "QUOTING" | "CS_READY" | "PO">("ALL");
  const [isCreatePrOpen, setIsCreatePrOpen] = useState(false);
  const [csViewPr, setCsViewPr] = useState<PurchaseRequisition | null>(null);
  const [quotePrTarget, setQuotePrTarget] = useState<PurchaseRequisition | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New PR Form State
  const [prForm, setPrForm] = useState({
    title: "",
    departmentName: "Education & Schools",
    officeLocation: "Rajshahi School Branch",
    justification: "",
    currency: "BDT",
    items: [
      { itemDescription: "", category: "Lab Equipment", quantity: 1, unit: "Sets", estimatedUnitPrice: 0 },
    ],
  });

  // New Vendor Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    vendorName: "",
    quotedAmount: 0,
    deliveryLeadDays: 7,
    warrantyPeriod: "1 Year Official Warranty",
    validUntil: "2026-09-30",
    remarks: "",
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: requisitions = [], isLoading: isLoadingPrs } = useQuery<PurchaseRequisition[]>({
    queryKey: ["procurement-prs"],
    queryFn: () => apiClient<PurchaseRequisition[]>("/v1/procurement/pr"),
  });

  const { data: purchaseOrders = [], isLoading: isLoadingPos } = useQuery<PurchaseOrder[]>({
    queryKey: ["procurement-pos"],
    queryFn: () => apiClient<PurchaseOrder[]>("/v1/procurement/po"),
  });

  const { data: stats } = useQuery<ProcurementStats>({
    queryKey: ["procurement-stats"],
    queryFn: () => apiClient<ProcurementStats>("/v1/procurement/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createPrMutation = useMutation({
    mutationFn: (dto: typeof prForm) =>
      apiClient<PurchaseRequisition>("/v1/procurement/pr", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (pr) => {
      queryClient.invalidateQueries({ queryKey: ["procurement-prs"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });
      setIsCreatePrOpen(false);
      setPrForm({
        title: "",
        departmentName: "Education & Schools",
        officeLocation: "Rajshahi School Branch",
        justification: "",
        currency: "BDT",
        items: [
          { itemDescription: "", category: "Lab Equipment", quantity: 1, unit: "Sets", estimatedUnitPrice: 0 },
        ],
      });
      notify("success", `Purchase Requisition ${pr.referenceNumber} created successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const submitQuoteMutation = useMutation({
    mutationFn: ({ prId, dto }: { prId: string; dto: typeof quoteForm }) =>
      apiClient<VendorQuote>(`/v1/procurement/pr/${prId}/quotes`, {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ["procurement-prs"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });
      setQuotePrTarget(null);
      setQuoteForm({
        vendorName: "",
        quotedAmount: 0,
        deliveryLeadDays: 7,
        warrantyPeriod: "1 Year Official Warranty",
        validUntil: "2026-09-30",
        remarks: "",
      });
      notify("success", `Vendor quotation from ${quote.vendorName} added to Comparative Statement!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const issuePoMutation = useMutation({
    mutationFn: ({ prId, winningQuote }: { prId: string; winningQuote: VendorQuote }) =>
      apiClient<PurchaseOrder>(`/v1/procurement/pr/${prId}/po`, {
        method: "POST",
        body: JSON.stringify({
          vendorName: winningQuote.vendorName,
          orderTotalAmount: winningQuote.quotedAmount,
          paymentTerms: "Net 30 Days upon GRN inspection",
          deliveryLocation: csViewPr?.officeLocation || "Dhaka HQ Warehouse",
          deliveryDeadline: new Date(Date.now() + winningQuote.deliveryLeadDays * 86400000).toISOString().split("T")[0],
        }),
      }),
    onSuccess: (po) => {
      queryClient.invalidateQueries({ queryKey: ["procurement-prs"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-pos"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });
      setCsViewPr(null);
      notify("success", `🎉 Purchase Order ${po.poNumber} issued to ${po.vendorName} for BDT ${po.orderTotalAmount.toLocaleString()}!`);
    },
    onError: (err) => notify("error", err.message),
  });

  // Filtered PR list
  const filteredPrs = requisitions.filter((pr) => {
    if (activeTab === "QUOTING") return pr.status === "QUOTING";
    if (activeTab === "CS_READY") return pr.status === "CS_READY";
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement & Supply Chain"
        subtitle="Purchase requisitions (PR), multi-vendor quotation comparison (CS), and purchase orders (PO)."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Procurement Lifecycle</span>
          </div>
        }
        actions={
          <button
            onClick={() => setIsCreatePrOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Requisition</span>
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
          <span className="text-xs text-muted-foreground">Open Requisitions (PR)</span>
          <div className="text-2xl font-bold text-foreground">{stats?.openRequisitions ?? requisitions.length}</div>
          <span className="text-[11px] text-primary font-medium">In Bidding / Approval</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Comparative Statements (CS)</span>
          <div className="text-2xl font-bold text-foreground">{stats?.csInReview ?? 1}</div>
          <span className="text-[11px] text-amber-400 font-medium">Ready for Sign-Off</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Purchase Orders (PO)</span>
          <div className="text-2xl font-bold text-foreground">{stats?.issuedPOs ?? purchaseOrders.length}</div>
          <span className="text-[11px] text-emerald-400 font-medium">Issued to Vendors</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Committed Spend</span>
          <div className="text-2xl font-bold text-foreground">
            BDT {(stats?.totalCommittedSpendBDT ?? 64000).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Fiscal Year 2026</span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "ALL", label: "All Requisitions (PR)" },
          { id: "QUOTING", label: "Awaiting Quotations" },
          { id: "CS_READY", label: "Comparative Statements (CS)" },
          { id: "PO", label: "Purchase Orders (PO)" },
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

      {/* ─── TAB: PURCHASE ORDERS ───────────────────────────────────────────── */}
      {activeTab === "PO" ? (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>Issued Purchase Orders (PO)</span>
          </h3>

          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">PO Number</th>
                    <th className="p-4">Requisition Ref</th>
                    <th className="p-4">Awarded Vendor</th>
                    <th className="p-4">Order Value (BDT)</th>
                    <th className="p-4">Payment Terms</th>
                    <th className="p-4">Delivery Due</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingPos ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Loading purchase orders...
                      </td>
                    </tr>
                  ) : purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No purchase orders issued yet.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-primary">{po.poNumber}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {new Date(po.issuedAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="p-4 font-mono text-muted-foreground">{po.prReference}</td>

                        <td className="p-4 font-semibold text-foreground">{po.vendorName}</td>

                        <td className="p-4 font-mono font-bold text-foreground">
                          BDT {po.orderTotalAmount.toLocaleString()}
                        </td>

                        <td className="p-4 text-muted-foreground">{po.paymentTerms}</td>

                        <td className="p-4 text-muted-foreground">{po.deliveryDeadline}</td>

                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {po.status}
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
      ) : (
        /* ─── TAB: REQUISITIONS TABLE ────────────────────────────────────────── */
        <div className="space-y-3">
          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">PR Number & Title</th>
                    <th className="p-4">Department & Branch</th>
                    <th className="p-4">Requester</th>
                    <th className="p-4">Estimated Total</th>
                    <th className="p-4">Vendor Bids</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingPrs ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Loading requisitions...
                      </td>
                    </tr>
                  ) : filteredPrs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No purchase requisitions found in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredPrs.map((pr) => (
                      <tr key={pr.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4 space-y-0.5">
                          <span className="font-mono text-primary font-bold">{pr.referenceNumber}</span>
                          <div className="font-semibold text-foreground">{pr.title}</div>
                          <span className="text-[10px] text-muted-foreground">{pr.items.length} item line(s)</span>
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div className="flex items-center gap-1 text-foreground">
                            <Building className="w-3 h-3 text-muted-foreground" />
                            <span>{pr.departmentName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>{pr.officeLocation}</span>
                          </div>
                        </td>

                        <td className="p-4 text-muted-foreground">{pr.requesterName}</td>

                        <td className="p-4 font-mono font-bold text-foreground">
                          {pr.currency} {pr.estimatedTotalAmount.toLocaleString()}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-secondary text-foreground font-semibold">
                              {pr.quotes.length} Quotes
                            </span>
                            {pr.quotes.length > 0 && (
                              <span className="text-[10px] text-emerald-400 font-mono">
                                Min: BDT {Math.min(...pr.quotes.map((q) => q.quotedAmount)).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              pr.status === "PO_ISSUED"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : pr.status === "CS_READY"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-primary/15 text-primary border-primary/30"
                            }`}
                          >
                            {pr.status === "CS_READY" ? "CS Ready for Review" : pr.status}
                          </span>
                        </td>

                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setQuotePrTarget(pr)}
                            className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border/40 transition-colors"
                          >
                            + Quote
                          </button>

                          {pr.quotes.length >= 2 && (
                            <button
                              onClick={() => setCsViewPr(pr)}
                              className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover shadow-sm transition-all"
                            >
                              View CS Matrix
                            </button>
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

      {/* ─── MODAL: COMPARATIVE STATEMENT (CS MATRIX) ───────────────────────── */}
      {csViewPr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-3xl w-full p-6 rounded-2xl border space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <span>Comparative Statement (CS Evaluation Matrix)</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Requisition Ref: <strong className="font-mono text-foreground">{csViewPr.referenceNumber}</strong> • {csViewPr.title}
                </p>
              </div>
              <button onClick={() => setCsViewPr(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estimated Requisition Budget:</span>
              <span className="font-mono font-bold text-foreground">
                BDT {csViewPr.estimatedTotalAmount.toLocaleString()}
              </span>
            </div>

            {/* Vendor Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {csViewPr.quotes.map((quote) => {
                const savings = csViewPr.estimatedTotalAmount - quote.quotedAmount;
                return (
                  <div
                    key={quote.id}
                    className={`p-4 rounded-2xl border space-y-3 relative ${
                      quote.isLowestBidder
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : "bg-secondary/30 border-border/40"
                    }`}
                  >
                    {quote.isLowestBidder && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>Lowest Bidder</span>
                      </span>
                    )}

                    <div className="space-y-0.5">
                      <div className="font-bold text-foreground text-sm">{quote.vendorName}</div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Valid Until {quote.validUntil}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quoted Price:</span>
                        <span className="font-mono font-bold text-base text-foreground">
                          BDT {quote.quotedAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Lead Time:</span>
                        <span>{quote.deliveryLeadDays} business days</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Warranty:</span>
                        <span>{quote.warrantyPeriod}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between text-emerald-400 font-medium">
                          <span>Budget Savings:</span>
                          <span>+BDT {savings.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {quote.remarks && (
                      <p className="text-[11px] text-muted-foreground italic border-t border-border/30 pt-2">
                        &quot;{quote.remarks}&quot;
                      </p>
                    )}

                    <div className="pt-2 border-t border-border/30">
                      <button
                        onClick={() =>
                          issuePoMutation.mutate({
                            prId: csViewPr.id,
                            winningQuote: quote,
                          })
                        }
                        disabled={issuePoMutation.isPending || csViewPr.status === "PO_ISSUED"}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                          quote.isLowestBidder
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                            : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/40"
                        } disabled:opacity-60`}
                      >
                        {csViewPr.status === "PO_ISSUED"
                          ? "PO Already Issued"
                          : issuePoMutation.isPending
                          ? "Issuing PO..."
                          : `Award & Issue PO (BDT ${quote.quotedAmount.toLocaleString()})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: NEW PURCHASE REQUISITION ────────────────────────────────── */}
      {isCreatePrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-2xl w-full p-6 rounded-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Create Purchase Requisition (PR)</span>
              </h3>
              <button onClick={() => setIsCreatePrOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPrMutation.mutate(prForm);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Requisition Title</label>
                <input
                  type="text"
                  required
                  value={prForm.title}
                  onChange={(e) => setPrForm({ ...prForm, title: e.target.value })}
                  placeholder="e.g. Science Lab Supplies & Optical Microscopes"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <select
                    value={prForm.departmentName}
                    onChange={(e) => setPrForm({ ...prForm, departmentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Education & Schools">Education & Schools</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Procurement & Supply Chain">Procurement & Supply Chain</option>
                    <option value="Field Operations">Field Operations</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Destination Branch</label>
                  <select
                    value={prForm.officeLocation}
                    onChange={(e) => setPrForm({ ...prForm, officeLocation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Dhaka HQ (Banani)">Dhaka HQ (Banani)</option>
                    <option value="Rajshahi School Branch">Rajshahi School Branch</option>
                    <option value="Chittagong School Branch">Chittagong School Branch</option>
                    <option value="Bandarban School Branch">Bandarban School Branch</option>
                    <option value="Habiganj School Branch">Habiganj School Branch</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Purpose & Justification</label>
                <textarea
                  rows={2}
                  required
                  value={prForm.justification}
                  onChange={(e) => setPrForm({ ...prForm, justification: e.target.value })}
                  placeholder="Explain why these items are required and project budget allocation."
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Dynamic Line Items */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Requisition Line Items</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPrForm({
                        ...prForm,
                        items: [
                          ...prForm.items,
                          { itemDescription: "", category: "Lab Equipment", quantity: 1, unit: "Sets", estimatedUnitPrice: 0 },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {prForm.items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-secondary/30 border border-border/30 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Item Description"
                          value={item.itemDescription}
                          onChange={(e) => {
                            const newItems = [...prForm.items];
                            newItems[idx]!.itemDescription = e.target.value;
                            setPrForm({ ...prForm, items: newItems });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...prForm.items];
                            newItems[idx]!.quantity = parseInt(e.target.value, 10) || 1;
                            setPrForm({ ...prForm, items: newItems });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => {
                            const newItems = [...prForm.items];
                            newItems[idx]!.unit = e.target.value;
                            setPrForm({ ...prForm, items: newItems });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Est. Rate"
                          value={item.estimatedUnitPrice}
                          onChange={(e) => {
                            const newItems = [...prForm.items];
                            newItems[idx]!.estimatedUnitPrice = parseFloat(e.target.value) || 0;
                            setPrForm({ ...prForm, items: newItems });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground font-mono"
                        />
                      </div>

                      <div className="col-span-1 flex justify-end">
                        {prForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = prForm.items.filter((_, i) => i !== idx);
                              setPrForm({ ...prForm, items: newItems });
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatePrOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPrMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createPrMutation.isPending ? "Submitting..." : "Submit Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: SUBMIT VENDOR QUOTE ─────────────────────────────────────── */}
      {quotePrTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Submit Vendor Quotation</span>
              </h3>
              <button onClick={() => setQuotePrTarget(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs">
              <div className="font-mono text-primary font-bold">{quotePrTarget.referenceNumber}</div>
              <div className="font-semibold text-foreground">{quotePrTarget.title}</div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitQuoteMutation.mutate({
                  prId: quotePrTarget.id,
                  dto: quoteForm,
                });
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Vendor / Supplier Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangladesh Scientific Lab Co."
                  value={quoteForm.vendorName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, vendorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Total Quoted Amount (BDT)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quoteForm.quotedAmount}
                    onChange={(e) => setQuoteForm({ ...quoteForm, quotedAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Delivery Lead (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quoteForm.deliveryLeadDays}
                    onChange={(e) => setQuoteForm({ ...quoteForm, deliveryLeadDays: parseInt(e.target.value, 10) || 7 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Warranty Period</label>
                <input
                  type="text"
                  required
                  value={quoteForm.warrantyPeriod}
                  onChange={(e) => setQuoteForm({ ...quoteForm, warrantyPeriod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuotePrTarget(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitQuoteMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitQuoteMutation.isPending ? "Submitting..." : "Add to CS Matrix"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
