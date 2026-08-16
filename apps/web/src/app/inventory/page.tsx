"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  PackagePlus,
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  X,
  FileCheck,
  Send,
  Trash2,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface StockItem {
  id: string;
  sku: string;
  itemName: string;
  category: string;
  warehouseLocation: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  unit: string;
  unitCostBDT: number;
  totalValuationBDT: number;
  reorderThreshold: number;
  isLowStock: boolean;
  lastUpdated: string;
}

interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  poNumber: string;
  vendorName: string;
  warehouseLocation: string;
  receivedBy: string;
  receivedDate: string;
  status: string;
  inspectionRemarks?: string;
  items: Array<{
    itemId: string;
    itemName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    unit: string;
    unitPrice: number;
  }>;
}

interface StockDispatch {
  id: string;
  dispatchNumber: string;
  destinationBranch: string;
  requesterName: string;
  dispatchedBy: string;
  dispatchDate: string;
  carrierOrDriver: string;
  trackingOrVehicleNo: string;
  status: string;
  totalItemsCount: number;
  items: Array<{
    sku: string;
    itemName: string;
    quantity: number;
    unit: string;
  }>;
}

interface InventoryStats {
  totalSkus: number;
  totalValuationBDT: number;
  lowStockAlerts: number;
  activeDispatches: number;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"STOCK" | "GRN" | "DISPATCH">("STOCK");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isReceiveGrnOpen, setIsReceiveGrnOpen] = useState(false);
  const [isCreateDispatchOpen, setIsCreateDispatchOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // GRN Form State
  const [grnForm, setGrnForm] = useState({
    poNumber: "PO-2026-08-0012",
    vendorName: "Dhaka Scientific Instruments Ltd.",
    warehouseLocation: "Central Warehouse Dhaka (Bin A-12)",
    inspectionRemarks: "Inspected and accepted in good order.",
    items: [
      {
        itemName: "Elementary Optical Microscope Kits",
        orderedQuantity: 15,
        receivedQuantity: 15,
        acceptedQuantity: 15,
        rejectedQuantity: 0,
        unit: "Sets",
        unitPrice: 6000,
      },
    ],
  });

  // Dispatch Form State
  const [dispatchForm, setDispatchForm] = useState({
    destinationBranch: "Rajshahi School Branch",
    carrierOrDriver: "Sundarban Courier Service",
    trackingOrVehicleNo: "SC-DHK-RAJ-1002",
    items: [{ sku: "SKU-LAB-001", quantity: 5 }],
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: stockItems = [], isLoading: isLoadingStock } = useQuery<StockItem[]>({
    queryKey: ["inventory-stock", searchTerm, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      return apiClient<StockItem[]>(`/v1/inventory/stock?${params.toString()}`);
    },
  });

  const { data: grnRecords = [], isLoading: isLoadingGrn } = useQuery<GoodsReceiptNote[]>({
    queryKey: ["inventory-grn"],
    queryFn: () => apiClient<GoodsReceiptNote[]>("/v1/inventory/grn"),
  });

  const { data: dispatches = [], isLoading: isLoadingDispatches } = useQuery<StockDispatch[]>({
    queryKey: ["inventory-dispatches"],
    queryFn: () => apiClient<StockDispatch[]>("/v1/inventory/dispatches"),
  });

  const { data: stats } = useQuery<InventoryStats>({
    queryKey: ["inventory-stats"],
    queryFn: () => apiClient<InventoryStats>("/v1/inventory/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createGrnMutation = useMutation({
    mutationFn: (dto: typeof grnForm) =>
      apiClient<GoodsReceiptNote>("/v1/inventory/grn", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (grn) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-grn"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      setIsReceiveGrnOpen(false);
      notify("success", `Goods Receipt Note ${grn.grnNumber} processed and inventory updated!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const createDispatchMutation = useMutation({
    mutationFn: (dto: typeof dispatchForm) =>
      apiClient<StockDispatch>("/v1/inventory/dispatches", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (dsp) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      setIsCreateDispatchOpen(false);
      notify("success", `Stock Dispatch Note ${dsp.dispatchNumber} issued to ${dsp.destinationBranch}!`);
    },
    onError: (err) => notify("error", err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Warehouse Operations"
        subtitle="Goods Receipt Notes (GRN), central stock ledger with average costing, and school branch dispatches."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <Boxes className="w-3.5 h-3.5" />
            <span>Warehousing & Logistics</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateDispatchOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-secondary/80 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch to Branch</span>
            </button>
            <button
              onClick={() => setIsReceiveGrnOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Receive Goods (GRN)</span>
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
          <span className="text-xs text-muted-foreground">Total Stock SKUs</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalSkus ?? stockItems.length}</div>
          <span className="text-[11px] text-primary font-medium">Catalogued Items</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Total Stock Valuation</span>
          <div className="text-2xl font-bold text-foreground">
            BDT {(stats?.totalValuationBDT ?? 377500).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Weighted Average Cost</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Low-Stock Alerts</span>
          <div className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span>{stats?.lowStockAlerts ?? 1}</span>
            {(stats?.lowStockAlerts ?? 1) > 0 && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          </div>
          <span className="text-[11px] text-amber-400 font-medium">Below Reorder Level</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Active Dispatches</span>
          <div className="text-2xl font-bold text-foreground">{stats?.activeDispatches ?? 1}</div>
          <span className="text-[11px] text-muted-foreground">In Transit to Schools</span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "STOCK", label: "Warehouse Stock Ledger" },
          { id: "GRN", label: "Goods Receipt Notes (GRN)" },
          { id: "DISPATCH", label: "Branch Stock Dispatches" },
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

      {/* ─── TAB 1: STOCK LEDGER ────────────────────────────────────────────── */}
      {activeTab === "STOCK" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search SKU, Item Name, or Bin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "LAB_EQUIPMENT", "LEARNING_KITS", "IT_HARDWARE", "BOOKS_STATIONERY"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {cat.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">SKU & Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Warehouse Bin</th>
                    <th className="p-4">On Hand</th>
                    <th className="p-4">Available</th>
                    <th className="p-4">Avg Unit Cost</th>
                    <th className="p-4">Total Valuation</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingStock ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Loading inventory items...
                      </td>
                    </tr>
                  ) : stockItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No inventory stock items found.
                      </td>
                    </tr>
                  ) : (
                    stockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-[10px] text-primary font-semibold block">{item.sku}</span>
                          <span className="font-bold text-foreground text-sm">{item.itemName}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-4 text-muted-foreground">{item.warehouseLocation}</td>

                        <td className="p-4 font-mono font-bold text-foreground">
                          {item.quantityOnHand} {item.unit}
                        </td>

                        <td className="p-4 font-mono text-emerald-400 font-semibold">
                          {item.availableQuantity} {item.unit}
                        </td>

                        <td className="p-4 font-mono text-muted-foreground">
                          BDT {item.unitCostBDT.toLocaleString()}
                        </td>

                        <td className="p-4 font-mono font-bold text-foreground">
                          BDT {item.totalValuationBDT.toLocaleString()}
                        </td>

                        <td className="p-4">
                          {item.isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Adequate</span>
                            </span>
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

      {/* ─── TAB 2: GOODS RECEIPT NOTES (GRN) ───────────────────────────────── */}
      {activeTab === "GRN" && (
        <div className="space-y-3">
          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">GRN Number</th>
                    <th className="p-4">PO Reference</th>
                    <th className="p-4">Supplier / Vendor</th>
                    <th className="p-4">Warehouse Location</th>
                    <th className="p-4">Items Received</th>
                    <th className="p-4">Received Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingGrn ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Loading GRN records...
                      </td>
                    </tr>
                  ) : grnRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No goods receipt notes recorded.
                      </td>
                    </tr>
                  ) : (
                    grnRecords.map((grn) => (
                      <tr key={grn.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-primary">{grn.grnNumber}</span>
                          <span className="text-[10px] text-muted-foreground block">{grn.receivedBy}</span>
                        </td>

                        <td className="p-4 font-mono font-semibold text-foreground">{grn.poNumber}</td>

                        <td className="p-4 text-foreground font-medium">{grn.vendorName}</td>

                        <td className="p-4 text-muted-foreground">{grn.warehouseLocation}</td>

                        <td className="p-4">
                          <span className="font-semibold text-foreground">
                            {grn.items.reduce((sum, i) => sum + i.acceptedQuantity, 0)} Units
                          </span>
                          <span className="text-[10px] text-muted-foreground block">{grn.items.length} Line Item(s)</span>
                        </td>

                        <td className="p-4 text-muted-foreground">{grn.receivedDate}</td>

                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {grn.status}
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

      {/* ─── TAB 3: DISPATCHES & TRANSFERS ──────────────────────────────────── */}
      {activeTab === "DISPATCH" && (
        <div className="space-y-3">
          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">Dispatch Number</th>
                    <th className="p-4">Destination Branch</th>
                    <th className="p-4">Items Transferred</th>
                    <th className="p-4">Carrier & Tracking</th>
                    <th className="p-4">Dispatch Date</th>
                    <th className="p-4">Transit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingDispatches ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading branch dispatches...
                      </td>
                    </tr>
                  ) : dispatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No active branch dispatches.
                      </td>
                    </tr>
                  ) : (
                    dispatches.map((dsp) => (
                      <tr key={dsp.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-primary">{dsp.dispatchNumber}</span>
                          <span className="text-[10px] text-muted-foreground block">By {dsp.dispatchedBy}</span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1 font-semibold text-foreground">
                            <MapPin className="w-3 h-3 text-primary shrink-0" />
                            <span>{dsp.destinationBranch}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-foreground">{dsp.totalItemsCount} Total Items</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {dsp.items.map((i) => `${i.itemName} (${i.quantity})`).join(", ")}
                          </span>
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div className="text-foreground font-medium">{dsp.carrierOrDriver}</div>
                          <span className="text-[10px] text-muted-foreground font-mono">{dsp.trackingOrVehicleNo}</span>
                        </td>

                        <td className="p-4 text-muted-foreground">{dsp.dispatchDate}</td>

                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {dsp.status}
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

      {/* ─── MODAL: RECEIVE GOODS (GRN) ─────────────────────────────────────── */}
      {isReceiveGrnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-2xl w-full p-6 rounded-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                <span>Receive Goods & Issue GRN</span>
              </h3>
              <button onClick={() => setIsReceiveGrnOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createGrnMutation.mutate(grnForm);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">PO Reference Number</label>
                  <input
                    type="text"
                    required
                    value={grnForm.poNumber}
                    onChange={(e) => setGrnForm({ ...grnForm, poNumber: e.target.value })}
                    placeholder="PO-2026-08-0012"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Supplier / Vendor Name</label>
                  <input
                    type="text"
                    required
                    value={grnForm.vendorName}
                    onChange={(e) => setGrnForm({ ...grnForm, vendorName: e.target.value })}
                    placeholder="Dhaka Scientific Instruments Ltd."
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Warehouse & Storage Bin</label>
                <input
                  type="text"
                  required
                  value={grnForm.warehouseLocation}
                  onChange={(e) => setGrnForm({ ...grnForm, warehouseLocation: e.target.value })}
                  placeholder="Central Warehouse Dhaka (Bin A-12)"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* GRN Item Entries */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <label className="text-xs font-bold text-foreground">Delivery Inspection & Quantity Check</label>
                {grnForm.items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-secondary/30 border border-border/30 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        required
                        placeholder="Item Name"
                        value={item.itemName}
                        onChange={(e) => {
                          const newItems = [...grnForm.items];
                          newItems[idx]!.itemName = e.target.value;
                          setGrnForm({ ...grnForm, items: newItems });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Ordered"
                        value={item.orderedQuantity}
                        onChange={(e) => {
                          const newItems = [...grnForm.items];
                          newItems[idx]!.orderedQuantity = parseInt(e.target.value, 10) || 1;
                          setGrnForm({ ...grnForm, items: newItems });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Accepted"
                        value={item.acceptedQuantity}
                        onChange={(e) => {
                          const newItems = [...grnForm.items];
                          const qty = parseInt(e.target.value, 10) || 0;
                          newItems[idx]!.acceptedQuantity = qty;
                          newItems[idx]!.receivedQuantity = qty;
                          setGrnForm({ ...grnForm, items: newItems });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...grnForm.items];
                          newItems[idx]!.unitPrice = parseFloat(e.target.value) || 0;
                          setGrnForm({ ...grnForm, items: newItems });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Unit"
                        value={item.unit}
                        onChange={(e) => {
                          const newItems = [...grnForm.items];
                          newItems[idx]!.unit = e.target.value;
                          setGrnForm({ ...grnForm, items: newItems });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Quality Inspection Remarks</label>
                <textarea
                  rows={2}
                  value={grnForm.inspectionRemarks}
                  onChange={(e) => setGrnForm({ ...grnForm, inspectionRemarks: e.target.value })}
                  placeholder="Notes on packaging, product seals, and physical verification."
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReceiveGrnOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGrnMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createGrnMutation.isPending ? "Generating GRN..." : "Confirm & Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DISPATCH TO BRANCH ──────────────────────────────────────── */}
      {isCreateDispatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <span>Create School Branch Stock Dispatch</span>
              </h3>
              <button onClick={() => setIsCreateDispatchOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDispatchMutation.mutate(dispatchForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Destination School Branch</label>
                <select
                  value={dispatchForm.destinationBranch}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, destinationBranch: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Rajshahi School Branch">Rajshahi School Branch</option>
                  <option value="Bandarban School Branch">Bandarban School Branch</option>
                  <option value="Habiganj School Branch">Habiganj School Branch</option>
                  <option value="Chittagong School Branch">Chittagong School Branch</option>
                  <option value="Gazipur School Branch">Gazipur School Branch</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Carrier / Courier / Driver</label>
                  <input
                    type="text"
                    required
                    value={dispatchForm.carrierOrDriver}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, carrierOrDriver: e.target.value })}
                    placeholder="Sundarban Courier"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Tracking / Vehicle No.</label>
                  <input
                    type="text"
                    required
                    value={dispatchForm.trackingOrVehicleNo}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, trackingOrVehicleNo: e.target.value })}
                    placeholder="SC-DHK-RAJ-1002"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              {/* Dispatch Items */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Items to Transfer</label>
                  <button
                    type="button"
                    onClick={() =>
                      setDispatchForm({
                        ...dispatchForm,
                        items: [...dispatchForm.items, { sku: stockItems[0]?.sku || "SKU-LAB-001", quantity: 1 }],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {dispatchForm.items.map((item, idx) => {
                  const stock = stockItems.find((s) => s.sku === item.sku);
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-secondary/30 border border-border/30 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <select
                          value={item.sku}
                          onChange={(e) => {
                            const newItems = [...dispatchForm.items];
                            newItems[idx]!.sku = e.target.value;
                            setDispatchForm({ ...dispatchForm, items: newItems });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground"
                        >
                          {stockItems.map((s) => (
                            <option key={s.sku} value={s.sku}>
                              {s.itemName} (Avail: {s.availableQuantity} {s.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="number"
                          min="1"
                          max={stock?.availableQuantity || 100}
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...dispatchForm.items];
                            newItems[idx]!.quantity = parseInt(e.target.value, 10) || 1;
                            setDispatchForm({ ...dispatchForm, items: newItems });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/40 text-xs text-foreground font-mono"
                        />
                      </div>

                      <div className="col-span-1 flex justify-end">
                        {dispatchForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = dispatchForm.items.filter((_, i) => i !== idx);
                              setDispatchForm({ ...dispatchForm, items: newItems });
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateDispatchOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDispatchMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{createDispatchMutation.isPending ? "Dispatching..." : "Issue Dispatch Note"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
