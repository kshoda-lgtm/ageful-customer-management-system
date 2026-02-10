import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
    console.log('Creating default admin user...');

    // Check if admin already exists
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'admin@ageful.jp')
        .single();

    if (existing) {
        console.log('Admin user already exists, skipping.');
        return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const { data, error } = await supabase
        .from('users')
        .insert({
            email: 'admin@ageful.jp',
            password_hash: hashedPassword,
            name: '管理者',
            role: 'admin',
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create admin:', error);
    } else {
        console.log('✅ Admin user created:', data.email);
    }
}

seedAdmin();
