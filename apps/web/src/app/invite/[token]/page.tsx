"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Lock, ArrowRight, AlertCircle, Building2, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

interface AcceptResult {
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
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const token = typeof params["token"] === "string" ? params["token"] : "";

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient<AcceptResult>("/v1/auth/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token, displayName, password }),
      });

      setAuth(res.user, res.accessToken);
      router.push("/");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to accept invitation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-primary to-jaago-teal text-white font-bold text-2xl shadow-xl shadow-primary/20">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Accept Organization Invitation
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete your profile setup to join JAAGO Foundation ERP
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl border space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs flex items-center gap-2 text-primary font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Invitation Token Verified</span>
          </div>

          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Your Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Create Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors shadow-md shadow-primary/25 disabled:opacity-60"
            >
              <span>{isLoading ? "Setting up account..." : "Accept & Join Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
