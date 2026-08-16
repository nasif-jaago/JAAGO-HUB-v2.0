"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Mail,
  Key,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Send,
  Save,
  Sliders,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface Permission {
  id: string;
  code: string;
  module: string;
  entity: string;
  action: string;
  description?: string | undefined;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | undefined;
  isSystem: boolean;
  permissions: string[];
  userCount?: number | undefined;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string | undefined;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | undefined;
}

interface ApiToken {
  id: string;
  name: string;
  tokenPrefix: string;
  rawSecretToken?: string | undefined;
  scopes: string[];
  expiresAt?: string | undefined;
  createdAt: string;
  lastUsedAt?: string | undefined;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"rbac" | "smtp" | "api-tokens" | "security">("rbac");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("r_admin");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New role modal state
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  // New API token modal state
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenScopes, setNewTokenScopes] = useState<string[]>(["hr.employee.view"]);
  const [createdTokenResult, setCreatedTokenResult] = useState<ApiToken | null>(null);

  // Test email state
  const [testEmailRecipient, setTestEmailRecipient] = useState("it-admin@jaago.com.bd");

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["admin-permissions"],
    queryFn: () => apiClient<Permission[]>("/v1/admin/rbac/permissions"),
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ["admin-roles"],
    queryFn: () => apiClient<Role[]>("/v1/admin/rbac/roles"),
  });

  const { data: smtpConfig } = useQuery<SmtpConfig>({
    queryKey: ["admin-smtp"],
    queryFn: () => apiClient<SmtpConfig>("/v1/admin/settings/email"),
  });

  const { data: apiTokens = [], isLoading: isLoadingTokens } = useQuery<ApiToken[]>({
    queryKey: ["admin-api-tokens"],
    queryFn: () => apiClient<ApiToken[]>("/v1/admin/settings/api-tokens"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Save role permissions
  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      apiClient<Role>(`/v1/admin/rbac/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      }),
    onSuccess: (updatedRole) => {
      queryClient.setQueryData<Role[]>(["admin-roles"], (old = []) =>
        old.map((r) => (r.id === updatedRole.id ? updatedRole : r)),
      );
      notify("success", `Role '${updatedRole.name}' permissions updated and live in backend!`);
    },
    onError: (err) => notify("error", err.message),
  });

  // Create custom role
  const createRoleMutation = useMutation({
    mutationFn: (dto: { name: string; code: string; description: string; permissions: string[] }) =>
      apiClient<Role>("/v1/admin/rbac/roles", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setSelectedRoleId(newRole.id);
      setShowCreateRole(false);
      setNewRoleName("");
      setNewRoleCode("");
      setNewRoleDesc("");
      notify("success", `Custom role '${newRole.name}' created successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  // Delete custom role
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) =>
      apiClient<{ success: boolean }>(`/v1/admin/rbac/roles/${roleId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setSelectedRoleId("r_admin");
      notify("success", "Role removed successfully.");
    },
    onError: (err) => notify("error", err.message),
  });

  // Update SMTP
  const [smtpForm, setSmtpForm] = useState<Partial<SmtpConfig>>({});
  const updateSmtpMutation = useMutation({
    mutationFn: (data: SmtpConfig) =>
      apiClient<SmtpConfig>("/v1/admin/settings/email", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-smtp"] });
      notify("success", "Email server (SMTP) configuration saved and active!");
    },
    onError: (err) => notify("error", err.message),
  });

  // Send Test Email
  const sendTestEmailMutation = useMutation({
    mutationFn: (recipientEmail: string) =>
      apiClient<{ success: boolean; message: string }>("/v1/admin/settings/email/test", {
        method: "POST",
        body: JSON.stringify({ recipientEmail }),
      }),
    onSuccess: (res) => notify("success", res.message),
    onError: (err) => notify("error", err.message),
  });

  // Generate API Token
  const createTokenMutation = useMutation({
    mutationFn: (dto: { name: string; scopes: string[]; expiresInDays: number }) =>
      apiClient<ApiToken>("/v1/admin/settings/api-tokens", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (newToken) => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-tokens"] });
      setCreatedTokenResult(newToken);
      setNewTokenName("");
      notify("success", "API Token generated successfully! Copy secret key now.");
    },
    onError: (err) => notify("error", err.message),
  });

  // Revoke API Token
  const revokeTokenMutation = useMutation({
    mutationFn: (tokenId: string) =>
      apiClient<{ success: boolean }>(`/v1/admin/settings/api-tokens/${tokenId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-tokens"] });
      notify("success", "API token revoked immediately.");
    },
    onError: (err) => notify("error", err.message),
  });

  // ─── Active Role Data ──────────────────────────────────────────────────────

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const activeRolePermissions = new Set(activeRole?.permissions || []);

  const handleTogglePermission = (permCode: string) => {
    if (!activeRole) return;
    const nextPerms = new Set(activeRole.permissions);
    if (nextPerms.has(permCode)) {
      nextPerms.delete(permCode);
    } else {
      nextPerms.add(permCode);
    }
    updateRoleMutation.mutate({
      roleId: activeRole.id,
      permissions: Array.from(nextPerms),
    });
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const list = acc[p.module] ?? [];
    list.push(p);
    acc[p.module] = list;
    return acc;
  }, {});

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Settings & Access Control"
        subtitle="Manage dynamic RBAC roles, outgoing SMTP email servers, API integration tokens, and security policies."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>HQ Global Control</span>
          </div>
        }
      />

      {/* Real-time Notification Banner */}
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

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-1 overflow-x-auto">
        {[
          { id: "rbac", label: "RBAC & Role Matrix", icon: ShieldCheck },
          { id: "smtp", label: "Email Server (SMTP)", icon: Mail },
          { id: "api-tokens", label: "API & Access Tokens", icon: Key },
          { id: "security", label: "Security & MFA Policies", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: RBAC & ROLE MATRIX ─────────────────────────────────────── */}
      {activeTab === "rbac" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Roles List */}
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Organizational Roles</h3>
              <button
                onClick={() => setShowCreateRole(true)}
                className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                title="Create Custom Role"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {isLoadingRoles ? (
                <div className="text-xs text-muted-foreground">Loading roles...</div>
              ) : (
                roles.map((role) => {
                  const isSelected = selectedRoleId === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-primary/20 border border-primary/50 text-foreground"
                          : "bg-secondary/30 hover:bg-secondary/60 border border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          <span>{role.name}</span>
                          {role.isSystem && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary border text-muted-foreground">
                              System
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {role.permissions.length} permissions • {role.userCount ?? 0} users
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Permission Matrix */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-3 space-y-6">
            {activeRole ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/40 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">{activeRole.name}</h2>
                      <span className="text-xs font-mono text-muted-foreground">({activeRole.code})</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeRole.description}</p>
                  </div>

                  {!activeRole.isSystem && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete custom role '${activeRole.name}'?`)) {
                          deleteRoleMutation.mutate(activeRole.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Role</span>
                    </button>
                  )}
                </div>

                {/* Module-by-Module Permission Toggles */}
                <div className="space-y-6">
                  {Object.entries(permissionsByModule).map(([moduleName, modulePerms]) => (
                    <div key={moduleName} className="space-y-3">
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {moduleName} Permissions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modulePerms.map((perm) => {
                          const isEnabled = activeRolePermissions.has(perm.code);
                          return (
                            <div
                              key={perm.code}
                              onClick={() => handleTogglePermission(perm.code)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                isEnabled
                                  ? "bg-primary/10 border-primary/40 text-foreground"
                                  : "bg-secondary/20 border-border/30 text-muted-foreground hover:bg-secondary/40"
                              }`}
                            >
                              <div className="pr-3">
                                <div className="text-xs font-semibold font-mono text-foreground">
                                  {perm.code}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {perm.description || `${perm.action} on ${perm.entity}`}
                                </div>
                              </div>

                              {/* Toggle switch visual */}
                              <div
                                className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                                  isEnabled ? "bg-primary justify-end" : "bg-secondary justify-start"
                                }`}
                              >
                                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Select a role on the left to configure permissions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: EMAIL SERVER (SMTP) ────────────────────────────────────── */}
      {activeTab === "smtp" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-5">
            <h3 className="font-semibold text-base text-foreground">Outgoing SMTP Mail Server</h3>
            <p className="text-xs text-muted-foreground">
              Configure JAAGO Foundation SMTP credentials (e.g. SendGrid, Mailgun, Amazon SES, Google Workspace).
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const current = smtpConfig || { host: "", port: 587, secure: false, username: "", fromName: "", fromEmail: "" };
                updateSmtpMutation.mutate({
                  host: smtpForm.host ?? current.host,
                  port: Number(smtpForm.port ?? current.port),
                  secure: Boolean(smtpForm.secure ?? current.secure),
                  username: smtpForm.username ?? current.username,
                  password: smtpForm.password ?? current.password,
                  fromName: smtpForm.fromName ?? current.fromName,
                  fromEmail: smtpForm.fromEmail ?? current.fromEmail,
                  replyToEmail: smtpForm.replyToEmail ?? current.replyToEmail,
                });
              }}
              className="space-y-4 pt-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">SMTP Host / Server</label>
                  <input
                    type="text"
                    defaultValue={smtpConfig?.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder="smtp.sendgrid.net"
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Port</label>
                  <input
                    type="number"
                    defaultValue={smtpConfig?.port || 587}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">SMTP Username / API Key</label>
                  <input
                    type="text"
                    defaultValue={smtpConfig?.username}
                    onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                    placeholder="apikey or user@domain.com"
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">SMTP Password</label>
                  <input
                    type="password"
                    defaultValue={smtpConfig?.password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Sender Display Name</label>
                  <input
                    type="text"
                    defaultValue={smtpConfig?.fromName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    placeholder="JAAGO Foundation ERP"
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Sender From Email</label>
                  <input
                    type="email"
                    defaultValue={smtpConfig?.fromEmail}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                    placeholder="notifications@jaago.com.bd"
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={updateSmtpMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{updateSmtpMutation.isPending ? "Saving..." : "Save SMTP Settings"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Test Email Dispatch Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-semibold text-base text-foreground">Send Test Email</h3>
            <p className="text-xs text-muted-foreground">
              Verify your SMTP server connection and SSL handshake by dispatching a test email.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Recipient Email Address</label>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => sendTestEmailMutation.mutate(testEmailRecipient)}
                disabled={sendTestEmailMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40 text-sm font-medium transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4 text-primary" />
                <span>{sendTestEmailMutation.isPending ? "Routing Test..." : "Dispatch Verification"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: API & ACCESS TOKENS ────────────────────────────────────── */}
      {activeTab === "api-tokens" && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-base text-foreground">Active API Tokens & Integration Keys</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use API keys to authenticate automated workflows, Zapier connectors, or internal integrations.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreateToken(true);
                  setCreatedTokenResult(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Generate New Token</span>
              </button>
            </div>

            {/* Token Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="pb-3 font-semibold">Token Name</th>
                    <th className="pb-3 font-semibold">Key Identifier</th>
                    <th className="pb-3 font-semibold">Scopes</th>
                    <th className="pb-3 font-semibold">Created</th>
                    <th className="pb-3 font-semibold">Last Used</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingTokens ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        Loading API tokens...
                      </td>
                    </tr>
                  ) : apiTokens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        No API tokens created yet.
                      </td>
                    </tr>
                  ) : (
                    apiTokens.map((token) => (
                      <tr key={token.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3.5 font-medium text-foreground">{token.name}</td>
                        <td className="py-3.5 font-mono text-muted-foreground">{token.tokenPrefix}</td>
                        <td className="py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {token.scopes.map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[10px] font-mono"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 text-muted-foreground">
                          {new Date(token.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-muted-foreground">
                          {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Revoke API token '${token.name}'?`)) {
                                revokeTokenMutation.mutate(token.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/15 transition-colors"
                            title="Revoke Token"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ─── TAB 4: SECURITY & MFA POLICIES ─────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="glass-card p-6 rounded-2xl max-w-3xl space-y-6">
          <h3 className="font-semibold text-base text-foreground">Organization Security Posture</h3>

          <div className="space-y-4 divide-y divide-border/30">
            {/* MFA Policy */}
            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">Enforce Multi-Factor Authentication (MFA)</div>
                <p className="text-xs text-muted-foreground">
                  Require all officers and directors to complete TOTP authenticator app verification on login.
                </p>
              </div>
              <div className="w-10 h-6 rounded-full bg-primary flex items-center justify-end p-0.5 cursor-pointer">
                <div className="w-5 h-5 rounded-full bg-white shadow-md" />
              </div>
            </div>

            {/* Session Expiry */}
            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">Session Idle Timeout</div>
                <p className="text-xs text-muted-foreground">
                  Automatically sign out inactive users after 120 minutes of inactivity.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-secondary border border-border/40">
                120 Minutes
              </span>
            </div>

            {/* Password Rotation */}
            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">Password Expiry Policy</div>
                <p className="text-xs text-muted-foreground">
                  Require credential rotation every 90 days with NIST compliance checks.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-secondary border border-border/40">
                90 Days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE ROLE ──────────────────────────────────────────────── */}
      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <h3 className="text-base font-bold text-foreground">Create Custom RBAC Role</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate({
                  name: newRoleName,
                  code: newRoleCode || newRoleName.toLowerCase().replace(/\s+/g, "_"),
                  description: newRoleDesc,
                  permissions: ["hr.leave.view", "procurement.pr.view"],
                });
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Role Display Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Field Project Officer"
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Role Machine Code</label>
                <input
                  type="text"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  placeholder="e.g. field_project_officer"
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Responsibilities and access scope..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateRole(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
                >
                  {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE API TOKEN ────────────────────────────────────────── */}
      {showCreateToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <h3 className="text-base font-bold text-foreground">Generate API Integration Key</h3>

            {createdTokenResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs space-y-2">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Secret Key Generated Successfully</span>
                  </div>
                  <p className="text-muted-foreground">
                    Copy this key now. For your security, this key cannot be shown again.
                  </p>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background font-mono text-foreground border border-border/40 break-all select-all">
                    <span className="flex-1 text-xs">{createdTokenResult.rawSecretToken}</span>
                    <button
                      onClick={() => handleCopy(createdTokenResult.rawSecretToken!)}
                      className="p-1 rounded text-primary hover:bg-primary/10"
                      title="Copy Key"
                    >
                      {copiedToken === createdTokenResult.rawSecretToken ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowCreateToken(false);
                      setCreatedTokenResult(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createTokenMutation.mutate({
                    name: newTokenName,
                    scopes: newTokenScopes,
                    expiresInDays: 90,
                  });
                }}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Token Label / Service Name</label>
                  <input
                    type="text"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g. Odoo Sync Connector"
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Permission Scopes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { code: "hr.employee.view", label: "Read Employees" },
                      { code: "hr.leave.view", label: "Read Leaves" },
                      { code: "procurement.pr.create", label: "Create Requisitions" },
                      { code: "finance.voucher.view", label: "Read Financial Ledgers" },
                      { code: "admin.settings.manage", label: "Admin Settings" },
                    ].map((scope) => {
                      const isChecked = newTokenScopes.includes(scope.code);
                      return (
                        <label
                          key={scope.code}
                          className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-xs text-foreground cursor-pointer hover:bg-secondary/60"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTokenScopes([...newTokenScopes, scope.code]);
                              } else {
                                setNewTokenScopes(newTokenScopes.filter((s) => s !== scope.code));
                              }
                            }}
                            className="rounded border-border"
                          />
                          <span>{scope.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateToken(false)}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTokenMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
                  >
                    {createTokenMutation.isPending ? "Generating..." : "Generate Token"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
