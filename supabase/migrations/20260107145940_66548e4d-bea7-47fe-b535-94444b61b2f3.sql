-- =============================================
-- PROFESSOR APPROVAL STATUS
-- =============================================
-- Add approval status to teachers table for pending approval workflow
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Index for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_teachers_approval_status ON public.teachers (approval_status);

-- Update existing teachers to approved status
UPDATE public.teachers SET approval_status = 'approved' WHERE approval_status IS NULL;

-- =============================================
-- MFA PREFERENCES
-- =============================================
-- Add MFA preference to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;

-- =============================================
-- PASSWORD RESET TOKENS (for non-Supabase auth)
-- =============================================
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_password_reset_token ON public.password_reset_tokens (token_hash) WHERE used_at IS NULL;

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only service can manage tokens
CREATE POLICY "Service can manage password tokens"
ON public.password_reset_tokens
FOR ALL
USING (false)
WITH CHECK (false);

-- =============================================
-- ADMIN ROLE ASSIGNMENT HELPER
-- =============================================
-- Function to check if user is admin in any tenant
CREATE OR REPLACE FUNCTION public.is_platform_admin(_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE profile_id = _profile_id
      AND role = 'admin'
  )
$$;