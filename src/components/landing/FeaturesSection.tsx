import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Clock, 
  CreditCard, 
  Bell,
  Smartphone,
  Globe,
  Star
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description: 'Gerencie horários, bloqueios e aulas recorrentes com facilidade. Visualize seu dia em segundos.',
    color: 'primary',
  },
  {
    icon: Users,
    title: 'Gestão de Alunas',
    description: 'Acompanhe presença, planos ativos e o progresso de cada aluna em um só lugar.',
    color: 'sage',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Completos',
    description: 'Insights sobre ocupação, receita e crescimento. Tome decisões baseadas em dados.',
    color: 'gold',
  },
  {
    icon: Clock,
    title: 'Agendamento 24/7',
    description: 'Suas alunas agendam e cancelam aulas quando quiserem, sem precisar te chamar.',
    color: 'primary',
  },
  {
    icon: CreditCard,
    title: 'Pagamentos Integrados',
    description: 'Cobranças recorrentes com Stripe. Menos inadimplência, mais previsibilidade.',
    color: 'sage',
  },
  {
    icon: Bell,
    title: 'Lembretes Automáticos',
    description: 'Notificações por WhatsApp e email reduzem faltas em até 40%.',
    color: 'gold',
  },
];

const benefits = [
  {
    icon: Globe,
    title: 'Perfil Público',
    description: 'Vitrine profissional para atrair novas alunas e mostrar seu trabalho.',
  },
  {
    icon: Smartphone,
    title: '100% Mobile',
    description: 'Funciona perfeitamente em qualquer dispositivo, a qualquer hora.',
  },
  {
    icon: Star,
    title: 'Avaliações',
    description: 'Receba feedback das alunas e construa sua reputação.',
  },
];

const getIconContainerClass = (color: string) => {
  switch (color) {
    case 'sage':
      return 'icon-container-sage';
    case 'gold':
      return 'icon-container-gold';
    default:
      return 'icon-container';
  }
};

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="section-padding">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 badge-primary">
            Como Funciona
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Tudo que você precisa para{' '}
            <span className="text-gradient">crescer</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Ferramentas poderosas para gestão completa do seu studio, da agenda ao financeiro.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-20">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="card-elevated group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className={`${getIconContainerClass(feature.color)} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Banner */}
        <div className="bg-muted/50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-10">
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-3">
              Benefícios para Professoras
            </h3>
            <p className="text-muted-foreground">
              Mais que uma agenda: uma plataforma completa para seu negócio.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
