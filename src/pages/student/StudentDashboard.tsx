import { DashboardLayout, NavItem } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, Clock, User, Search, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems: NavItem[] = [
  { title: 'Início', url: '/aluno', icon: BookOpen },
  { title: 'Minhas Aulas', url: '/aluno/aulas', icon: Calendar },
  { title: 'Buscar Professores', url: '/aluno/professores', icon: Search },
  { title: 'Notificações', url: '/aluno/notificacoes', icon: Bell },
  { title: 'Meu Perfil', url: '/aluno/perfil', icon: User },
];

export default function StudentDashboard() {
  const { profile } = useAuth();

  return (
    <DashboardLayout navItems={navItems} title="Área do Aluno">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Olá, {profile?.name?.split(' ')[0] || 'Aluno'}! 👋
          </h2>
          <p className="text-muted-foreground">
            Bem-vindo à sua área de estudos. Acompanhe suas aulas e encontre novos professores.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Aulas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">nos próximos 7 dias</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aulas Realizadas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">este mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas de Estudo</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">36h</div>
              <p className="text-xs text-muted-foreground">total acumulado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Aulas</CardTitle>
            <CardDescription>
              Suas aulas agendadas para os próximos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Aula de Yoga</p>
                    <p className="text-sm text-muted-foreground">com Maria Silva</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">Amanhã</p>
                  <p className="text-sm text-muted-foreground">14:00 - 15:00</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Aula de Pilates</p>
                    <p className="text-sm text-muted-foreground">com João Santos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">Quinta-feira</p>
                  <p className="text-sm text-muted-foreground">10:00 - 11:00</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver todas as aulas
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Buscar Professores
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Ver Agenda
            </Button>
            <Button variant="outline">
              <Bell className="mr-2 h-4 w-4" />
              Notificações
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
