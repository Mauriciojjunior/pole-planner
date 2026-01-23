import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

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
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    description: 'Para múltiplos studios',
    features: [
      'Tudo do Profissional',
      'Multi-studios',
      'API personalizada',
      'Gerente de conta dedicado',
      'SLA garantido',
    ],
    cta: 'Fale Conosco',
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="precos" className="section-padding bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="glow" className="mb-4">
            <Sparkles className="mr-2 h-3 w-3" />
            Preços
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Planos que cabem no seu{' '}
            <span className="text-gradient">bolso</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o tamanho do seu studio. Cancele quando quiser.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative card-hover ${plan.popular ? 'border-primary shadow-glow' : 'border-border/50'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="gold" className="shadow-lg">
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button 
                    variant={plan.popular ? 'gradient' : 'outline'} 
                    className="w-full"
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
