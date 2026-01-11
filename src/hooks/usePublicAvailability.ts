import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfDay } from 'date-fns';

interface AvailabilitySlot {
  slot_start: string;
  slot_end: string;
  class_type_id: string | null;
  class_type_name: string | null;
  spots_available: number;
  is_bookable: boolean;
}

interface UsePublicAvailabilityOptions {
  teacherId: string;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
}

export function usePublicAvailability(options: UsePublicAvailabilityOptions) {
  const {
    teacherId,
    startDate = startOfDay(new Date()),
    endDate = addDays(startOfDay(new Date()), 14),
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  } = options;

  return useQuery({
    queryKey: ['public-availability', teacherId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'), timezone],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_availability_slots', {
        p_tenant_id: teacherId,
        p_from_date: format(startDate, 'yyyy-MM-dd'),
        p_to_date: format(endDate, 'yyyy-MM-dd'),
        p_timezone: timezone,
      });

      if (error) throw error;
      
      // Map to our interface
      return ((data || []) as Array<{
        slot_start: string;
        slot_end: string;
        class_type_id: string | null;
        class_type_name: string | null;
        available_spots: number;
        is_available: boolean;
      }>).map(slot => ({
        slot_start: slot.slot_start,
        slot_end: slot.slot_end,
        class_type_id: slot.class_type_id,
        class_type_name: slot.class_type_name,
        spots_available: slot.available_spots,
        is_bookable: slot.is_available,
      })) as AvailabilitySlot[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!teacherId,
  });
}
