-- ============================================================
-- Migration: 20260816000003_identity_rls_policies
-- Purpose: Enable & Force Row Level Security (RLS) on all Identity tables
-- Author: JAAGO ERP System
-- ============================================================

-- ─── 1. Enable RLS on all IAM tables ─────────────────────────────────────────
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Force RLS so table owners / service roles cannot bypass accidentally without explicit bypass
ALTER TABLE public.offices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.departments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invitations FORCE ROW LEVEL SECURITY;

-- ─── 2. Helper function to extract current tenant org_id from JWT or session ──
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(
        COALESCE(
            current_setting('app.current_org_id', true),
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id'),
            (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')
        ),
        ''
    )::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── 3. Helper function to check if current user is SuperAdmin ────────────────
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'roles') ? 'super_admin'
        OR (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'roles') ? 'SuperAdmin',
        false
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── 4. Offices RLS Policies ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "offices_tenant_isolation" ON public.offices;
CREATE POLICY "offices_tenant_isolation" ON public.offices
    FOR ALL
    USING (org_id = public.current_org_id() OR public.is_super_admin())
    WITH CHECK (org_id = public.current_org_id() OR public.is_super_admin());

-- ─── 5. Departments RLS Policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "departments_tenant_isolation" ON public.departments;
CREATE POLICY "departments_tenant_isolation" ON public.departments
    FOR ALL
    USING (org_id = public.current_org_id() OR public.is_super_admin())
    WITH CHECK (org_id = public.current_org_id() OR public.is_super_admin());

-- ─── 6. Employees RLS Policies ────────────────────────────────────────────────
DROP POLICY IF EXISTS "employees_tenant_isolation" ON public.employees;
CREATE POLICY "employees_tenant_isolation" ON public.employees
    FOR ALL
    USING (org_id = public.current_org_id() OR public.is_super_admin())
    WITH CHECK (org_id = public.current_org_id() OR public.is_super_admin());

-- ─── 7. Roles RLS Policies ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "roles_tenant_isolation" ON public.roles;
CREATE POLICY "roles_tenant_isolation" ON public.roles
    FOR ALL
    USING (org_id IS NULL OR org_id = public.current_org_id() OR public.is_super_admin())
    WITH CHECK (org_id = public.current_org_id() OR public.is_super_admin());

-- ─── 8. User Roles RLS Policies ───────────────────────────────────────────────
DROP POLICY IF EXISTS "user_roles_tenant_isolation" ON public.user_roles;
CREATE POLICY "user_roles_tenant_isolation" ON public.user_roles
    FOR ALL
    USING (org_id = public.current_org_id() OR public.is_super_admin())
    WITH CHECK (org_id = public.current_org_id() OR public.is_super_admin());

-- ─── 9. Invitations RLS Policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "invitations_tenant_isolation" ON public.invitations;
CREATE POLICY "invitations_tenant_isolation" ON public.invitations
    FOR ALL
    USING (org_id = public.current_org_id() OR public.is_super_admin())
    WITH CHECK (org_id = public.current_org_id() OR public.is_super_admin());

-- ─── 10. Users RLS Policies ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_self_or_tenant" ON public.users;
CREATE POLICY "users_self_or_tenant" ON public.users
    FOR ALL
    USING (
        supabase_user_id = auth.uid()
        OR default_org_id = public.current_org_id()
        OR public.is_super_admin()
    )
    WITH CHECK (
        supabase_user_id = auth.uid()
        OR default_org_id = public.current_org_id()
        OR public.is_super_admin()
    );

-- ─── 11. Sessions RLS Policies ────────────────────────────────────────────────
DROP POLICY IF EXISTS "sessions_self" ON public.sessions;
CREATE POLICY "sessions_self" ON public.sessions
    FOR ALL
    USING (
        user_id IN (SELECT id FROM public.users WHERE supabase_user_id = auth.uid())
        OR public.is_super_admin()
    )
    WITH CHECK (
        user_id IN (SELECT id FROM public.users WHERE supabase_user_id = auth.uid())
        OR public.is_super_admin()
    );
