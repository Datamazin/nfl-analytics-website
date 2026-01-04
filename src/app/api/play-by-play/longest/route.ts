import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');
    const week = searchParams.get('week');
    const type = searchParams.get('type'); // 'pass' or 'rush'
    const limit = searchParams.get('limit');
    const mode = searchParams.get('mode'); // 'team' or 'player'

    if (!season || !type) {
      return NextResponse.json(
        { error: 'Season and type are required' },
        { status: 400 }
      );
    }

    const seasonNum = parseInt(season);
    const limitNum = limit ? parseInt(limit) : 10;
    const isPlayerMode = mode === 'player';

    // Build query based on play type
    let query = supabase
      .from('play_by_play')
      .select('posteam, yards_gained, passer_player_name, rusher_player_name, receiver_player_name, desc, play_type')
      .eq('season', seasonNum)
      .not('yards_gained', 'is', null)
      .gt('yards_gained', 0);

    if (week) {
      query = query.eq('week', parseInt(week));
    }

    // Filter by play type - be more lenient with the filtering
    if (type === 'pass') {
      query = query.not('passer_player_name', 'is', null);
    } else if (type === 'rush') {
      query = query.not('rusher_player_name', 'is', null);
    }

    query = query.order('yards_gained', { ascending: false });

    const { data: plays, error } = await query.limit(10000); // Increased limit for better coverage

    if (error) {
      console.error('Error fetching longest plays:', error);
      throw error;
    }

    console.log(`Fetched ${plays?.length || 0} plays for ${type} in season ${seasonNum}`);
    
    // Log play types to see what's in the data
    if (plays && plays.length > 0) {
      const playTypes = new Set(plays.map(p => p.play_type).filter(Boolean));
      console.log('Play types found:', Array.from(playTypes));
      console.log('Sample play:', plays[0]);
    }

    if (!plays || plays.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    if (isPlayerMode) {
      // Aggregate by player
      const playerLongest = new Map<string, { yards: number, team: string, desc: string }>();

      for (const play of plays) {
        const team = play.posteam;
        const yards = play.yards_gained;
        const player = type === 'pass' ? play.passer_player_name : play.rusher_player_name;

        if (!player || !yards || yards <= 0) continue;

        const key = `${player}-${team || ''}`; // Include team to differentiate same-name players
        if (!playerLongest.has(key) || playerLongest.get(key)!.yards < yards) {
          playerLongest.set(key, { yards, team: team || '', desc: play.desc || '' });
        }
      }

      console.log(`Aggregated ${playerLongest.size} players from ${plays.length} plays`);

      // Convert to leaderboard format
      const leaderboard = Array.from(playerLongest.entries()).map(([key, data]) => {
        const player = key.split('-')[0]; // Extract player name
        return {
          player,
          team: data.team,
          value: data.yards,
          description: data.desc
        };
      });

      // Sort by longest and limit
      const sortedLeaderboard = leaderboard
        .sort((a, b) => b.value - a.value)
        .slice(0, limitNum);

      console.log(`Returning ${sortedLeaderboard.length} player records`);
      return NextResponse.json({ leaderboard: sortedLeaderboard });
    }

    // Team mode - aggregate by team to find longest play per team
    const teamLongest = new Map<string, { yards: number, player: string, desc: string }>();

    for (const play of plays) {
      const team = play.posteam;
      const yards = play.yards_gained;
      const player = type === 'pass' ? play.passer_player_name : play.rusher_player_name;

      if (!team || !yards || yards <= 0) continue;

      if (!teamLongest.has(team) || teamLongest.get(team)!.yards < yards) {
        teamLongest.set(team, { yards, player: player || 'Unknown', desc: play.desc || '' });
      }
    }

    console.log(`Aggregated ${teamLongest.size} teams from ${plays.length} plays`);
    
    // Log some sample data
    const sampleTeams = Array.from(teamLongest.entries()).slice(0, 5);
    console.log('Sample team data:', sampleTeams);

    // Get team info
    const { data: teams } = await supabase
      .from('teams')
      .select('team_abbr, team_name, team_logo_espn, team_color');

    const teamsMap = new Map(teams?.map(t => [t.team_abbr, t]) || []);

    // Convert to leaderboard format
    const leaderboard = Array.from(teamLongest.entries()).map(([team, data]) => {
      const teamInfo = teamsMap.get(team);
      return {
        team,
        team_name: teamInfo?.team_name || null,
        team_logo_espn: teamInfo?.team_logo_espn || null,
        team_color: teamInfo?.team_color || null,
        value: data.yards,
        player: data.player,
        description: data.desc
      };
    });

    // Sort by longest and limit
    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.value - a.value)
      .slice(0, limitNum);

    console.log(`Returning ${sortedLeaderboard.length} team records`);

    return NextResponse.json({ leaderboard: sortedLeaderboard });
  } catch (error) {
    console.error('Error fetching longest plays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch longest plays' },
      { status: 500 }
    );
  }
}
