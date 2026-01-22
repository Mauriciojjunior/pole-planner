import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/public/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Star, 
  ArrowRight, 
  Sparkles, 
  Heart,
  Clock,
  Shield,
  Zap,
  ChevronRight
} from 'lucide-react';

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

const testimonials = [
  {
    name: 'Marina Silva',
    role: 'Pole Fitness Studio',
    content: 'Transformou a gestão do meu studio. Menos trabalho administrativo, mais tempo para ensinar.',
    rating: 5,
  },
  {
    name: 'Carla Santos',
    role: 'Exotic Pole Dance',
    content: 'Minhas alunas adoram poder agendar online. A taxa de faltas diminuiu 40%!',
    rating: 5,
  },
  {
    name: 'Juliana Costa',
    role: 'Studio Aéreos SP',
    content: 'Os relatórios me ajudaram a entender melhor meu negócio e crescer de forma sustentável.',
    rating: 5,
  },
];

export default function Landing() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pole Planner',
    description: 'Agende aulas de pole dance com professoras especialistas',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1000',
    },
  };

  return (
    <>
      <SEOHead
        title="Pole Planner - Agende Aulas de Pole Dance"
        description="Encontre e agende aulas de pole dance com professoras especialistas. Agendamento fácil, disponibilidade em tempo real e confirmação instantânea. Comece sua jornada hoje!"
        keywords={[
          'pole dance',
          'aulas de pole',
          'professora de pole dance',
          'pole fitness',
          'agendamento de aulas',
          'aulas particulares',
        ]}
        ogType="website"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <header className="sticky top-0 z-50 glass border-b">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
                  <span className="text-white font-display font-bold text-lg">P</span>
                </div>
                <span className="font-display text-xl font-bold text-gradient">Pole Planner</span>
              </Link>

              <nav className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
                  Funcionalidades
                </a>
                <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
                  Depoimentos
                </a>
                <Link to="/teachers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
                  Encontrar Professoras
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Entrar</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="gradient" size="sm" className="hidden sm:flex">
                    Começar Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 bg-hero-pattern opacity-50" />
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-300" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-magenta/10 rounded-full blur-3xl animate-float animation-delay-500" />

          <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="glow" className="mb-6 animate-fade-in">
                <Sparkles className="mr-2 h-3 w-3" />
                A plataforma #1 para studios de pole
              </Badge>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in animation-delay-150">
                Gerencie seu{' '}
                <span className="text-gradient">Studio de Pole</span>{' '}
                com elegância
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in animation-delay-300">
                Simplifique agendamentos, gerencie alunas e cresça seu negócio. 
                Tudo em uma plataforma feita especialmente para o mundo pole.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animation-delay-500">
                <Link to="/auth">
                  <Button variant="gradient" size="xl" className="w-full sm:w-auto shadow-glow animate-pulse-glow">
                    Seja uma Instrutora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/teachers">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Encontrar Professoras
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in animation-delay-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Dados protegidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Setup em 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>+500 studios ativos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronRight className="h-6 w-6 text-muted-foreground rotate-90" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section-padding bg-muted/30">
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

        {/* Testimonials Section */}
        <section id="testimonials" className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="glow" className="mb-4">
                <Heart className="mr-2 h-3 w-3" />
                Depoimentos
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Amado por{' '}
                <span className="text-gradient">instrutoras</span>{' '}
                por todo Brasil
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Veja o que profissionais do pole estão dizendo sobre o Pole Planner.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={testimonial.name} 
                  className="card-hover border-border/50"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="text-foreground mb-4 leading-relaxed">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-display font-bold">
                        {testimonial.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-16">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-hero-pattern opacity-10" />
              
              <div className="relative text-center">
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                  Pronta para transformar seu studio?
                </h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                  Junte-se a centenas de profissionais que já estão usando o Pole Planner para crescer seus negócios.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/auth">
                    <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                      Começar Gratuitamente
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/teachers">
                    <Button 
                      size="xl" 
                      variant="outline" 
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      Ver Professoras
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-display font-bold text-sm">P</span>
                </div>
                <span className="font-display font-semibold text-gradient">Pole Planner</span>
              </div>
              
              <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
                <a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a>
                <Link to="/teachers" className="hover:text-foreground transition-colors">Professoras</Link>
              </nav>
              
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Pole Planner. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
