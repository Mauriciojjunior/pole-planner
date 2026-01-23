import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ArrowRight, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Grátis',
    description: 'Perfeito para começar',
    features: [
      'Até 10 alunas',
      'Agenda básica',
      'Perfil público',
      'Suporte por email',
    ],
    cta: 'Começar Grátis',
    popular: false,
    color: 'default',
  },
  {
    name: 'Profissional',
    price: 'R$ 79',
    period: '/mês',
    description: 'Para studios em crescimento',
    features: [
      'Alunas ilimitadas',
      'Agenda avançada',
      'Relatórios completos',
      'Notificações WhatsApp',
      'Pagamentos integrados',
      'Suporte prioritário',
    ],
    cta: 'Teste 14 dias grátis',
    popular: true,
    color: 'primary',
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    description: 'Para múltiplos studios',
    features: [
      'Tudo do Profissional',
      'Multi-studios',
      'API personalizada',
      'Gerente de conta',
      'SLA garantido',
    ],
    cta: 'Fale Conosco',
    popular: false,
    color: 'gold',
  },
];

export function PricingSection() {
  return (
    <section id="precos" className="section-padding">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 badge-sage">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Preços
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Planos que cabem no seu{' '}
            <span className="text-gradient">bolso</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Escolha o plano ideal para o tamanho do seu studio. Cancele quando quiser.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary shadow-warm scale-[1.02] md:scale-105' 
                  : 'border-border/50 hover:border-primary/30 hover:shadow-lg'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground shadow-lg px-4">
                    <Crown className="mr-1.5 h-3.5 w-3.5" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="font-display text-xl mb-1">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6">
                  <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-primary' : 'text-secondary'}`} />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/auth" className="block">
                  <Button 
                    variant={plan.popular ? 'default' : 'outline'} 
                    className={`w-full ${plan.popular ? 'shadow-warm' : ''}`}
                    size="lg"
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Message */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Todos os planos incluem SSL, backups diários e suporte técnico.
        </p>
      </div>
    </section>
  );
}
