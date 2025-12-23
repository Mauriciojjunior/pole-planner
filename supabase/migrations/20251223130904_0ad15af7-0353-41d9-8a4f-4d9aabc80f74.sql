-- ============================================
-- ENABLE RLS ON ALL TABLES (Defense-in-Depth)
-- Primary isolation is at application level
-- RLS serves as secondary security layer
-- ============================================

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER: Get current tenant from session
-- Application must set: SET app.current_tenant_id = 'uuid'
-- ============================================
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
$$;

-- ============================================
-- HELPER: Get current profile from session
-- Application must set: SET app.current_profile_id = 'uuid'
-- ============================================
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_profile_id', true), '')::UUID
$$;

-- ============================================
-- TEACHERS (Tenant root - special rules)
-- ============================================
CREATE POLICY "Teachers can view own record"
  ON teachers FOR SELECT
  USING (id = get_current_tenant_id() OR is_active = true);

CREATE POLICY "Teachers can update own record"
  ON teachers FOR UPDATE
  USING (id = get_current_tenant_id());

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = get_current_profile_id());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = get_current_profile_id());

CREATE POLICY "Service can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================
-- USER ROLES
-- ============================================
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (profile_id = get_current_profile_id() OR tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant admins can manage roles"
  ON user_roles FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- TENANT-SCOPED TABLES (Standard pattern)
-- ============================================

-- STUDENTS
CREATE POLICY "Tenant isolation for students"
  ON students FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- CLASS TYPES
CREATE POLICY "Tenant isolation for class_types"
  ON class_types FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Public class types are viewable"
  ON class_types FOR SELECT
  USING (is_public = true AND is_active = true);

-- SCHEDULES
CREATE POLICY "Tenant isolation for schedules"
  ON schedules FOR ALL
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Public schedules are viewable"
  ON schedules FOR SELECT
  USING (is_public = true AND is_active = true);

-- CLASSES
CREATE POLICY "Tenant isolation for classes"
  ON classes FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- BOOKINGS
CREATE POLICY "Tenant isolation for bookings"
  ON bookings FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- BLOCKS
CREATE POLICY "Tenant isolation for blocks"
  ON blocks FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- PLANS
CREATE POLICY "Tenant isolation for plans"
  ON plans FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- SUBSCRIPTIONS
CREATE POLICY "Tenant isolation for subscriptions"
  ON subscriptions FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- JOBS
CREATE POLICY "Tenant isolation for jobs"
  ON jobs FOR ALL
  USING (tenant_id = get_current_tenant_id() OR tenant_id IS NULL);

-- AUDIT LOGS (Read-only for tenant)
CREATE POLICY "Tenant can view own audit logs"
  ON audit_logs FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Service can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Fix function search path for update_updated_at_column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;