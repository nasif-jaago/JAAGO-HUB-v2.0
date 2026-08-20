export interface ModuleDefinition {
  code: string;
  name: string;
  category: "Core" | "Human Resources" | "Supply Chain" | "Financials" | "Operations";
  description: string;
  routeBase: string;
  isEnabled: boolean;
  requiredRoles?: string[] | undefined;
  dependencies?: string[] | undefined;
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  // ─── Core Platform ──────────────────────────────────────────────────────────
  {
    code: "core.auth",
    name: "Identity & RBAC",
    category: "Core",
    description: "Multi-tenant user identity, role-based access, and session management",
    routeBase: "/admin/settings",
    isEnabled: true,
  },
  {
    code: "core.audit",
    name: "Audit Trail",
    category: "Core",
    description: "Tamper-evident, hash-chained regulatory and compliance audit trail",
    routeBase: "/admin/audit",
    isEnabled: true,
  },
  {
    code: "core.approvals",
    name: "Approvals Engine",
    category: "Core",
    description: "Multi-tier threshold-based workflow approval engine",
    routeBase: "/approvals",
    isEnabled: true,
  },
  {
    code: "core.notifications",
    name: "Notification Center",
    category: "Core",
    description: "Real-time in-app badges and transactional email dispatch",
    routeBase: "/notifications",
    isEnabled: true,
  },

  // ─── Human Resources ───────────────────────────────────────────────────────
  {
    code: "hr.employees",
    name: "Employee Profiles & Lifecycle",
    category: "Human Resources",
    description: "Staff master records, designations, branches, and reporting hierarchy",
    routeBase: "/hr/employees",
    isEnabled: true,
    dependencies: ["core.auth"],
  },
  {
    code: "hr.leave",
    name: "Leave & Time-Off",
    category: "Human Resources",
    description: "Annual, sick, and casual leave quotas with multi-level approvals",
    routeBase: "/hr/leave",
    isEnabled: true,
    dependencies: ["hr.employees", "core.approvals"],
  },
  {
    code: "hr.attendance",
    name: "Attendance & Shifts",
    category: "Human Resources",
    description: "Biometric clock-in, geofenced mobile check-in, and shift scheduling",
    routeBase: "/hr/attendance",
    isEnabled: true,
    dependencies: ["hr.employees"],
  },
  {
    code: "hr.recruitment",
    name: "Recruitment & Onboarding",
    category: "Human Resources",
    description: "Job requisitions, applicant tracking, and automated onboarding invitations",
    routeBase: "/hr/recruitment",
    isEnabled: true,
    dependencies: ["hr.employees", "core.approvals"],
  },

  // ─── Supply Chain & Assets ─────────────────────────────────────────────────
  {
    code: "procurement.pr",
    name: "Procurement & Purchase Requests",
    category: "Supply Chain",
    description: "Purchase requisitions, quotations, vendor comparisons, and PO generation",
    routeBase: "/procurement",
    isEnabled: true,
    dependencies: ["core.approvals"],
  },
  {
    code: "inventory.stock",
    name: "Inventory & Warehouse Stock",
    category: "Supply Chain",
    description: "Stock ledger, goods receipt (GRN), and branch transfers",
    routeBase: "/inventory",
    isEnabled: true,
    dependencies: ["procurement.pr"],
  },
  {
    code: "assets.management",
    name: "Fixed Assets & Fleet",
    category: "Supply Chain",
    description: "Asset tagging, depreciation, custody tracking, and maintenance logs",
    routeBase: "/assets",
    isEnabled: true,
  },
  {
    code: "vendors.management",
    name: "Vendor Master & Enlistment",
    category: "Supply Chain",
    description: "Enlisted suppliers, compliance ratings, and purchase history",
    routeBase: "/vendors",
    isEnabled: true,
  },

  // ─── Financials & Operations ───────────────────────────────────────────────
  {
    code: "finance.accounting",
    name: "Financial Accounting & Vouchers",
    category: "Financials",
    description: "Chart of accounts, general ledger, payment/journal vouchers",
    routeBase: "/finance",
    isEnabled: true,
    dependencies: ["core.approvals"],
  },
  {
    code: "donors.grants",
    name: "Donors, Projects & Grants",
    category: "Operations",
    description: "Donor grant management, project budgets, and milestone tracking",
    routeBase: "/projects",
    isEnabled: true,
  },
  {
    code: "programmes.operations",
    name: "Field Programmes & Operations",
    category: "Operations",
    description: "Community education and school branch operations tracking",
    routeBase: "/programmes",
    isEnabled: true,
  },
];
