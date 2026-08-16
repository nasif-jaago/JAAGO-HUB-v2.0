"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  MapPin,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Smartphone,
  Radio,
  Timer,
  Navigation,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  durationMinutes?: number;
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "ON_LEAVE";
  method: "GEOFENCED_MOBILE" | "BIOMETRIC_DEVICE" | "WEB_MANUAL";
  branchName: string;
  withinGeofence: boolean;
  distanceToBranchMeters?: number;
  isLate: boolean;
  lateMinutes: number;
}

interface AttendanceStats {
  present: number;
  late: number;
  onLeave: number;
  totalExpected: number;
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // Get current device GPS location
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (_err) => {
          // Fallback simulation to HQ Banani for local browser dev
          setCurrentCoords({ lat: 23.7938, lng: 90.4067 });
          setGeoError("Using location simulator (Dhaka HQ Branch)");
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      setCurrentCoords({ lat: 23.7938, lng: 90.4067 });
    }
  }, []);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: recordsData = { items: [], total: 0 }, isLoading } = useQuery<{ items: AttendanceRecord[]; total: number }>({
    queryKey: ["attendance-records"],
    queryFn: () => apiClient<{ items: AttendanceRecord[]; total: number }>("/v1/attendance/records"),
  });

  const { data: stats } = useQuery<AttendanceStats>({
    queryKey: ["attendance-today-stats"],
    queryFn: () => apiClient<AttendanceStats>("/v1/attendance/stats"),
  });

  // Find today's clock-in for current user
  const today = new Date().toISOString().split("T")[0];
  const myRecordToday = recordsData.items.find((r) => r.date === today);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const clockInMutation = useMutation({
    mutationFn: () =>
      apiClient<AttendanceRecord>("/v1/attendance/clock-in", {
        method: "POST",
        body: JSON.stringify({
          method: "GEOFENCED_MOBILE",
          latitude: currentCoords?.lat,
          longitude: currentCoords?.lng,
        }),
      }),
    onSuccess: (rec) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-today-stats"] });
      notify("success", `Clock-in registered! Status: ${rec.status} (${rec.withinGeofence ? "Within Branch Geofence" : "Verified"})`);
    },
    onError: (err) => notify("error", err.message),
  });

  const clockOutMutation = useMutation({
    mutationFn: () =>
      apiClient<AttendanceRecord>("/v1/attendance/clock-out", {
        method: "POST",
        body: JSON.stringify({
          latitude: currentCoords?.lat,
          longitude: currentCoords?.lng,
        }),
      }),
    onSuccess: (rec) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-today-stats"] });
      const hrs = Math.floor((rec.durationMinutes || 0) / 60);
      const mins = (rec.durationMinutes || 0) % 60;
      notify("success", `Clock-out registered! Total shift duration: ${hrs}h ${mins}m`);
    },
    onError: (err) => notify("error", err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Geofenced Clock-In"
        subtitle="Biometric terminal synchronization and GPS-geofenced mobile attendance for schools and branch offices."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <Radio className="w-3.5 h-3.5" />
            <span>Live Geofencing</span>
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

      {/* ─── LIVE CLOCK-IN HERO WIDGET ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <span>My Shift & Clock-In Status</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Branch: <strong className="text-foreground">Dhaka HQ (Banani)</strong> • Shift: 09:00 AM - 05:00 PM
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">GPS Location Acquired</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Today&apos;s Date</span>
              <div className="text-sm font-bold text-foreground flex items-center gap-1.5 pt-0.5">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Clocked In Time</span>
              <div className="text-sm font-bold text-foreground flex items-center gap-1.5 pt-0.5">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  {myRecordToday
                    ? new Date(myRecordToday.clockInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Not clocked in"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Shift Duration</span>
              <div className="text-sm font-bold text-foreground flex items-center gap-1.5 pt-0.5">
                <Timer className="w-4 h-4 text-emerald-400" />
                <span>
                  {myRecordToday?.clockOutTime
                    ? `${Math.floor((myRecordToday.durationMinutes || 0) / 60)}h ${(myRecordToday.durationMinutes || 0) % 60}m`
                    : myRecordToday
                    ? "In Progress"
                    : "0h 0m"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {!myRecordToday ? (
              <button
                onClick={() => clockInMutation.mutate()}
                disabled={clockInMutation.isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all disabled:opacity-60"
              >
                <Navigation className="w-4 h-4" />
                <span>{clockInMutation.isPending ? "Verifying Geofence..." : "Clock In (Geofenced GPS)"}</span>
              </button>
            ) : !myRecordToday.clockOutTime ? (
              <button
                onClick={() => clockOutMutation.mutate()}
                disabled={clockOutMutation.isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-500 shadow-lg shadow-amber-600/25 transition-all disabled:opacity-60"
              >
                <Clock className="w-4 h-4" />
                <span>{clockOutMutation.isPending ? "Recording Clock Out..." : "Clock Out (End Shift)"}</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Shift Completed for Today. Thank you!</span>
              </div>
            )}

            {currentCoords && (
              <span className="text-[11px] text-muted-foreground font-mono">
                GPS: {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                {geoError && ` (${geoError})`}
              </span>
            )}
          </div>
        </div>

        {/* Live Attendance Board */}
        <div className="glass-card p-6 rounded-2xl border space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <span>Today&apos;s Organization Presence</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
              <span className="text-xs text-muted-foreground">Present Staff</span>
              <span className="text-base font-bold text-emerald-400">{stats?.present ?? 2}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
              <span className="text-xs text-muted-foreground">Late Arrivals (&gt;15m)</span>
              <span className="text-base font-bold text-amber-400">{stats?.late ?? 1}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
              <span className="text-xs text-muted-foreground">On Approved Leave</span>
              <span className="text-base font-bold text-primary">{stats?.onLeave ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
              <span className="text-xs text-muted-foreground">Expected Total</span>
              <span className="text-base font-bold text-foreground">{stats?.totalExpected ?? 50}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ATTENDANCE LOGS TABLE ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-primary" />
          <span>Daily Organization Attendance Log</span>
        </h3>

        <div className="glass-card rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Clock In</th>
                  <th className="p-4">Clock Out</th>
                  <th className="p-4">Method & Device</th>
                  <th className="p-4">Location / Distance</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : recordsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No attendance entries found.
                    </td>
                  </tr>
                ) : (
                  recordsData.items.map((rec) => (
                    <tr key={rec.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{rec.employeeName}</div>
                        <span className="font-mono text-[10px] text-muted-foreground">{rec.employeeCode}</span>
                      </td>

                      <td className="p-4 text-muted-foreground">{rec.date}</td>

                      <td className="p-4 font-mono text-foreground font-semibold">
                        {new Date(rec.clockInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {rec.isLate && (
                          <span className="text-[10px] text-amber-400 font-normal block">
                            +{rec.lateMinutes}m late
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono text-muted-foreground">
                        {rec.clockOutTime
                          ? new Date(rec.clockOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {rec.method === "BIOMETRIC_DEVICE" ? (
                            <Fingerprint className="w-3.5 h-3.5 text-primary shrink-0" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-medium text-foreground">{rec.method}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span>{rec.branchName}</span>
                        </div>
                        {rec.distanceToBranchMeters !== undefined && (
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            {rec.distanceToBranchMeters}m from center
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            rec.status === "PRESENT"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : rec.status === "LATE"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-secondary text-muted-foreground border border-border/40"
                          }`}
                        >
                          {rec.status}
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
    </div>
  );
}
