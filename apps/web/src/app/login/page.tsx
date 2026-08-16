"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

interface LoginResult {
  user: {
    id: string;
    email: string;
    displayName: string;
    orgId: string;
    roles: string[];
    permissions: string[];
    mfaEnabled: boolean;
  };
  accessToken?: string;
  requiresMfa?: boolean;
  mfaTicket?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaTicket, setMfaTicket] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mfaTicket) {
        // Step 2: Verify TOTP MFA
        const res = await apiClient<LoginResult>("/v1/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ mfaTicket, code: mfaCode }),
        });

        setAuth(res.user, res.accessToken);
        router.push("/");
      } else {
        // Step 1: Standard Credentials Login
        const res = await apiClient<LoginResult>("/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (res.requiresMfa && res.mfaTicket) {
          setMfaTicket(res.mfaTicket);
        } else {
          setAuth(res.user, res.accessToken);
          router.push("/");
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMfaTicket(null);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-jaago-red via-primary to-jaago-teal text-white font-bold text-2xl shadow-xl shadow-primary/20">
            J
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Sign in to <span className="text-primary">JAAGO HUB</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Enterprise ERP Platform for JAAGO Foundation operations
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 rounded-2xl border space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {!mfaTicket ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@jaago.com.bd"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    <a href="#" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Two-Factor Authentication Required</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit TOTP code from your Google Authenticator or 1Password app.
                </p>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/60 border border-border/40 text-sm font-mono text-center tracking-widest text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors shadow-md shadow-primary/25 disabled:opacity-60"
            >
              <span>{isLoading ? "Signing in..." : mfaTicket ? "Verify & Proceed" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-2 border-t border-border/30 space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground block text-center uppercase tracking-wider">
              Quick Fill Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@jaago.com.bd", "supersecret")}
                className="px-2.5 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary text-[11px] text-muted-foreground hover:text-foreground border border-border/30 transition-colors"
              >
                SuperAdmin HQ
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("officer@jaago.com.bd", "officerpass")}
                className="px-2.5 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary text-[11px] text-muted-foreground hover:text-foreground border border-border/30 transition-colors"
              >
                Field Officer
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Register employee account
          </Link>
        </p>
      </div>
    </div>
  );
}
