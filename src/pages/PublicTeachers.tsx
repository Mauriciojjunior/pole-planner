import { useState } from 'react';
import { usePublicTeachers } from '@/hooks/usePublicTeachers';
import { SEOHead } from '@/components/public/SEOHead';
import { TeacherCard } from '@/components/public/TeacherCard';
import { TeacherSearch } from '@/components/public/TeacherSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
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
        title="Encontrar Professores de Pole Dance - Agende Aulas"
        description="Navegue pelo nosso diretório de professores especialistas em pole dance. Encontre a instrutora perfeita para sua jornada e agende aulas."
        keywords={['professores de pole', 'aulas de pole dance', 'pole fitness', 'agendar aulas de pole', ...SPECIALTIES]}
        ogType="website"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Cabeçalho */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-xl font-bold text-primary">
                Pole Planner
              </Link>
              <Link to="/auth">
                <Button variant="outline">Entrar</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Seção Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Users className="h-4 w-4" />
              Diretório de Professores
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Encontre sua Professora Ideal
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Navegue pela nossa seleção de professoras especialistas em pole dance. Busque por nome ou especialidade
              para encontrar a instrutora certa para sua jornada.
            </p>
          </div>
        </section>

        {/* Conteúdo Principal */}
        <main className="container mx-auto px-4 py-8">
          {/* Busca */}
          <TeacherSearch
            onSearch={handleSearch}
            onSpecialtyChange={handleSpecialtyChange}
            specialties={SPECIALTIES}
            currentSearch={search}
            currentSpecialty={specialty}
          />

          {/* Resultados */}
          <div className="mt-8">
            {error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Falha ao carregar professores. Por favor, tente novamente.</p>
              </div>
            ) : isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-lg border p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-2" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full mt-4" />
                    <Skeleton className="h-6 w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : teachers && teachers.length > 0 ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {teachers.map((teacher) => (
                    <TeacherCard key={teacher.id} teacher={teacher} />
                  ))}
                </div>

                {/* Paginação */}
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <div className="flex items-center px-4 text-sm text-muted-foreground">
                    Página {page}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!teachers || teachers.length < 12}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Nenhuma professora encontrada</h3>
                <p className="text-muted-foreground mt-1">
                  {search || specialty
                    ? 'Tente ajustar os filtros de busca'
                    : 'Volte mais tarde para ver novas professoras'}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Rodapé */}
        <footer className="border-t bg-card mt-12">
          <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pole Planner. Todos os direitos reservados.
          </div>
        </footer>
      </div>
    </>
  );
}
