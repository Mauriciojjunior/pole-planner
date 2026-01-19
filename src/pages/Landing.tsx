import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/public/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Shield,
  Star,
  Users,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Agendamento Fácil',
    description: 'Agende aulas com apenas alguns cliques. Veja disponibilidade em tempo real.',
  },
  {
    icon: Users,
    title: 'Professores Qualificados',
    description: 'Conecte-se com professores verificados e experientes em diversas áreas.',
  },
  {
    icon: Clock,
    title: 'Horários Flexíveis',
    description: 'Encontre aulas que se encaixam na sua agenda, a qualquer hora do dia.',
  },
  {
    icon: Shield,
    title: 'Plataforma Segura',
    description: 'Seus dados são protegidos com segurança de nível empresarial.',
  },
  {
    icon: Zap,
    title: 'Confirmação Instantânea',
    description: 'Receba confirmação imediata de reserva e lembretes.',
  },
  {
    icon: GraduationCap,
    title: 'Acompanhe seu Progresso',
    description: 'Monitore sua jornada de aprendizado com histórico detalhado.',
  },
];

const testimonials = [
  {
    name: 'Maria S.',
    role: 'Aluna',
    content: 'Encontrei uma professora incrível de yoga e agendei minha primeira aula em minutos!',
    rating: 5,
  },
  {
    name: 'João D.',
    role: 'Professor',
    content: 'Gerenciar minha agenda nunca foi tão fácil. Adoro a automação!',
    rating: 5,
  },
  {
    name: 'Ana R.',
    role: 'Aluna',
    content: 'O calendário de disponibilidade torna muito fácil encontrar o horário certo.',
    rating: 5,
  },
];

export default function Landing() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ClassBook',
    description: 'Agende aulas com professores especialistas online',
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
        title="ClassBook - Agende Aulas com Professores Especialistas"
        description="Encontre e agende aulas com professores especialistas online. Agendamento fácil, disponibilidade em tempo real e confirmação instantânea. Comece a aprender hoje!"
        keywords={[
          'aulas online',
          'agendar aulas',
          'encontrar professores',
          'tutoria online',
          'agendamento de aulas',
          'aulas particulares',
        ]}
        ogType="website"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Navegação */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <nav className="flex h-16 items-center justify-between">
              <Link to="/" className="text-xl font-bold text-primary">
                ClassBook
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  to="/teachers"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Encontrar Professores
                </Link>
                <Link to="/auth">
                  <Button>Começar</Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Seção Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/5 to-background py-20 sm:py-32">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container relative mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Star className="h-4 w-4 fill-primary" />
              Mais de 10.000 alunos satisfeitos
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Aprenda com os{' '}
              <span className="text-primary">Melhores Professores</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Encontre professores especialistas, veja disponibilidade em tempo real e agende
              aulas instantaneamente. Sua jornada de aprendizado começa aqui.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/teachers">
                  <Users className="mr-2 h-5 w-5" />
                  Ver Professores
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/auth">
                  Seja um Professor
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Seção de Recursos */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Tudo o que Você Precisa para Aprender
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Nossa plataforma facilita encontrar professores, agendar aulas e acompanhar seu progresso.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="py-20 sm:py-32 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Como Funciona
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Comece em três passos simples
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Encontre um Professor', description: 'Navegue pelo nosso diretório e encontre o professor ideal para seus objetivos.' },
                { step: '2', title: 'Veja a Disponibilidade', description: 'Veja agendas em tempo real e encontre horários que funcionem para você.' },
                { step: '3', title: 'Agende e Aprenda', description: 'Confirme sua reserva e comece sua jornada de aprendizado.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                O Que Nossos Usuários Dizem
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Junte-se a milhares de alunos e professores satisfeitos
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-foreground">&quot;{testimonial.content}&quot;</p>
                    <div className="mt-4 pt-4 border-t">
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção CTA */}
        <section className="py-20 sm:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pronto para Começar a Aprender?
            </h2>
            <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
              Junte-se à nossa comunidade de alunos e professores hoje. É grátis para começar.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="text-base px-8">
                <Link to="/teachers">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Encontrar Professores
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/auth">
                  Criar Conta
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="border-t bg-card">
          <div className="container mx-auto px-4 py-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="text-xl font-bold text-primary mb-4">ClassBook</div>
                <p className="text-sm text-muted-foreground">
                  A maneira mais fácil de encontrar e agendar aulas com professores especialistas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Plataforma</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/teachers" className="hover:text-foreground transition-colors">Encontrar Professores</Link></li>
                  <li><Link to="/auth" className="hover:text-foreground transition-colors">Seja um Professor</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Central de Ajuda</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Fale Conosco</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} ClassBook. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
