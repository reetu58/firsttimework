# InternHunt

Personal internship dashboard for CS students looking for 2-month tech internships in India & Remote.

## Setup (5 minutes)

1. Clone or download the project
2. Navigate to the project:
   ```bash
   cd internhunt && npm install
   ```
3. Copy `.env.local.template` to `.env.local`:
   ```bash
   cp .env.local .env.local
   ```
4. Get free API keys (all are instant and free):
   - **Adzuna**: https://developer.adzuna.com/ (instant, free)
   - **Jooble**: https://jooble.org/api/about (instant, free)
   - **Reed**: https://www.reed.co.uk/developers/jobseeker (instant, free)
   - **Google CSE**: https://developers.google.com/custom-search/v1/overview (free 100 queries/day)
5. Add your keys to `.env.local`
6. Start the dev server:
   ```bash
   npm run dev
   ```
7. Open http://localhost:3000

## Daily Usage

- Visit http://localhost:3000 every morning
- App auto-fetches at **8:00 AM IST** daily via node-cron
- Click **"Refresh Now"** anytime for a manual refresh
- CLI refresh: `curl -X POST http://localhost:3000/api/fetch-all`
- On first run (empty database), the app auto-fetches all sources immediately

## Sources (20 total)

### Group 1: Free Public APIs
1. **Remotive** - Remote software, data, devops, product jobs
2. **Arbeitnow** - Job board API with remote filter
3. **The Muse** - Software Engineer, Data Science, IT internships
4. **Jobicy** - Remote engineering & design jobs
5. **Adzuna** - India-specific job search (API key required)
6. **Jooble** - Multi-query job search (API key required)
7. **Reed** - UK-based with global remote listings (API key required)
8. **HackerNews** - Monthly "Who's Hiring" threads
9. **GitHub Lists** - Curated Summer 2026 internship repos (SimplifyJobs, Ouckah, pittcsc)
10. **Google CSE** - Custom search for internship listings (API key required)

### Group 2: India-Specific Platforms
11. **Internshala** - India's #1 internship platform (7 categories scraped)
12. **Unstop** - Engineering & CS internships
13. **TalentBattle** - Internship jobs in India
14. **Naukri** - India's largest job site
15. **Shine** - Software developer internships
16. **Fresherworld** - CS/IT/Software internships
17. **LinkedIn** - Public job listings (India + Remote)

### Group 3: Startup & Global Platforms
18. **Wellfound** (AngelList) - Startup internships (remote + India)
19. **Y Combinator** - Work at a Startup intern roles
20. **Devfolio** - Hackathon opportunities with internship conversion

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite via better-sqlite3 (zero setup)
- **Scraping**: Axios + Cheerio
- **Scheduling**: node-cron (8:00 AM IST daily)
- **Deduplication**: MD5 hash of (company + title + apply_link)

## Features

- 20 data sources fetched in parallel
- Auto-tagging: AI/ML, Web Dev, Mobile, Data, DevOps, Security, Blockchain, Open Source, Game Dev
- Location detection: India cities + Remote keywords
- Dark mode with localStorage persistence
- Bookmark internships (localStorage)
- Export saved internships to CSV
- Mobile responsive with bottom navigation
- Skeleton loading states
- Per-source error handling (one failure doesn't stop others)
- Stale data cleanup (30+ day old listings hidden)
- Fetch logs with status tracking

## One Command to Start

```bash
cd internhunt && npm install && npm run dev
```

Then open http://localhost:3000 - it will auto-fetch all sources on first load. From the next day onwards, data refreshes every morning at 8 AM automatically.

## API Endpoints

- `GET /api/internships` - Fetch internships with filters (search, location, category, stipend, sort, sources, page)
- `POST /api/fetch-all` - Trigger fetch from all sources (or single source via `{ "source": "Remotive" }`)
- `GET /api/logs` - Get fetch logs (last 7 days)
- `DELETE /api/logs` - Clear database
