'use client';

import { useState, useEffect, useCallback } from 'react';

export interface InternshipData {
  id: number;
  title: string;
  company: string;
  location: string;
  is_remote: number;
  is_india: number;
  duration: string;
  stipend: string;
  apply_link: string;
  source: string;
  posted_date: string;
  deadline: string;
  tags: string;
  is_active: number;
  fetched_at: string;
  hash: string;
}

export interface Stats {
  total: number;
  today: number;
  remote: number;
  india: number;
}

export interface Filters {
  search: string;
  location: string;
  category: string;
  stipend: string;
  sort: string;
  sources: string[];
  page: number;
}

export function useInternships(filters: Filters) {
  const [data, setData] = useState<InternshipData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, remote: 0, india: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.location) params.set('location', filters.location);
      if (filters.category && filters.category !== 'All') params.set('category', filters.category);
      if (filters.stipend) params.set('stipend', filters.stipend);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.sources.length > 0) params.set('sources', filters.sources.join(','));
      params.set('page', String(filters.page));

      const res = await fetch(`/api/internships?${params.toString()}`);
      const json = await res.json();

      if (json.error) throw new Error(json.error);

      setData(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 0);
      setStats(json.stats || { total: 0, today: 0, remote: 0, india: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.location, filters.category, filters.stipend, filters.sort, filters.sources.join(','), filters.page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, total, totalPages, stats, loading, error, refetch: fetchData };
}
