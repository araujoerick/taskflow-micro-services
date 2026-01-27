import { useEffect, useState } from 'react';
import { Search, X, Filter, LayoutGrid, Columns3 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskStatus, TaskPriority } from '@repo/types';
import { taskStatusLabels, taskPriorityLabels } from '@/utils/enum-mappers';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'kanban';

interface TaskFiltersProps {
  filters: {
    search: string;
    status: string;
    priority: string;
  };
  onFiltersChange: (filters: { search: string; status: string; priority: string }) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function TaskFilters({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
}: TaskFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isExpanded, setIsExpanded] = useState(false);

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
    setIsExpanded(false);
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.priority !== 'all';
  const hasActiveSelectFilters = filters.status !== 'all' || filters.priority !== 'all';

  return (
    <div className="bg-white dark:bg-card rounded-3xl p-3 shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-black/4 dark:border-border">
      {/* Search Row */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border-none bg-secondary py-2.5 px-4 pl-10 rounded-full outline-none text-sm transition-all duration-200 focus:bg-white focus:shadow-[0_0_0_2px_var(--color-purple-500)] dark:focus:bg-accent"
          />
        </div>

        {/* Filter Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-colors relative shrink-0',
            isExpanded
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80',
          )}
          aria-label={isExpanded ? 'Recolher filtros' : 'Expandir filtros'}
        >
          <Filter className="h-4 w-4" />
          {hasActiveSelectFilters && !isExpanded && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
          )}
        </button>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-secondary rounded-full p-1 shrink-0">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Visualização em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
              viewMode === 'kanban'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Visualização Kanban"
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable Filters */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0',
        )}
      >
        <div className="flex flex-col gap-3">
          {/* Status Filter */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full rounded-full border-0 bg-secondary h-10">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.values(TaskStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {taskStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={filters.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-full rounded-full border-0 bg-secondary h-10">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Prioridade" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todas Prioridades</SelectItem>
              {Object.values(TaskPriority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {taskPriorityLabels[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center gap-2 transition-colors text-sm font-medium dark:bg-red-950 dark:hover:bg-red-900"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
