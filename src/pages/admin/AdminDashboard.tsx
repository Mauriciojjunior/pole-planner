import { DashboardLayout, NavItem } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap,
  Settings,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAdminSummary } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Professores', url: '/admin/professores', icon: GraduationCap },
  { title: 'Alunos', url: '/admin/alunos', icon: Users },
  { title: 'Relatórios', url: '/admin/relatorios', icon: BarChart3 },
  { title: 'Segurança', url: '/admin/seguranca', icon: Shield },
  { title: 'Configurações', url: '/admin/configuracoes', icon: Settings },
];

export default function AdminDashboard() {
  const dateRange = {
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  };
  
  const { data: summary, isLoading } = useAdminSummary(dateRange);

  const stats = [
    {
      title: 'Professores Ativos',
      value: summary?.active_teachers ?? 0,
      total: summary?.total_teachers ?? 0,
      description: 'aprovados na plataforma',
      icon: GraduationCap,
      color: 'text-green-500',
    },
    {
      title: 'Professores Pendentes',
      value: summary?.pending_teachers ?? 0,
      description: 'aguardando aprovação',
      icon: Clock,
      color: 'text-orange-500',
    },
    {
      title: 'Total de Alunos',
      value: summary?.total_students ?? 0,
      description: `${summary?.active_students ?? 0} ativos`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Assinaturas Ativas',
      value: summary?.active_subscriptions ?? 0,
      description: `${summary?.trial_subscriptions ?? 0} em trial`,
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Painel Administrativo">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Painel Administrativo</h2>
          <p className="text-muted-foreground">Visão geral da plataforma nos últimos 30 dias</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {stat.value}
                      {stat.total !== undefined && (
                        <span className="text-sm font-normal text-muted-foreground">/{stat.total}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Aprovações Pendentes
              </CardTitle>
              <CardDescription>Professores aguardando revisão</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : summary?.pending_teachers && summary.pending_teachers > 0 ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{summary.pending_teachers} professor(es) pendente(s)</p>
                      <p className="text-sm text-muted-foreground">Requerem análise de documentos</p>
                    </div>
                  </div>
                  <Button size="sm">Revisar</Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Nenhuma aprovação pendente</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Gerenciamento da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="justify-start" variant="outline">
                <GraduationCap className="mr-2 h-4 w-4" />
                Gerenciar Professores
              </Button>
              <Button className="justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Alunos
              </Button>
              <Button className="justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver Relatórios
              </Button>
              <Button className="justify-start" variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Logs de Auditoria
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
