import { NextResponse } from 'next/server';
import { fetchAll, fetchSingle } from '@/lib/scrapers';
import { initScheduler } from '@/lib/scheduler';

// Initialize scheduler on first API call
initScheduler();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const source = body?.source;

    let result;
    if (source) {
      result = await fetchSingle(source);
    } else {
      result = await fetchAll();
    }

    return NextResponse.json({
      success: true,
      totalAdded: result.totalAdded,
      totalSkipped: result.totalSkipped,
      results: result.results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Fetch failed' },
      { status: 500 }
    );
  }
}
