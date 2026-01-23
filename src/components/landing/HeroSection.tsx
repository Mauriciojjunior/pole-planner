import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Shield, Zap, Heart, ChevronRight } from 'lucide-react';

export function HeroSection() {
  return (
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
                Comece Gratuitamente
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
  );
}
