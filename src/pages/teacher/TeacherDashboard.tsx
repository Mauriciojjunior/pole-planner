import { DashboardLayout, NavItem } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3,
  Clock,
  TrendingUp,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherSummary } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/professor', icon: LayoutDashboard },
  { title: 'Agenda', url: '/professor/agenda', icon: Calendar },
  { title: 'Alunos', url: '/professor/alunos', icon: Users },
  { title: 'Planos', url: '/professor/planos', icon: CreditCard },
  { title: 'Relatórios', url: '/professor/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/professor/configuracoes', icon: Settings },
];

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const dateRange = {
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  };
  
  const { data: summary, isLoading } = useTeacherSummary(dateRange);

  const stats = [
    {
      title: 'Total de Aulas',
      value: summary?.total_classes ?? 0,
      description: 'nos últimos 30 dias',
      icon: Calendar,
    },
    {
      title: 'Alunos Ativos',
      value: summary?.active_students ?? 0,
      description: 'com aulas agendadas',
      icon: Users,
    },
    {
      title: 'Taxa de Ocupação',
      value: `${summary?.occupancy_rate?.toFixed(0) ?? 0}%`,
      description: 'das vagas preenchidas',
      icon: TrendingUp,
    },
    {
      title: 'Taxa de Presença',
      value: `${summary?.attendance_rate?.toFixed(0) ?? 0}%`,
      description: 'comparecimento',
      icon: UserCheck,
    },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Dashboard do Professor">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Olá, {profile?.name?.split(' ')[0] || 'Professor'}! 👋
          </h2>
          <p className="text-muted-foreground">
            Aqui está um resumo da sua atividade nos últimos 30 dias.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pending Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Reservas Pendentes
              </CardTitle>
              <CardDescription>
                Reservas aguardando sua confirmação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : summary?.pending_bookings && summary.pending_bookings > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{summary.pending_bookings} reservas pendentes</p>
                        <p className="text-sm text-muted-foreground">Requerem sua atenção</p>
                      </div>
                    </div>
                    <Button size="sm">Ver todas</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma reserva pendente</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesso rápido às funcionalidades mais usadas
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Gerenciar Agenda
              </Button>
              <Button className="justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Ver Alunos
              </Button>
              <Button className="justify-start" variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Configurar Planos
              </Button>
              <Button className="justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Aulas de Hoje</CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: undefined })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Aula de Yoga Iniciante</p>
                    <p className="text-sm text-muted-foreground">3 alunos confirmados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">09:00 - 10:00</p>
                  <p className="text-sm text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Aula de Yoga Avançado</p>
                    <p className="text-sm text-muted-foreground">5 alunos confirmados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">14:00 - 15:30</p>
                  <p className="text-sm text-muted-foreground">Presencial</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver agenda completa
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
