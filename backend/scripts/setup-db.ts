import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.join(__dirname, '../../ageful.db');

async function setupDatabase() {
    console.log('🚀 Starting SQLite Database Setup...');

    try {
        // Delete existing DB if needed (optional, maybe flag controlled)
        // if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

        const db = new Database(dbPath);
        console.log(`Checking database at: ${dbPath}`);

        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Executing the schema
        console.log('Applying schema...');
        db.exec(schemaSql);

        console.log('✅ Schema applied successfully.');

        // Verify tables
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
        console.log('\n📊 Created Tables:');
        tables.forEach((row: any) => console.log(` - ${row.name}`));

        db.close();

    } catch (err) {
        console.error('❌ Error setting up database:', err);
        process.exit(1);
    }

    console.log('\n✨ Database setup completed successfully!');
}

setupDatabase();
