let schedulerInitialized = false;

export function initScheduler() {
  if (schedulerInitialized || typeof window !== 'undefined') return;
  schedulerInitialized = true;

  try {
    const cron = require('node-cron');
    // 8:00 AM IST = 2:30 AM UTC
    cron.schedule('30 2 * * *', async () => {
      console.log(`[${new Date().toISOString()}] Starting daily fetch...`);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/fetch-all`, { method: 'POST' });
        console.log(`[${new Date().toISOString()}] Daily fetch complete`);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Daily fetch failed:`, err);
      }
    });
    console.log('[InternHunt] Scheduler initialized - daily fetch at 8:00 AM IST');
  } catch (err) {
    console.error('Failed to initialize scheduler:', err);
  }
}
