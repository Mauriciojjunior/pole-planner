import { useState } from 'react';
import { DashboardLayout, NavItem } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, Clock, User, Search, Bell, MapPin, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const navItems: NavItem[] = [
  { title: 'Início', url: '/aluno', icon: BookOpen },
  { title: 'Minhas Aulas', url: '/aluno/aulas', icon: Calendar },
  { title: 'Buscar Professores', url: '/aluno/professores', icon: Search },
  { title: 'Notificações', url: '/aluno/notificacoes', icon: Bell },
  { title: 'Meu Perfil', url: '/aluno/perfil', icon: User },
];

interface ClassBooking {
  id: string;
  className: string;
  teacherName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  location?: string;
}

const mockBookings: ClassBooking[] = [
  {
    id: '1',
    className: 'Aula de Yoga',
    teacherName: 'Maria Silva',
    date: '2026-01-20',
    time: '14:00 - 15:00',
    status: 'confirmed',
    location: 'Online',
  },
  {
    id: '2',
    className: 'Aula de Pilates',
    teacherName: 'João Santos',
    date: '2026-01-22',
    time: '10:00 - 11:00',
    status: 'pending',
  },
  {
    id: '3',
    className: 'Aula de Meditação',
    teacherName: 'Ana Costa',
    date: '2026-01-15',
    time: '09:00 - 10:00',
    status: 'completed',
  },
];

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendente',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  pending: 'secondary',
  completed: 'outline',
  cancelled: 'destructive',
};

export default function StudentClasses() {
  const [bookings] = useState<ClassBooking[]>(mockBookings);

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const ClassCard = ({ booking }: { booking: ClassBooking }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{booking.className}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {booking.teacherName}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(booking.date).toLocaleDateString('pt-BR')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {booking.time}
                </span>
                {booking.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {booking.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusVariants[booking.status]}>
              {statusLabels[booking.status]}
            </Badge>
            {(booking.status === 'confirmed' || booking.status === 'pending') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Aula</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar esta aula? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout navItems={navItems} title="Minhas Aulas">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Minhas Aulas</h2>
          <p className="text-muted-foreground">
            Gerencie suas aulas agendadas e veja o histórico
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Próximas ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Histórico ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map(booking => (
                <ClassCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Nenhuma aula agendada</h3>
                  <p className="text-muted-foreground mb-4">
                    Você ainda não tem aulas agendadas. Que tal buscar um professor?
                  </p>
                  <Button>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar Professores
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {pastBookings.length > 0 ? (
              pastBookings.map(booking => (
                <ClassCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Nenhuma aula no histórico</h3>
                  <p className="text-muted-foreground">
                    Suas aulas concluídas aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
