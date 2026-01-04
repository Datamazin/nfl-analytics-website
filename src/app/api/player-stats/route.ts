import { NextResponse } from 'next/server';
import { getPlayerStats } from '@/lib/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');
    const week = searchParams.get('week');
    const position = searchParams.get('position');
    const team = searchParams.get('team');
    const limit = searchParams.get('limit');

    if (!season) {
      return NextResponse.json(
        { error: 'Season is required' },
        { status: 400 }
      );
    }

    const playerStats = await getPlayerStats(
      parseInt(season),
      week ? parseInt(week) : undefined,
      position || undefined,
      team || undefined,
      limit ? parseInt(limit) : undefined
    );

    return NextResponse.json({ playerStats });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
