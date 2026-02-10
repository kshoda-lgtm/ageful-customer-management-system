import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.join(__dirname, '../../ageful.db');
const db = new Database(dbPath);

async function seed() {
    console.log('🌱 Seeding database...');

    // Create Admin User
    const email = 'admin@ageful.jp';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const existingUser = userStmt.get(email);

    if (!existingUser) {
        const insert = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
        insert.run('Admin User', email, hashedPassword, 'admin');
        console.log(`✅ Created admin user: ${email} / ${password}`);
    } else {
        console.log('ℹ️ Admin user already exists');
    }

    // Dummy Customers
    const custCount = db.prepare('SELECT count(*) as count FROM customers').get() as any;
    if (custCount.count === 0) {
        console.log('Creating dummy customers...');
        const insertCust = db.prepare(`
        INSERT INTO customers (contact_name, company_name, email, phone, address, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);

        const adminId = (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any).id;

        insertCust.run('田中 太郎', '田中商店', 'tanaka@test.com', '090-1111-2222', '東京都渋谷区...', adminId);
        insertCust.run('佐藤 次郎', null, 'sato@test.com', '080-3333-4444', '神奈川県横浜市...', adminId);
        insertCust.run('鈴木 花子', '鈴木産業', 'suzuki@test.com', '03-1234-5678', '埼玉県さいたま市...', adminId);
    }

    // Dummy Projects
    const projCount = db.prepare('SELECT count(*) as count FROM projects').get() as any;
    if (projCount.count === 0) {
        const cust = db.prepare('SELECT id FROM customers LIMIT 1').get() as any;
        if (cust) {
            db.prepare(`
            INSERT INTO projects (customer_id, project_name, project_number, site_address)
            VALUES (?, ?, ?, ?)
          `).run(cust.id, '渋谷第1発電所', 'PRJ-001', '東京都渋谷区神南...');

            db.prepare(`
            INSERT INTO projects (customer_id, project_name, project_number, site_address)
            VALUES (?, ?, ?, ?)
          `).run(cust.id, '横浜第2発電所', 'PRJ-002', '神奈川県横浜市西区...');
        }
    }

    console.log('✨ Seeding completed!');
}

seed();
