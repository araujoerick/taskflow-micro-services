import { useEffect, useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskStatus, TaskPriority } from '@repo/types';
import { taskStatusLabels, taskPriorityLabels } from '@/utils/enum-mappers';

interface TaskFiltersProps {
  filters: {
    search: string;
    status: string;
    priority: string;
  };
  onFiltersChange: (filters: { search: string; status: string; priority: string }) => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handlePriorityChange = (value: string) => {
    onFiltersChange({ ...filters, priority: value });
  };

  const clearFilters = () => {
    setSearchInput('');
    onFiltersChange({ search: '', status: 'all', priority: 'all' });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.priority !== 'all';

  return (
    <div className="bg-white dark:bg-card rounded-3xl p-3 shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-black/4 dark:border-border flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar tarefas..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full border-none bg-secondary py-2.5 px-4 pl-10 rounded-full outline-none text-sm transition-all duration-200 focus:bg-white focus:shadow-[0_0_0_2px_var(--color-purple-500)] dark:focus:bg-accent"
        />
      </div>

      {/* Status Filter */}
      <Select value={filters.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-40 rounded-full border-0 bg-secondary h-10">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all" className="rounded-lg">
            Todos os Status
          </SelectItem>
          {Object.values(TaskStatus).map((status) => (
            <SelectItem key={status} value={status} className="rounded-lg">
              {taskStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={filters.priority} onValueChange={handlePriorityChange}>
        <SelectTrigger className="w-full sm:w-40 rounded-full border-0 bg-secondary h-10">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Prioridade" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all" className="rounded-lg">
            Todas Prioridades
          </SelectItem>
          {Object.values(TaskPriority).map((priority) => (
            <SelectItem key={priority} value={priority} className="rounded-lg">
              {taskPriorityLabels[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
          aria-label="Limpar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
