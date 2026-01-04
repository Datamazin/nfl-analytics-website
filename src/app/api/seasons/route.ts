import { NextResponse } from 'next/server';
import { getSeasons, getWeeksBySeason, getMostRecentCompletedWeek } from '@/lib/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');

    // If season is provided, return weeks for that season
    if (season) {
      const weeks = await getWeeksBySeason(parseInt(season));
      return NextResponse.json({ weeks });
    }

    // Otherwise, return all seasons and most recent completed week
    const seasons = await getSeasons();
    console.log('Fetched seasons:', seasons);
    
    let mostRecent = null;
    
    try {
      mostRecent = await getMostRecentCompletedWeek();
      console.log('Most recent completed week:', mostRecent);
    } catch (error) {
      // If no completed games found, default to most recent season and week 1
      console.log('Error getting most recent completed week:', error);
      if (seasons.length > 0) {
        const weeks = await getWeeksBySeason(seasons[0]);
        mostRecent = { season: seasons[0], week: weeks[0] || 1 };
        console.log('Using fallback:', mostRecent);
      }
    }

    return NextResponse.json({
      seasons,
      mostRecentCompleted: mostRecent
    });
  } catch (error: any) {
    console.error('Error fetching seasons:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch seasons', details: error.message },
      { status: 500 }
    );
  }
}
