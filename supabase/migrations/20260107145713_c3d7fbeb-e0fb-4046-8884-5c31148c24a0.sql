-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
-- Stores notifications for users (booking confirmations, reminders, etc.)

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'booking_confirmed', 'booking_cancelled', 'class_reminder', 'subscription_expiring'
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    channel VARCHAR(20) DEFAULT 'in_app',  -- 'in_app', 'email', 'sms', 'push'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES FOR NOTIFICATIONS
-- =============================================
-- Query pattern: Get user's unread notifications
CREATE INDEX idx_notifications_profile_unread ON public.notifications (profile_id, is_read) WHERE is_read = false;

-- Query pattern: Get notifications by tenant for admin view
CREATE INDEX idx_notifications_tenant_created ON public.notifications (tenant_id, created_at DESC);

-- Query pattern: Get unsent notifications for processing
CREATE INDEX idx_notifications_pending ON public.notifications (channel, sent_at) WHERE sent_at IS NULL;

-- =============================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =============================================
-- Classes: Query by date range (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_classes_tenant_starts ON public.classes (tenant_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_classes_starts_range ON public.classes (starts_at, ends_at);

-- Bookings: Query by student and status
CREATE INDEX IF NOT EXISTS idx_bookings_student_status ON public.bookings (student_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_class ON public.bookings (class_id);

-- Subscriptions: Active subscriptions lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_student_status ON public.subscriptions (student_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiring ON public.subscriptions (ends_at) WHERE status = 'active';

-- Schedules: Active schedules by day
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_day ON public.schedules (tenant_id, day_of_week) WHERE is_active = true;

-- Students: Active students per tenant
CREATE INDEX IF NOT EXISTS idx_students_tenant_active ON public.students (tenant_id) WHERE is_active = true;

-- Jobs: Pending jobs for worker
CREATE INDEX IF NOT EXISTS idx_jobs_pending ON public.jobs (status, scheduled_at) WHERE status = 'pending';

-- =============================================
-- RLS FOR NOTIFICATIONS
-- =============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (profile_id = get_current_profile_id());

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (profile_id = get_current_profile_id());

-- Tenant can manage notifications (service/admin creates them)
CREATE POLICY "Tenant can manage notifications"
ON public.notifications
FOR ALL
USING (tenant_id = get_current_tenant_id());

-- =============================================
-- TIMESTAMP TRIGGER
-- =============================================
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();