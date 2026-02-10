
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.join(__dirname, '../../ageful.db');
const db = new Database(dbPath);

async function checkUser() {
    console.log(`Checking DB at: ${dbPath}`);
    const email = 'admin@ageful.jp';
    const password = 'password123';

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) {
        console.error(`❌ User ${email} not found!`);
        return;
    }

    console.log(`✅ User found: ID=${user.id}, Email=${user.email}, Role=${user.role}`);
    console.log(`Stored Hash: ${user.password_hash}`);

    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
        console.log('✅ Password matches!');
    } else {
        console.error('❌ Password does NOT match!');

        // Fix it
        const newHash = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
        console.log('🔄 Password reset to "password123" done.');
    }
}

checkUser();
