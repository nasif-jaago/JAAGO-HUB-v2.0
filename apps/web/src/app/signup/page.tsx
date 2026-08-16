"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

interface SignupResult {
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

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient<SignupResult>("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify({ displayName, email, password }),
      });

      setAuth(res.user, res.accessToken);
      router.push("/");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-jaago-red via-primary to-jaago-teal text-white font-bold text-2xl shadow-xl shadow-primary/20">
            J
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create your account
          </h2>
          <p className="text-xs text-muted-foreground">
            Join the JAAGO Foundation operational ERP portal
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl border space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Salma Khatun"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Work Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="salma.khatun@jaago.com.bd"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Create Password</label>
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
              <span>{isLoading ? "Creating account..." : "Register"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
