import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ejjaedertynpagpvporu.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const season = searchParams.get('season');
    const week = searchParams.get('week');
    const limit = parseInt(searchParams.get('limit') || '32');

    if (!season) {
      return NextResponse.json({ error: 'Season is required' }, { status: 400 });
    }

    console.log(`Fetching fumbles for season ${season}, week: ${week || 'all'}`);
    
    // NOTE: The player_stats table does not have a fumbles column in the current schema
    // This endpoint returns empty data until fumbles data is available
    console.log('Fumbles data not available in player_stats table');

    return NextResponse.json({ 
      leaderboard: [],
      message: 'Fumbles data not available in current schema'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
