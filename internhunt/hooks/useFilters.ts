'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Filters } from './useInternships';

export function useFilters() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    location: '',
    category: 'All',
    stipend: '',
    sort: 'newest',
    sources: [],
    page: 1,
  });

  const debounceTimer = useRef<NodeJS.Timeout>(undefined);

  const setSearch = useCallback((search: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search, page: 1 }));
    }, 300);
  }, []);

  const setLocation = useCallback((location: string) => {
    setFilters(prev => ({ ...prev, location, page: 1 }));
  }, []);

  const setCategory = useCallback((category: string) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  }, []);

  const setStipend = useCallback((stipend: string) => {
    setFilters(prev => ({ ...prev, stipend, page: 1 }));
  }, []);

  const setSort = useCallback((sort: string) => {
    setFilters(prev => ({ ...prev, sort, page: 1 }));
  }, []);

  const toggleSource = useCallback((source: string) => {
    setFilters(prev => {
      const sources = prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source];
      return { ...prev, sources, page: 1 };
    });
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters({ search: '', location: '', category: 'All', stipend: '', sort: 'newest', sources: [], page: 1 });
  }, []);

  const activeCount = [
    filters.search ? 1 : 0,
    filters.location ? 1 : 0,
    filters.category !== 'All' ? 1 : 0,
    filters.stipend ? 1 : 0,
    filters.sort !== 'newest' ? 1 : 0,
    filters.sources.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    filters,
    setSearch,
    setLocation,
    setCategory,
    setStipend,
    setSort,
    toggleSource,
    setPage,
    clearAll,
    activeCount,
  };
}
