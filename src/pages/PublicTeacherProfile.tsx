import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicTeacherProfile } from '@/hooks/usePublicTeachers';
import { usePublicAvailability } from '@/hooks/usePublicAvailability';
import { SEOHead } from '@/components/public/SEOHead';
import { AvailabilityCalendar } from '@/components/public/AvailabilityCalendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { addDays, startOfDay } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  Phone,
} from 'lucide-react';

export default function PublicTeacherProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [dateRange, setDateRange] = useState({
    startDate: startOfDay(new Date()),
    endDate: addDays(startOfDay(new Date()), 14),
  });

  const { data: profileData, isLoading: profileLoading, error: profileError } = usePublicTeacherProfile(slug || '');

  const teacher = profileData?.teacher;
  const classTypes = profileData?.classTypes || [];

  const { data: availability, isLoading: availabilityLoading } = usePublicAvailability({
    teacherId: teacher?.id || '',
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const handleDateChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100);
  };

  if (profileError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Professora Não Encontrada</h1>
          <p className="text-muted-foreground mt-2">Este perfil não existe ou não está disponível.</p>
          <Button asChild className="mt-4">
            <Link to="/teachers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às Professoras
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const jsonLd = teacher
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: teacher.name,
        description: teacher.bio,
        url: window.location.href,
        image: teacher.avatar_url,
        jobTitle: 'Professora de Pole Dance',
        knowsAbout: teacher.specialties,
      }
    : undefined;

  return (
    <>
      {teacher && (
        <SEOHead
          title={`${teacher.name} - Agendar Aulas`}
          description={teacher.bio || `Agende aulas com ${teacher.name}. Veja horários disponíveis e marque sua sessão.`}
          keywords={teacher.specialties || []}
          ogImage={teacher.avatar_url}
          ogType="profile"
          jsonLd={jsonLd}
        />
      )}

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

        <main className="container mx-auto px-4 py-8">
          {/* Botão Voltar */}
          <Link
            to="/teachers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar às Professoras
          </Link>

          {profileLoading ? (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Skeleton className="h-24 w-24 rounded-full" />
                      <Skeleton className="h-6 w-40 mt-4" />
                      <Skeleton className="h-4 w-32 mt-2" />
                      <Skeleton className="h-20 w-full mt-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Skeleton className="h-[500px] w-full" />
              </div>
            </div>
          ) : teacher ? (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Card do Perfil */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                        <AvatarImage src={teacher.avatar_url || undefined} alt={teacher.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                          {getInitials(teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                      <h1 className="text-2xl font-bold mt-4">{teacher.name}</h1>
                      
                      {teacher.timezone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                          <Globe className="h-4 w-4" />
                          {teacher.timezone}
                        </div>
                      )}

                      {teacher.bio && (
                        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                          {teacher.bio}
                        </p>
                      )}

                      {teacher.specialties && teacher.specialties.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                          {teacher.specialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {teacher.price_cents && teacher.currency && (
                        <div className="mt-6 p-4 rounded-lg bg-primary/5 w-full">
                          <div className="text-2xl font-bold text-primary">
                            {formatPrice(teacher.price_cents, teacher.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">por aula</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Informações de Contato (para alunos matriculados) */}
                {profileData?.access_level === 'enrolled' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informações de Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {teacher.email && (
                        <a
                          href={`mailto:${teacher.email}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-4 w-4" />
                          {teacher.email}
                        </a>
                      )}
                      {teacher.phone && (
                        <a
                          href={`tel:${teacher.phone}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-4 w-4" />
                          {teacher.phone}
                        </a>
                      )}
                      {teacher.portfolio_url && (
                        <a
                          href={teacher.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Portfólio
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tipos de Aula */}
                {classTypes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tipos de Aula</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {classTypes.map((classType: { id: string; name: string; description: string | null; duration_minutes: number; max_students: number; color: string | null }) => (
                        <div
                          key={classType.id}
                          className="p-3 rounded-lg border"
                          style={{
                            borderLeftColor: classType.color || 'hsl(var(--primary))',
                            borderLeftWidth: '3px',
                          }}
                        >
                          <div className="font-medium">{classType.name}</div>
                          {classType.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {classType.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {classType.duration_minutes} min
                            </span>
                            <span>Máx {classType.max_students} alunas</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Disponibilidade */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Disponibilidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AvailabilityCalendar
                      slots={availability || []}
                      isLoading={availabilityLoading}
                      onDateChange={handleDateChange}
                    />

                    <div className="mt-6 text-center">
                      <Button asChild size="lg">
                        <Link to="/auth">
                          Entre para Agendar uma Aula
                        </Link>
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Crie uma conta ou entre para agendar aulas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
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
