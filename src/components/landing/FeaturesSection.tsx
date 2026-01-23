import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, BarChart3, Clock, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description: 'Gerencie horários, bloqueios e aulas recorrentes com facilidade.',
  },
  {
    icon: Users,
    title: 'Gestão de Alunas',
    description: 'Acompanhe presença, planos e progresso de cada aluna.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Detalhados',
    description: 'Insights sobre ocupação, receita e crescimento do seu studio.',
  },
  {
    icon: Clock,
    title: 'Agendamento Online',
    description: 'Suas alunas agendam e cancelam aulas 24/7.',
  },
  {
    icon: Shield,
    title: 'Pagamentos Seguros',
    description: 'Integração com Stripe para cobranças recorrentes.',
  },
  {
    icon: Zap,
    title: 'Notificações Automáticas',
    description: 'Lembretes por WhatsApp e email para reduzir faltas.',
  },
];

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="section-padding bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="glow" className="mb-4">
            Funcionalidades
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Tudo que você precisa para{' '}
            <span className="text-gradient">crescer</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para gestão completa do seu studio, da agenda ao financeiro.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="card-hover border-border/50 bg-card/50 backdrop-blur-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
