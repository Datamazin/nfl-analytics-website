# Quick Start Guide

## Initial Setup

### 1. Add Your Supabase Credentials

Open `.env.local` and replace `your_supabase_anon_key_here` with your actual Supabase anonymous key:

```
NEXT_PUBLIC_SUPABASE_URL=https://ejjaedertynpagpvporu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_actual_anon_key>
```

To get your Supabase anon key:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "anon public" key

### 2. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Overview

### Pages Created

1. **Dashboard (`/`)**: 
   - Main landing page with season/week selectors
   - Shows top 10 teams (expandable to all 32) for:
     - Total Yards Leaders
     - Points Scored Leaders
     - Passing Yards Leaders
     - Rushing Yards Leaders
   - Automatically defaults to the most recent completed week

2. **Teams List (`/teams`)**:
   - Grid view of all NFL teams with logos
   - Click any team to view details

3. **Team Detail (`/teams/[team]`)**:
   - Individual team page with logo and info
   - Season selector
   - Weekly trend charts for:
     - Yards per game (Total, Passing, Rushing)
     - Points per game

### Components Built

- **TeamLogo**: Smart component that displays team logos from ESPN with fallback to team abbreviation
- **ExpandableBarChart**: Bar charts with "View All" accordion functionality
- **TrendLineChart**: Multi-line chart for showing trends over time
- **ChartSkeleton**: Loading state for charts

### API Routes

All API routes are in `/api/`:

- `/api/seasons`: Get available seasons and weeks
- `/api/teams`: Get all teams with branding
- `/api/team-stats`: Get team statistics with filtering
- `/api/player-stats`: Get player statistics (ready for player pages)
- `/api/schedules`: Get game schedules and results

## Next Steps

### To Add Player Pages:

1. Create `/app/players/page.tsx` for player list with search/filter
2. Create `/app/players/[playerId]/page.tsx` for individual player stats
3. Use the existing `/api/player-stats` endpoint

### To Add Play-by-Play Analysis:

1. Create `/app/play-by-play/page.tsx`
2. Create new API route `/app/api/play-by-play/route.ts`
3. Build charts for EPA, WP, WPA metrics

### Deployment to Vercel:

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists and has valid credentials
- Restart the dev server after changing env variables

### Team logos not loading
- Check Next.js config allows ESPN domain (`a.espncdn.com`)
- Logos will fallback to team abbreviation if URL fails

### No data showing in charts
- Verify Supabase database has data for the selected season/week
- Check browser console for API errors
- Verify RLS policies allow read access

## Testing

Once the server is running, test these URLs:

- Dashboard: http://localhost:3000
- Teams: http://localhost:3000/teams
- Sample Team: http://localhost:3000/teams/KC (or any team abbreviation)
- API Test: http://localhost:3000/api/teams

## Database Requirements

Your Supabase database should have:
- Tables: `teams`, `team_stats`, `player_stats`, `schedules`, `rosters`, `players`, `play_by_play`
- RLS policies allowing read access
- Data populated for at least one season

## Questions?

Check the main README.md for detailed documentation.
