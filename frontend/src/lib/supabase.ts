import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iurnhgpuabzwjhstbxdy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JjvGxveUdgnjrljAghnU2Q_O6LmETKH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
