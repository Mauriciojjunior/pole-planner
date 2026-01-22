import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface TeacherSearchProps {
  onSearch: (search: string) => void;
  onSpecialtyChange: (specialty: string) => void;
  specialties: string[];
  currentSearch: string;
  currentSpecialty: string;
}

export function TeacherSearch({
  onSearch,
  onSpecialtyChange,
  specialties,
  currentSearch,
  currentSpecialty,
}: TeacherSearchProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  const debouncedSearch = useDebounce((value: string) => {
    onSearch(value);
  }, 300);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const clearSearch = () => {
    setSearchInput('');
    onSearch('');
  };

  const clearFilters = () => {
    setSearchInput('');
    onSearch('');
    onSpecialtyChange('');
  };

  const handleSpecialtyChange = (value: string) => {
    onSpecialtyChange(value === '__all__' ? '' : value);
  };

  const hasFilters = currentSearch || currentSpecialty;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filtrar Professoras</span>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-11 pr-10 bg-background/50"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={currentSpecialty || '__all__'} onValueChange={handleSpecialtyChange}>
            <SelectTrigger className="w-full sm:w-[220px] bg-background/50">
              <SelectValue placeholder="Todas as especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as especialidades</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button 
              variant="ghost" 
              onClick={clearFilters} 
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
