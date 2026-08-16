-- Migration: 20260816000002_identity_and_tenancy.sql
-- Description: Identity, Tenancy, Users, Roles, Permissions, Employees, Invitations, and Sessions

-- ─── 1. Offices Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL,
    office_type VARCHAR(50) NOT NULL DEFAULT 'branch',
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL DEFAULT 'Dhaka',
    division VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL DEFAULT 'BD',
    contact_phone VARCHAR(30),
    contact_email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_offices_org_id ON public.offices(org_id);
CREATE INDEX IF NOT EXISTS idx_offices_code ON public.offices(org_id, code);
CREATE INDEX IF NOT EXISTS idx_offices_is_active ON public.offices(org_id, is_active);

-- ─── 2. Departments Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    head_employee_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_departments_org_id ON public.departments(org_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(org_id, code);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON public.departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(org_id, is_active);

-- ─── 3. Users Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_user_id UUID NOT NULL,
    default_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    avatar_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_enforced BOOLEAN NOT NULL DEFAULT false,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_supabase_user_id ON public.users(supabase_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_default_org_id ON public.users(default_org_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ─── 4. Permissions Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);

-- ─── 5. Roles Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_roles_org_id ON public.roles(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_org_code ON public.roles(org_id, code);

-- ─── 6. Role Permissions Mapping ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique ON public.role_permissions(role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);

-- ─── 7. User Roles Mapping ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON public.user_roles(user_id, role_id, org_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_org ON public.user_roles(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_role ON public.user_roles(org_id, role_id);

-- ─── 8. Employees Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    bangla_name VARCHAR(150),
    email VARCHAR(255) NOT NULL,
    personal_email VARCHAR(255),
    phone VARCHAR(30) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    nid VARCHAR(50),
    passport_number VARCHAR(50),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) NOT NULL,
    employment_type VARCHAR(30) NOT NULL DEFAULT 'full_time',
    employment_status VARCHAR(30) NOT NULL DEFAULT 'active',
    reports_to_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    join_date DATE NOT NULL,
    confirmation_date DATE,
    resignation_date DATE,
    last_working_day DATE,
    present_address TEXT,
    permanent_address TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),
    emergency_contact_relation VARCHAR(50),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_org_code ON public.employees(org_id, employee_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_org_email ON public.employees(org_id, email);
CREATE INDEX IF NOT EXISTS idx_employees_org_id ON public.employees(org_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_office_id ON public.employees(office_id);
CREATE INDEX IF NOT EXISTS idx_employees_reports_to ON public.employees(reports_to_employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(org_id, employment_status);

-- ─── 9. Invitations Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_org_email ON public.invitations(org_id, email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- ─── 10. Sessions Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(128) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    device_type VARCHAR(50),
    operating_system VARCHAR(50),
    browser VARCHAR(50),
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(100),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_refresh_token ON public.sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_is_revoked ON public.sessions(is_revoked);
