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

    // Fetch team branding info
    const teamNames = leaderboard.map(t => t.team);
    const { data: teams } = await supabase
      .from('teams')
      .select('team_abbr, team_name, team_logo_espn, team_color')
      .in('team_abbr', teamNames);

    // Create team lookup
    const teamLookup = new Map();
    if (teams) {
      for (const team of teams) {
        teamLookup.set(team.team_abbr, team);
      }
    }

    // Format leaderboard
    const formattedLeaderboard = leaderboard.map(item => {
      const teamInfo = teamLookup.get(item.team) || {};
      return {
        team: item.team,
        team_name: teamInfo.team_name || item.team,
        team_logo_espn: teamInfo.team_logo_espn,
        team_color: teamInfo.team_color,
        value: item.fumbles
      };
    });

    console.log(`Fumbles leaderboard: ${formattedLeaderboard.length} teams`);

    return NextResponse.json({ 
      leaderboard: formattedLeaderboard
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
