import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart } from 'lucide-react';

const testimonials = [
  {
    name: 'Marina Silva',
    role: 'Pole Fitness Studio - São Paulo',
    content: 'Transformou a gestão do meu studio. Menos trabalho administrativo, mais tempo para ensinar.',
    rating: 5,
  },
  {
    name: 'Carla Santos',
    role: 'Exotic Pole Dance - Rio de Janeiro',
    content: 'Minhas alunas adoram poder agendar online. A taxa de faltas diminuiu 40%!',
    rating: 5,
  },
  {
    name: 'Juliana Costa',
    role: 'Studio Aéreos - Belo Horizonte',
    content: 'Os relatórios me ajudaram a entender melhor meu negócio e crescer de forma sustentável.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="section-padding">
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
  );
}
