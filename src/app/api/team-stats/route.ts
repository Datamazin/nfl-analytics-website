import { NextResponse } from 'next/server';
import { getTeamLeaderboard, getTeamStatsWithInfo, getTeamSeasonTrends, getTeamLeaderboardAllWeeks } from '@/lib/queries';
import type { TeamStats } from '@/types/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');
    const week = searchParams.get('week');
    const team = searchParams.get('team');
    const statField = searchParams.get('stat') as keyof TeamStats | null;
    const limit = searchParams.get('limit');

    if (!season) {
      return NextResponse.json(
        { error: 'Season is required' },
        { status: 400 }
      );
    }

    const seasonNum = parseInt(season);

    // If team is specified, return season trends for that team
    if (team) {
      const teamStats = await getTeamSeasonTrends(team, seasonNum);
      return NextResponse.json({ teamStats });
    }

    // If specific stat requested, return leaderboard for that stat
    if (statField) {
      const limitNum = limit ? parseInt(limit) : 10;
      
      // If no week specified, aggregate all weeks
      if (!week) {
        const leaderboard = await getTeamLeaderboardAllWeeks(
          seasonNum,
          statField,
          limitNum
        );
        return NextResponse.json({ leaderboard, stat: statField });
      }

      // Single week leaderboard
      const weekNum = parseInt(week);
      const leaderboard = await getTeamLeaderboard(
        seasonNum,
        weekNum,
        statField,
        limitNum
      );
      return NextResponse.json({ leaderboard, stat: statField });
    }

    // Otherwise return all team stats with team info
    if (!week) {
      return NextResponse.json(
        { error: 'Week is required when not filtering by team or stat' },
        { status: 400 }
      );
    }

    const weekNum = parseInt(week);
    const teamStats = await getTeamStatsWithInfo(seasonNum, weekNum);
    return NextResponse.json({ teamStats });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    );
  }
}
