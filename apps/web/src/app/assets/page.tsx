"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Layers,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Car,
  Fuel,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface FixedAsset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  branchCode: string;
  branchName: string;
  custodianName: string;
  acquisitionDate: string;
  purchaseCostBDT: number;
  salvageValueBDT: number;
  usefulLifeYears: number;
  accumulatedDepreciationBDT: number;
  netBookValueBDT: number;
  status: string;
}

interface Vehicle {
  id: string;
  regNumber: string;
  model: string;
  vehicleType: string;
  branchName: string;
  assignedDriver: string;
  odometerKM: number;
  fitnessExpiryDate: string;
  taxTokenExpiryDate: string;
  status: string;
}

interface VehicleTripLog {
  id: string;
  vehicleId: string;
  regNumber: string;
  tripDate: string;
  routeFromTo: string;
  driverName: string;
  startKM: number;
  endKM: number;
  distanceKM: number;
  fuelLitres: number;
  fuelCostBDT: number;
  purpose: string;
}

interface AssetStats {
  totalAssetsCount: number;
  totalAcquisitionValueBDT: number;
  totalNetBookValueBDT: number;
  totalFleetVehicles: number;
  vehiclesInService: number;
}

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ASSETS" | "DEPRECIATION" | "FLEET">("ASSETS");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Asset Form State
  const [assetForm, setAssetForm] = useState({
    name: "",
    category: "IT_EQUIPMENT" as FixedAsset["category"],
    branchCode: "DHK",
    branchName: "Dhaka Head Office",
    custodianName: "",
    purchaseCostBDT: 100000,
    salvageValueBDT: 10000,
    usefulLifeYears: 5,
  });

  // Trip Log Form State
  const [tripForm, setTripForm] = useState({
    vehicleId: "",
    routeFromTo: "",
    startKM: 0,
    endKM: 0,
    fuelLitres: 15,
    fuelCostBDT: 2025,
    purpose: "",
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: assets = [], isLoading: isLoadingAssets } = useQuery<FixedAsset[]>({
    queryKey: ["fixed-assets", categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      return apiClient<FixedAsset[]>(`/v1/assets?${params.toString()}`);
    },
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["fleet-vehicles"],
    queryFn: () => apiClient<Vehicle[]>("/v1/assets/vehicles"),
  });

  const { data: tripLogs = [] } = useQuery<VehicleTripLog[]>({
    queryKey: ["fleet-trips"],
    queryFn: () => apiClient<VehicleTripLog[]>("/v1/assets/trips"),
  });

  const { data: stats } = useQuery<AssetStats>({
    queryKey: ["assets-stats"],
    queryFn: () => apiClient<AssetStats>("/v1/assets/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createAssetMutation = useMutation({
    mutationFn: (dto: typeof assetForm) =>
      apiClient<FixedAsset>("/v1/assets", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (ast) => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      setIsNewAssetOpen(false);
      setAssetForm({
        name: "",
        category: "IT_EQUIPMENT",
        branchCode: "DHK",
        branchName: "Dhaka Head Office",
        custodianName: "",
        purchaseCostBDT: 100000,
        salvageValueBDT: 10000,
        usefulLifeYears: 5,
      });
      notify("success", `Asset ${ast.assetTag} (${ast.name}) registered successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const createTripMutation = useMutation({
    mutationFn: (dto: typeof tripForm) =>
      apiClient<VehicleTripLog>("/v1/assets/trips", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["fleet-trips"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
      setIsNewTripOpen(false);
      setTripForm({
        vehicleId: "",
        routeFromTo: "",
        startKM: 0,
        endKM: 0,
        fuelLitres: 15,
        fuelCostBDT: 2025,
        purpose: "",
      });
      notify("success", `Trip log recorded! Distance: ${trip.distanceKM} km for ${trip.regNumber}`);
    },
    onError: (err) => notify("error", err.message),
  });

  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.custodianName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixed Assets & Fleet Logistics"
        subtitle="Asset tagging, straight-line depreciation schedules, and vehicle fleet trip & fuel logs."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Enterprise Asset Management</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (vehicles.length > 0) {
                  setTripForm((prev) => ({
                    ...prev,
                    vehicleId: vehicles[0]!.id,
                    startKM: vehicles[0]!.odometerKM,
                    endKM: vehicles[0]!.odometerKM + 50,
                  }));
                }
                setIsNewTripOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-secondary/80 transition-colors"
            >
              <Fuel className="w-4 h-4" />
              <span>Log Trip & Fuel</span>
            </button>
            <button
              onClick={() => setIsNewAssetOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Asset</span>
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
          <span className="text-xs text-muted-foreground">Acquisition Value</span>
          <div className="text-2xl font-bold text-foreground">
            BDT {(stats?.totalAcquisitionValueBDT ?? 5080000).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">Original Purchase Cost</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Net Book Value (NBV)</span>
          <div className="text-2xl font-bold text-foreground">
            BDT {(stats?.totalNetBookValueBDT ?? 3352583).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">After Depreciation</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Tagged Assets</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalAssetsCount ?? assets.length}</div>
          <span className="text-[11px] text-primary font-medium">Across School Branches</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Fleet Vehicles</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalFleetVehicles ?? vehicles.length}</div>
          <span className="text-[11px] text-emerald-400 font-medium">Active Community Transport</span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "ASSETS", label: "Fixed Asset Register" },
          { id: "DEPRECIATION", label: "Depreciation Schedules" },
          { id: "FLEET", label: "Fleet Vehicles & Trip Logs" },
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

      {/* ─── TAB 1: FIXED ASSET REGISTER ────────────────────────────────────── */}
      {activeTab === "ASSETS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Asset Tag, Name, or Custodian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "IT_EQUIPMENT", "SCHOOL_LAB_APPARATUS", "VEHICLES", "BUILDING_INFRASTRUCTURE"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {cat.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">Asset Tag & Description</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Branch & Custodian</th>
                    <th className="p-4">Acquisition Date</th>
                    <th className="p-4 text-right">Cost (BDT)</th>
                    <th className="p-4 text-right">Net Book Value</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingAssets ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Loading fixed assets...
                      </td>
                    </tr>
                  ) : filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No assets registered.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-primary block">{asset.assetTag}</span>
                          <span className="font-bold text-foreground text-sm">{asset.name}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold">
                            {asset.category.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-semibold text-foreground block">{asset.branchName}</span>
                          <span className="text-[10px] text-muted-foreground">{asset.custodianName}</span>
                        </td>

                        <td className="p-4 text-muted-foreground">{asset.acquisitionDate}</td>

                        <td className="p-4 font-mono font-semibold text-right text-muted-foreground">
                          BDT {asset.purchaseCostBDT.toLocaleString()}
                        </td>

                        <td className="p-4 font-mono font-bold text-right text-emerald-400">
                          BDT {asset.netBookValueBDT.toLocaleString()}
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {asset.status}
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

      {/* ─── TAB 2: DEPRECIATION SCHEDULES ──────────────────────────────────── */}
      {activeTab === "DEPRECIATION" && (
        <div className="glass-card rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="p-4">Asset Tag</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4 text-right">Original Cost</th>
                  <th className="p-4 text-right">Salvage Value</th>
                  <th className="p-4 text-center">Life (Years)</th>
                  <th className="p-4 text-right">Accumulated Dep.</th>
                  <th className="p-4 text-right">Net Book Value (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{asset.assetTag}</td>
                      <td className="p-4 font-medium text-foreground">{asset.name}</td>
                      <td className="p-4 font-mono text-right text-muted-foreground">
                        BDT {asset.purchaseCostBDT.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-right text-muted-foreground">
                        BDT {asset.salvageValueBDT.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-center font-bold text-foreground">{asset.usefulLifeYears}</td>
                      <td className="p-4 font-mono text-right text-amber-400 font-semibold">
                        BDT {asset.accumulatedDepreciationBDT.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-right text-emerald-400">
                        BDT {asset.netBookValueBDT.toLocaleString()}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: FLEET & TRIP LOGS ───────────────────────────────────────── */}
      {activeTab === "FLEET" && (
        <div className="space-y-6">
          {/* Vehicles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="glass-card p-5 rounded-2xl border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    <div>
                      <span className="font-bold text-foreground text-sm block">{v.regNumber}</span>
                      <span className="text-xs text-muted-foreground">{v.model}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Branch</span>
                    <span className="font-semibold text-foreground">{v.branchName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Driver</span>
                    <span className="font-semibold text-foreground">{v.assignedDriver}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Odometer</span>
                    <span className="font-mono font-bold text-primary">{v.odometerKM.toLocaleString()} KM</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Fitness Expiry: {v.fitnessExpiryDate}</span>
                  <span>Tax Token: {v.taxTokenExpiryDate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trip & Fuel Logs */}
          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="p-4 border-b border-border/40 font-bold text-xs text-foreground flex items-center gap-2">
              <Fuel className="w-4 h-4 text-primary" />
              <span>Vehicle Mileage & Fuel Consumption Logs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">Date</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Route & Purpose</th>
                    <th className="p-4">Odometer (KM)</th>
                    <th className="p-4 text-right">Distance</th>
                    <th className="p-4 text-right">Fuel Litres</th>
                    <th className="p-4 text-right">Fuel Cost (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {tripLogs.map((trip) => (
                    <tr key={trip.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 text-muted-foreground">{trip.tripDate}</td>
                      <td className="p-4 font-mono font-bold text-foreground">{trip.regNumber}</td>
                      <td className="p-4">
                        <span className="font-semibold text-foreground block">{trip.routeFromTo}</span>
                        <span className="text-[10px] text-muted-foreground">{trip.purpose}</span>
                      </td>
                      <td className="p-4 font-mono text-muted-foreground">
                        {trip.startKM.toLocaleString()} → {trip.endKM.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-right text-primary">{trip.distanceKM} KM</td>
                      <td className="p-4 font-mono text-right text-muted-foreground">{trip.fuelLitres} L</td>
                      <td className="p-4 font-mono font-bold text-right text-emerald-400">
                        BDT {trip.fuelCostBDT.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTER NEW ASSET ──────────────────────────────────────── */}
      {isNewAssetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <span>Register Fixed Asset</span>
              </h3>
              <button onClick={() => setIsNewAssetOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAssetMutation.mutate(assetForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Asset Name / Model Description</label>
                <input
                  type="text"
                  required
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="e.g. Smart Interactive Digital Board 75-inch"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Asset Category</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value as FixedAsset["category"] })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="IT_EQUIPMENT">IT Equipment</option>
                    <option value="SCHOOL_LAB_APPARATUS">School Lab Apparatus</option>
                    <option value="FURNITURE_FIXTURES">Furniture & Fixtures</option>
                    <option value="VEHICLES">Vehicles</option>
                    <option value="BUILDING_INFRASTRUCTURE">Building Infrastructure</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Branch Location</label>
                  <select
                    value={assetForm.branchCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const names: Record<string, string> = {
                        DHK: "Dhaka Head Office",
                        RAJ: "Rajshahi School",
                        BND: "Bandarban School",
                        HBG: "Habiganj School",
                        CTG: "Chittagong School",
                      };
                      setAssetForm({ ...assetForm, branchCode: code, branchName: names[code] || "Dhaka Head Office" });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="DHK">Dhaka Head Office (DHK)</option>
                    <option value="RAJ">Rajshahi School (RAJ)</option>
                    <option value="BND">Bandarban School (BND)</option>
                    <option value="HBG">Habiganj School (HBG)</option>
                    <option value="CTG">Chittagong School (CTG)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Asset Custodian / Person In-Charge</label>
                <input
                  type="text"
                  required
                  value={assetForm.custodianName}
                  onChange={(e) => setAssetForm({ ...assetForm, custodianName: e.target.value })}
                  placeholder="e.g. Salma Khatun (Branch Head)"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Cost (BDT)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={assetForm.purchaseCostBDT}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseCostBDT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Salvage Value</label>
                  <input
                    type="number"
                    min="0"
                    value={assetForm.salvageValueBDT}
                    onChange={(e) => setAssetForm({ ...assetForm, salvageValueBDT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Life (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={assetForm.usefulLifeYears}
                    onChange={(e) => setAssetForm({ ...assetForm, usefulLifeYears: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewAssetOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAssetMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createAssetMutation.isPending ? "Registering..." : "Assign Tag & Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: LOG TRIP & FUEL ──────────────────────────────────────────── */}
      {isNewTripOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Fuel className="w-5 h-5 text-primary" />
                <span>Log Vehicle Trip & Fuel</span>
              </h3>
              <button onClick={() => setIsNewTripOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTripMutation.mutate(tripForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Select Vehicle</label>
                <select
                  value={tripForm.vehicleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const veh = vehicles.find((v) => v.id === id);
                    setTripForm({
                      ...tripForm,
                      vehicleId: id,
                      startKM: veh?.odometerKM || 0,
                      endKM: (veh?.odometerKM || 0) + 50,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.regNumber} ({v.model}) - Odometer: {v.odometerKM} KM
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Route (Origin → Destination)</label>
                <input
                  type="text"
                  required
                  value={tripForm.routeFromTo}
                  onChange={(e) => setTripForm({ ...tripForm, routeFromTo: e.target.value })}
                  placeholder="e.g. Dhaka HQ -> Gazipur School -> Dhaka HQ"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Odometer (KM)</label>
                  <input
                    type="number"
                    required
                    value={tripForm.startKM}
                    onChange={(e) => setTripForm({ ...tripForm, startKM: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">End Odometer (KM)</label>
                  <input
                    type="number"
                    required
                    value={tripForm.endKM}
                    onChange={(e) => setTripForm({ ...tripForm, endKM: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Fuel Filled (Litres)</label>
                  <input
                    type="number"
                    min="0"
                    value={tripForm.fuelLitres}
                    onChange={(e) => setTripForm({ ...tripForm, fuelLitres: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Fuel Cost (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={tripForm.fuelCostBDT}
                    onChange={(e) => setTripForm({ ...tripForm, fuelCostBDT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Trip Purpose</label>
                <input
                  type="text"
                  required
                  value={tripForm.purpose}
                  onChange={(e) => setTripForm({ ...tripForm, purpose: e.target.value })}
                  placeholder="e.g. Science Lab apparatus delivery"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewTripOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTripMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createTripMutation.isPending ? "Logging..." : "Save Trip Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
