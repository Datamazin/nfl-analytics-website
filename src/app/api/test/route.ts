import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Test 1: Can we connect?
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(5);
    
    if (schedulesError) {
      return NextResponse.json({
        success: false,
        error: 'Schedules query failed',
        details: schedulesError
      });
    }

    // Test 2: Get count
    const { count, error: countError } = await supabase
      .from('schedules')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      schedulesCount: count,
      sampleSchedules: schedules,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
