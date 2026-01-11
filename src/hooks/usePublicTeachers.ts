import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublicTeacher {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  specialties: string[] | null;
  timezone: string | null;
  price_cents: number | null;
  currency: string | null;
  is_price_public: boolean;
}

interface UsePublicTeachersOptions {
  search?: string;
  specialty?: string;
  page?: number;
  limit?: number;
}

export function usePublicTeachers(options: UsePublicTeachersOptions = {}) {
  const { search = '', specialty = '', page = 1, limit = 12 } = options;

  return useQuery({
    queryKey: ['public-teachers', search, specialty, page, limit],
    queryFn: async () => {
      // Query teachers directly with filters
      let query = supabase
        .from('teachers')
        .select('id, name, slug, bio, avatar_url, specialties, timezone, price_cents, currency, is_price_public')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      if (specialty) {
        query = query.contains('specialties', [specialty]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PublicTeacher[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePublicTeacherProfile(slugOrId: string) {
  return useQuery({
    queryKey: ['public-teacher-profile', slugOrId],
    queryFn: async () => {
      const url = `https://zvvvfitrolqeyrfszfcv.supabase.co/functions/v1/public-profile?slug=${encodeURIComponent(slugOrId)}`;
      const res = await fetch(url, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dnZmaXRyb2xxZXlyZnN6ZmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjM2OTMsImV4cCI6MjA4MTczOTY5M30.kaBZvyzwRs42_avhs58HRnIFPg2n4woxE3IZn9UL8os',
        },
      });
      if (!res.ok) throw new Error('Teacher not found');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!slugOrId,
  });
}
