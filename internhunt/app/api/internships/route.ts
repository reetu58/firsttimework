import { NextRequest, NextResponse } from 'next/server';
import { getInternships, getStats } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      search: searchParams.get('search') || undefined,
      location: searchParams.get('location') || undefined,
      category: searchParams.get('category') || undefined,
      stipend: searchParams.get('stipend') || undefined,
      sort: searchParams.get('sort') || undefined,
      sources: searchParams.get('sources')?.split(',').filter(Boolean) || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '24'),
    };

    const { data, total } = getInternships(filters);
    const stats = getStats();

    return NextResponse.json({
      data,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit!),
      stats,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch internships' },
      { status: 500 }
    );
  }
}
