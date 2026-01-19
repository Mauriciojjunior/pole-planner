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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecione a Data</CardTitle>
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
              },
            }}
            locale={ptBR}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Horários Disponíveis para {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : selectedDateSlots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum horário disponível para esta data
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {selectedDateSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatTime(slot.slot_start)} - {formatTime(slot.slot_end)}
                    </div>
                    {slot.class_type_name && (
                      <Badge variant="secondary" className="text-xs">
                        {slot.class_type_name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {slot.spots_available > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {slot.spots_available} {slot.spots_available === 1 ? 'vaga' : 'vagas'}
                      </div>
                    )}
                    {slot.is_bookable ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        Disponível
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Lotado
                      </Badge>
                    )}
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
