import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Users, Star, CheckCircle } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <Badge variant="secondary" className="mb-6 animate-fade-in px-4 py-1.5">
            <Star className="mr-2 h-3.5 w-3.5 text-accent fill-accent" />
            Plataforma #1 para studios de pole no Brasil
          </Badge>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in animation-delay-150">
            Agendamento e vitrine{' '}
            <span className="text-gradient">para pole dancers</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in animation-delay-300">
            Encontre aulas que combinam com você ou gerencie seu studio com facilidade. 
            Agende sua primeira aula em 2 passos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in animation-delay-500">
            <Link to="/auth">
              <Button size="xl" className="w-full sm:w-auto shadow-warm animate-glow-pulse">
                Agendar Aula
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Começar Grátis como Professora
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground animate-fade-in animation-delay-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>Setup em 5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>+500 studios ativos</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in animation-delay-700">
          <div className="text-center p-6 rounded-2xl bg-card border border-border/50 shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">500+</div>
            <div className="text-sm text-muted-foreground">Studios ativos</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card border border-border/50 shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">15k+</div>
            <div className="text-sm text-muted-foreground">Alunas cadastradas</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card border border-border/50 shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">50k+</div>
            <div className="text-sm text-muted-foreground">Aulas agendadas</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card border border-border/50 shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">4.9</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" /> Avaliação
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
