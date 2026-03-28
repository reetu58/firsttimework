'use client';

import { useState, useEffect, useCallback } from 'react';
import { InternshipData } from './useInternships';

const STORAGE_KEY = 'internhunt_saved';

export function useSaved() {
  const [saved, setSaved] = useState<InternshipData[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSaved(JSON.parse(stored));
      } catch {
        setSaved([]);
      }
    }
  }, []);

  const toggleSave = useCallback((internship: InternshipData) => {
    setSaved(prev => {
      const exists = prev.some(s => s.id === internship.id);
      const next = exists ? prev.filter(s => s.id !== internship.id) : [...prev, internship];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback((id: number) => {
    return saved.some(s => s.id === id);
  }, [saved]);

  const clearAll = useCallback(() => {
    setSaved([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportCsv = useCallback(() => {
    if (saved.length === 0) return;
    const headers = ['Title', 'Company', 'Location', 'Stipend', 'Duration', 'Source', 'Apply Link'];
    const rows = saved.map(s => [s.title, s.company, s.location, s.stipend, s.duration, s.source, s.apply_link]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'internhunt-saved.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, [saved]);

  return { saved, toggleSave, isSaved, clearAll, exportCsv };
}
