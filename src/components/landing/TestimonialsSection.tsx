import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    name: 'Marina Silva',
    role: 'Pole Fitness Studio',
    location: 'São Paulo, SP',
    content: 'Transformou a gestão do meu studio. Menos trabalho administrativo, mais tempo para ensinar e conectar com minhas alunas.',
    rating: 5,
    avatar: null,
  },
  {
    name: 'Carla Santos',
    role: 'Exotic Pole Dance',
    location: 'Rio de Janeiro, RJ',
    content: 'Minhas alunas adoram poder agendar online a qualquer hora. A taxa de faltas diminuiu 40% desde que começamos a usar!',
    rating: 5,
    avatar: null,
  },
  {
    name: 'Juliana Costa',
    role: 'Studio Aéreos',
    location: 'Belo Horizonte, MG',
    content: 'Os relatórios me ajudaram a entender melhor meu negócio. Consegui crescer de forma sustentável e dobrar minha receita.',
    rating: 5,
    avatar: null,
  },
];

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="section-padding bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 badge-gold">
            <Star className="mr-2 h-3.5 w-3.5 fill-accent text-accent" />
            Depoimentos
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Amado por{' '}
            <span className="text-gradient">instrutoras</span>{' '}
            do Brasil
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Veja o que profissionais do pole estão dizendo sobre a plataforma.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name} 
              className="card-elevated relative"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-6 pt-8">
                {/* Quote Icon */}
                <div className="absolute -top-4 left-6">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Quote className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                    <AvatarImage src={testimonial.avatar || undefined} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-2">Mais de 500 studios confiam no Pole Agenda</p>
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-accent text-accent" />
            ))}
            <span className="ml-2 font-semibold text-foreground">4.9/5</span>
            <span className="text-muted-foreground ml-1">(500+ avaliações)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
