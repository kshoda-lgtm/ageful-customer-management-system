import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Ensure database directory exists or put it in backend logic
const dbPath = process.env.DATABASE_URL
    ? path.resolve(process.env.DATABASE_URL.replace('sqlite://', ''))
    : path.join(__dirname, '../../ageful.db');

const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`📦 Connected to SQLite database at ${dbPath}`);

export default db;
