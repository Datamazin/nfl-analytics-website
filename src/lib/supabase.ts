import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy initialization to avoid build-time errors
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
  }
  return supabaseInstance;
}

// Client-side Supabase client
export const supabase = getSupabaseClient();

// Server-side Supabase client (can be enhanced with auth later)
export const createServerClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};
