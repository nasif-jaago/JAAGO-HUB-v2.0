"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Upload, Globe, Trash2, RefreshCw, Search } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Company {
  id: string;
  name: string;
  code: string;
  country: string;
  website: string;
  employeeCount: number;
  branchesCount: number;
}

export default function PCOrganizationCompaniesPage() {
  const { data: companies = [], isLoading, refetch } = useQuery<Company[]>({
    queryKey: ["pc", "companies"],
    queryFn: () => apiClient<Company[]>("/v1/people-culture/companies"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight text-foreground">
            Organization & Branches
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your legal entity structure, contact details, and branch office locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>+ NEW</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground shadow-xs">
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>IMPORT</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-serif text-foreground">Companies</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4 w-12 text-center">
                <input type="checkbox" className="rounded accent-amber-500" />
              </th>
              <th className="py-3 px-4">Company Name</th>
              <th className="py-3 px-4">Partner / Country</th>
              <th className="py-3 px-4">Website</th>
              <th className="py-3 px-4 text-center">Employees</th>
              <th className="py-3 px-4 text-center">Branches</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 text-center">
                  <input type="checkbox" className="rounded accent-amber-500" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] shadow-xs">
                      JA
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{c.code}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-foreground font-medium">{c.country}</td>
                <td className="py-3.5 px-4">
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{c.website}</span>
                  </a>
                </td>
                <td className="py-3.5 px-4 text-center font-bold font-mono text-amber-600 dark:text-amber-400">
                  {c.employeeCount}
                </td>
                <td className="py-3.5 px-4 text-center font-bold font-mono text-foreground">
                  {c.branchesCount}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
