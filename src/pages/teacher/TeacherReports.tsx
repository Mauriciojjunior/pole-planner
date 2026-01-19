import { useState } from 'react';
import { DashboardLayout, NavItem } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  CreditCard, 
  Settings, 
  BarChart3
} from 'lucide-react';
import { ClassesChart } from '@/components/dashboard/ClassesChart';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { StudentStatsTable } from '@/components/dashboard/StudentStatsTable';
import { useTeacherClassStats, useTeacherStudentStats } from '@/hooks/useDashboard';
import { format, subDays } from 'date-fns';

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/professor', icon: LayoutDashboard },
  { title: 'Agenda', url: '/professor/agenda', icon: Calendar },
  { title: 'Alunos', url: '/professor/alunos', icon: Users },
  { title: 'Planos', url: '/professor/planos', icon: CreditCard },
  { title: 'Relatórios', url: '/professor/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/professor/configuracoes', icon: Settings },
];

export default function TeacherReports() {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');

  const { data: classStats, isLoading: classLoading } = useTeacherClassStats(dateRange, groupBy);
  const { data: studentStats, isLoading: studentLoading } = useTeacherStudentStats(dateRange);

  return (
    <DashboardLayout navItems={navItems} title="Relatórios">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">
            Análise detalhada das suas aulas e alunos
          </p>
        </div>

        <Tabs defaultValue="classes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="classes">
              <Calendar className="mr-2 h-4 w-4" />
              Aulas
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="mr-2 h-4 w-4" />
              Alunos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Agrupar por</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={groupBy === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('day')}
                  >
                    Dia
                  </Button>
                  <Button
                    variant={groupBy === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('week')}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={groupBy === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('month')}
                  >
                    Mês
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Aulas por Período</CardTitle>
                  <CardDescription>Quantidade de aulas realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClassesChart data={classStats || []} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Ocupação</CardTitle>
                  <CardDescription>Percentual de vagas preenchidas</CardDescription>
                </CardHeader>
                <CardContent>
                  <OccupancyChart data={classStats || []} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas por Aluno</CardTitle>
                <CardDescription>Frequência e participação dos alunos</CardDescription>
              </CardHeader>
              <CardContent>
                <StudentStatsTable data={studentStats || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
