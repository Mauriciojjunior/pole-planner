import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';

interface TeacherCardProps {
  teacher: {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    avatar_url: string | null;
    specialties: string[] | null;
    timezone: string | null;
    price_cents: number | null;
    currency: string | null;
    is_price_public: boolean;
  };
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/10">
            <AvatarImage src={teacher.avatar_url || undefined} alt={teacher.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getInitials(teacher.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
              {teacher.name}
            </h3>
            {teacher.timezone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{teacher.timezone}</span>
              </div>
            )}
          </div>
        </div>

        {teacher.bio && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
            {teacher.bio}
          </p>
        )}

        {teacher.specialties && teacher.specialties.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {teacher.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {teacher.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{teacher.specialties.length - 3}
              </Badge>
            )}
          </div>
        )}

        {teacher.is_price_public && teacher.price_cents && teacher.currency && (
          <div className="mt-4 text-lg font-semibold text-primary">
            {formatPrice(teacher.price_cents, teacher.currency)}
            <span className="text-sm font-normal text-muted-foreground">/class</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full" variant="outline">
          <Link to={`/teachers/${teacher.slug}`}>
            <Calendar className="mr-2 h-4 w-4" />
            View Schedule
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
