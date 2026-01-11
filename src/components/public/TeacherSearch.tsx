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
import { Search, X } from 'lucide-react';
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

  const hasFilters = currentSearch || currentSpecialty;

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={currentSpecialty} onValueChange={onSpecialtyChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All specialties</SelectItem>
            {specialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="shrink-0">
            <X className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
