
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables are missing:');
  console.error(`VITE_SUPABASE_URL: ${supabaseUrl ? 'defined' : 'undefined'}`);
  console.error(`VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'defined' : 'undefined'}`);
  throw new Error(
    'Supabase URL and Anon Key must be provided in environment variables. ' +
    'Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
