import { useState } from 'react';
import { usePublicTeachers } from '@/hooks/usePublicTeachers';
import { SEOHead } from '@/components/public/SEOHead';
import { TeacherCard } from '@/components/public/TeacherCard';
import { TeacherSearch } from '@/components/public/TeacherSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const SPECIALTIES = [
  'Pole Dance',
  'Pole Fitness',
  'Pole Exotic',
  'Pole Sport',
  'Alongamento',
  'Acrobacia Aérea',
  'Lira',
  'Tecido Acrobático',
  'Flexibilidade',
  'Força e Condicionamento',
];

export default function PublicTeachers() {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [page, setPage] = useState(1);

  const { data: teachers, isLoading, error } = usePublicTeachers({
    search,
    specialty,
    page,
    limit: 12,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSpecialtyChange = (value: string) => {
    setSpecialty(value);
    setPage(1);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Professoras de Pole Dance',
    description: 'Encontre e agende aulas de pole dance com professoras especialistas',
    itemListElement: teachers?.map((teacher, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Person',
        name: teacher.name,
        description: teacher.bio,
        url: `${window.location.origin}/teachers/${teacher.slug}`,
      },
    })),
  };

  return (
    <>
      <SEOHead
        title="Encontrar Professoras de Pole Dance - Agende Aulas"
        description="Navegue pelo nosso diretório de professoras especialistas em pole dance. Encontre a instrutora perfeita para sua jornada e agende aulas."
        keywords={['professoras de pole', 'aulas de pole dance', 'pole fitness', 'agendar aulas de pole', ...SPECIALTIES]}
        ogType="website"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                  <span className="text-white font-display font-bold text-lg">P</span>
                </div>
                <span className="font-display text-xl font-bold text-gradient">Pole Planner</span>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="sm">Entrar</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-hero-pattern opacity-50" />
          
          <div className="container mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
              <Users className="h-4 w-4" />
              Diretório de Professoras
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-in animation-delay-150">
              Encontre sua{' '}
              <span className="text-gradient">Professora Ideal</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in animation-delay-300">
              Navegue pela nossa seleção de professoras especialistas em pole dance. 
              Busque por nome ou especialidade para encontrar a instrutora certa para sua jornada.
            </p>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-10 w-20 h-20 bg-primary/10 rounded-full blur-3xl animate-float" />
            <div className="absolute top-1/3 right-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-float animation-delay-300" />
          </div>
        </section>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          {/* Search */}
          <div className="mb-10 animate-fade-in">
            <TeacherSearch
              onSearch={handleSearch}
              onSpecialtyChange={handleSpecialtyChange}
              specialties={SPECIALTIES}
              currentSearch={search}
              currentSpecialty={specialty}
            />
          </div>

          {/* Results */}
          <div>
            {error ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                  <Heart className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-destructive font-medium">Falha ao carregar professoras.</p>
                <p className="text-muted-foreground mt-1">Por favor, tente novamente.</p>
              </div>
            ) : isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-xl border border-border/50 p-6 animate-shimmer">
                    <div className="h-1 w-full bg-muted rounded-full mb-6" />
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-2" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full mt-4" />
                    <div className="flex gap-2 mt-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : teachers && teachers.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {teachers.map((teacher, index) => (
                    <div 
                      key={teacher.id} 
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <TeacherCard teacher={teacher} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Página</span>
                    <span className="font-display font-semibold text-foreground">{page}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!teachers || teachers.length < 12}
                    className="gap-2"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">Nenhuma professora encontrada</h3>
                <p className="text-muted-foreground">
                  {search || specialty
                    ? 'Tente ajustar os filtros de busca'
                    : 'Volte mais tarde para ver novas professoras'}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-muted/30 mt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-display font-bold text-sm">P</span>
                </div>
                <span className="font-display font-semibold text-gradient">Pole Planner</span>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                © {new Date().getFullYear()} Pole Planner. Todos os direitos reservados.
              </p>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Feito com <Heart className="h-4 w-4 text-primary mx-1" /> para a comunidade pole
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
