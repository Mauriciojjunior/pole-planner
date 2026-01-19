import { useState } from 'react';
import { DashboardLayout, NavItem } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap,
  Settings,
  BarChart3,
  Shield,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { SubscriptionPieChart } from '@/components/dashboard/SubscriptionPieChart';
import { UsageLineChart } from '@/components/dashboard/UsageLineChart';
import { useAdminConversionFunnel, useAdminSubscriptionStats, useAdminUsageOverTime } from '@/hooks/useDashboard';
import { format, subDays } from 'date-fns';

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Professores', url: '/admin/professores', icon: GraduationCap },
  { title: 'Alunos', url: '/admin/alunos', icon: Users },
  { title: 'Relatórios', url: '/admin/relatorios', icon: BarChart3 },
  { title: 'Segurança', url: '/admin/seguranca', icon: Shield },
  { title: 'Configurações', url: '/admin/configuracoes', icon: Settings },
];

export default function AdminReports() {
  const [dateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');

  const { data: funnelData } = useAdminConversionFunnel(dateRange);
  const { data: subscriptionData } = useAdminSubscriptionStats();
  const { data: usageData } = useAdminUsageOverTime(dateRange, groupBy);

  return (
    <DashboardLayout navItems={navItems} title="Relatórios">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios da Plataforma</h2>
          <p className="text-muted-foreground">Análise detalhada do desempenho da plataforma</p>
        </div>

        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList>
            <TabsTrigger value="growth">
              <TrendingUp className="mr-2 h-4 w-4" />
              Crescimento
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <CreditCard className="mr-2 h-4 w-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="funnel">
              <BarChart3 className="mr-2 h-4 w-4" />
              Funil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Agrupar por</CardTitle>
                <div className="flex gap-2">
                  {(['day', 'week', 'month'] as const).map((g) => (
                    <Button
                      key={g}
                      variant={groupBy === g ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGroupBy(g)}
                    >
                      {g === 'day' ? 'Dia' : g === 'week' ? 'Semana' : 'Mês'}
                    </Button>
                  ))}
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crescimento da Plataforma</CardTitle>
                <CardDescription>Novos professores, alunos e reservas ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <UsageLineChart data={usageData || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Assinaturas</CardTitle>
                  <CardDescription>Por status de assinatura</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <SubscriptionPieChart data={subscriptionData || []} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Receita</CardTitle>
                  <CardDescription>Receita por tipo de assinatura</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(subscriptionData || []).map((item) => (
                      <div key={item.status} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{item.status}</p>
                          <p className="text-sm text-muted-foreground">{item.count} assinatura(s)</p>
                        </div>
                        <p className="font-bold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.total_revenue_cents || 0) / 100)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Jornada do usuário desde o cadastro até a assinatura</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ConversionFunnel data={funnelData || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
