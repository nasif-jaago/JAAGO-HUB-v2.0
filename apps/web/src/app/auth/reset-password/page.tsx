"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { useAuthStore } from "@/store/auth-store";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatusMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      setStatusMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setStatusMessage({ type: "error", text: error.message });
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setAuth(
          {
            id: data.user.id,
            email: data.user.email || "user@jaago.com.bd",
            displayName:
              data.user.user_metadata?.full_name ||
              data.user.email ||
              "JAAGO Member",
            orgId: "00000000-0000-0000-0000-000000000000",
            roles: ["SUPER_ADMIN"],
            permissions: ["*"],
            mfaEnabled: false,
          }
        );
      }

      setStatusMessage({
        type: "success",
        text: "Your password has been updated successfully! Redirecting...",
      });
      setTimeout(() => router.push("/"), 2000);
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update password.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1E8] dark:bg-[#0F1117] text-[#292524] dark:text-[#F3F4F6] flex flex-col justify-between p-4 sm:p-8">
      {/* Logo */}
      <div className="w-fit">
        <Link
          href="/"
          className="inline-flex items-center justify-center p-1.5 rounded-2xl bg-[#FFC72C] border-2 border-[#FFE500] shadow-[0_0_15px_rgba(255,229,0,0.7),0_0_30px_rgba(245,158,11,0.4)]"
        >
          <img
            src="/jaago-logo.png"
            alt="JAAGO Foundation"
            className="w-24 sm:w-28 h-auto object-contain rounded-xl"
          />
        </Link>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181B22] border border-black/5 dark:border-white/10 shadow-2xl p-6 sm:p-10 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Create New Password
            </h1>
            <p className="text-xs text-muted-foreground">
              Enter your new secure password for your JAAGO HUB account.
            </p>
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/15 border border-destructive/30 text-destructive"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            {/* New Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New Password (min 6 characters)"
                className="w-full pl-11 pr-11 py-3 rounded-2xl bg-[#EDF3FA] dark:bg-[#232834] border border-transparent focus:border-amber-400 text-sm font-medium text-foreground focus:outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full pl-11 pr-11 py-3 rounded-2xl bg-[#EDF3FA] dark:bg-[#232834] border border-transparent focus:border-amber-400 text-sm font-medium text-foreground focus:outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {isLoading ? "Updating..." : "SET NEW PASSWORD"}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-[10px] text-muted-foreground/60 tracking-wider">
        © 2026 <span className="font-bold text-amber-500">JAAGO</span> HUB ECOSYSTEM
      </footer>
    </div>
  );
}
