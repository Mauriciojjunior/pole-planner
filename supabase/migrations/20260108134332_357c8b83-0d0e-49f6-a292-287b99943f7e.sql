-- Extend teachers table with new profile fields
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS address_encrypted text,
ADD COLUMN IF NOT EXISTS phone_encrypted text,
ADD COLUMN IF NOT EXISTS price_cents integer,
ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS is_price_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_phone_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS portfolio_url text,
ADD COLUMN IF NOT EXISTS document_verified boolean DEFAULT false;

-- Create index for specialties search
CREATE INDEX IF NOT EXISTS idx_teachers_specialties ON public.teachers USING GIN(specialties);

-- Create teacher_documents table for document/portfolio uploads
CREATE TABLE IF NOT EXISTS public.teacher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL, -- 'id_document', 'certification', 'portfolio'
  file_path text NOT NULL,
  file_name varchar(255) NOT NULL,
  file_size integer,
  mime_type varchar(100),
  status varchar(20) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on teacher_documents
ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;

-- Teachers can view and manage their own documents
CREATE POLICY "Teachers can manage own documents"
ON public.teacher_documents
FOR ALL
USING (tenant_id = get_current_tenant_id());

-- Admins can view all documents (via service role)
CREATE POLICY "Service can manage all documents"
ON public.teacher_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create storage bucket for teacher documents (done via Supabase dashboard or API)
-- We'll handle this in the edge function

-- Update teachers RLS for public profile viewing with limited fields
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;

CREATE POLICY "Public can view active teacher profiles"
ON public.teachers
FOR SELECT
USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Teachers can view and manage own record"
ON public.teachers
FOR SELECT
USING (id = get_current_tenant_id());

-- Create function to get public teacher profile (limited fields)
CREATE OR REPLACE FUNCTION public.get_public_teacher_profile(teacher_slug varchar)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'bio', t.bio,
    'avatar_url', t.avatar_url,
    'specialties', t.specialties,
    'timezone', t.timezone,
    'price_cents', CASE WHEN t.is_price_public THEN t.price_cents ELSE NULL END,
    'currency', CASE WHEN t.is_price_public THEN t.currency ELSE NULL END,
    'phone', CASE WHEN t.is_phone_public THEN t.phone ELSE NULL END
  ) INTO result
  FROM public.teachers t
  WHERE t.slug = teacher_slug
    AND t.is_active = true
    AND t.approval_status = 'approved';
  
  RETURN result;
END;
$$;

-- Create function to get full teacher profile (for authenticated students)
CREATE OR REPLACE FUNCTION public.get_teacher_profile_for_student(teacher_id uuid, student_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  is_enrolled boolean;
BEGIN
  -- Check if student is enrolled with this teacher
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.profile_id = student_profile_id
      AND s.tenant_id = teacher_id
      AND s.is_active = true
  ) INTO is_enrolled;
  
  IF NOT is_enrolled THEN
    -- Return public profile only
    SELECT jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'bio', t.bio,
      'avatar_url', t.avatar_url,
      'specialties', t.specialties,
      'timezone', t.timezone,
      'price_cents', CASE WHEN t.is_price_public THEN t.price_cents ELSE NULL END,
      'currency', CASE WHEN t.is_price_public THEN t.currency ELSE NULL END
    ) INTO result
    FROM public.teachers t
    WHERE t.id = teacher_id
      AND t.is_active = true
      AND t.approval_status = 'approved';
  ELSE
    -- Return full profile for enrolled students
    SELECT jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'bio', t.bio,
      'avatar_url', t.avatar_url,
      'specialties', t.specialties,
      'timezone', t.timezone,
      'price_cents', t.price_cents,
      'currency', t.currency,
      'phone', t.phone,
      'email', t.email
    ) INTO result
    FROM public.teachers t
    WHERE t.id = teacher_id
      AND t.is_active = true;
  END IF;
  
  RETURN result;
END;
$$;

-- Add trigger for updated_at on teacher_documents
CREATE TRIGGER update_teacher_documents_updated_at
BEFORE UPDATE ON public.teacher_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();