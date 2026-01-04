import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    console.log('Fetching players from database...');
    
    const { data: players, error } = await supabase
      .from('players')
      .select('player_id, player_name, espn_id, position');
    
    if (error) {
      console.error('Supabase error fetching players:', error);
      throw error;
    }
    
    console.log(`Successfully fetched ${players?.length || 0} players`);
    console.log('Sample player:', players?.[0]);
    
    return NextResponse.json({ players });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
