import { useState } from 'react';
import { format, parseISO, startOfDay, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users } from 'lucide-react';

interface AvailabilitySlot {
  slot_start: string;
  slot_end: string;
  class_type_id: string | null;
  class_type_name: string | null;
  spots_available: number;
  is_bookable: boolean;
}

interface AvailabilityCalendarProps {
  slots: AvailabilitySlot[];
  isLoading?: boolean;
  onDateChange?: (startDate: Date, endDate: Date) => void;
}

export function AvailabilityCalendar({
  slots,
  isLoading,
  onDateChange,
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  // Obter datas que têm disponibilidade
  const datesWithSlots = new Set(
    slots.map((slot) => format(parseISO(slot.slot_start), 'yyyy-MM-dd'))
  );

  // Obter horários para a data selecionada
  const selectedDateSlots = slots.filter((slot) =>
    isSameDay(parseISO(slot.slot_start), selectedDate)
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleMonthChange = (date: Date) => {
    const startDate = startOfDay(date);
    const endDate = addDays(startDate, 30);
    onDateChange?.(startDate, endDate);
  };

  const formatTime = (isoString: string) => {
    return format(parseISO(isoString), 'HH:mm', { locale: ptBR });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar Card */}
      <Card className="border-border/50 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">Selecione a Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
            disabled={(date) => date < startOfDay(new Date())}
            modifiers={{
              hasSlots: (date) => datesWithSlots.has(format(date, 'yyyy-MM-dd')),
            }}
            modifiersStyles={{
              hasSlots: {
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                color: 'hsl(var(--primary))',
              },
            }}
            locale={ptBR}
            className="rounded-lg"
          />
        </CardContent>
      </Card>

      {/* Slots Card */}
      <Card className="border-border/50 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">
            Horários - {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : selectedDateSlots.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Nenhum horário disponível nesta data.</p>
              <p className="text-sm mt-1">Selecione outra data no calendário.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {selectedDateSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    slot.is_bookable
                      ? 'bg-card border-primary/20 hover:border-primary/40 hover:shadow-sm cursor-pointer'
                      : 'bg-muted/50 border-border opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        {formatTime(slot.slot_start)} - {formatTime(slot.slot_end)}
                      </div>
                      {slot.class_type_name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {slot.class_type_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {slot.spots_available > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                          <Users className="h-3.5 w-3.5" />
                          {slot.spots_available} {slot.spots_available === 1 ? 'vaga' : 'vagas'}
                        </div>
                      )}
                      <Badge variant={slot.is_bookable ? 'sage' : 'outline'}>
                        {slot.is_bookable ? 'Disponível' : 'Lotado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
