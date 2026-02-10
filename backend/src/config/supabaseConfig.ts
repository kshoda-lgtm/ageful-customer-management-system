import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ SUPABASE_URL or SUPABASE_ANON_KEY is not set!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase connected to:', supabaseUrl ? 'SET' : 'NOT SET');
