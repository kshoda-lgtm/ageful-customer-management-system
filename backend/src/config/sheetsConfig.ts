import { google, sheets_v4 } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';

// Ensure .env is loaded - try multiple locations
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
console.log('Loaded .env from:', envPath, 'GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID ? 'SET' : 'NOT SET');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Initialize Google Sheets API client
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../google-credentials.json'),
    scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

// Get spreadsheet ID dynamically
export function getSpreadsheetId(): string {
    const id = process.env.GOOGLE_SHEETS_ID || '';
    if (!id) {
        console.error('GOOGLE_SHEETS_ID is not set in environment variables');
    }
    return id;
}

// Sheet names (tabs in spreadsheet)
export const SHEETS = {
    USERS: 'users',
    CUSTOMERS: 'customers',
    PROJECTS: 'projects',
    POWER_PLANT_SPECS: 'power_plant_specs',
    REGULATORY_INFO: 'regulatory_info',
    MAINTENANCE_LOGS: 'maintenance_logs',
    CONTRACTS: 'contracts',
    INVOICES: 'invoices',
};

// Helper: Get all rows from a sheet
export async function getSheetData(sheetName: string): Promise<any[][]> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: `${sheetName}!A:Z`,
    });
    return response.data.values || [];
}

// Helper: Convert rows to objects using first row as headers
export function rowsToObjects<T>(rows: any[][]): T[] {
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map((row, index) => {
        const obj: any = { _rowIndex: index + 2 }; // 1-indexed, skip header
        headers.forEach((header: string, i: number) => {
            obj[header] = row[i] !== undefined ? row[i] : null;
        });
        return obj as T;
    });
}

// Helper: Append a row to a sheet
export async function appendRow(sheetName: string, values: any[]): Promise<number> {
    const response = await sheets.spreadsheets.values.append({
        spreadsheetId: getSpreadsheetId(),
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [values],
        },
    });
    // Return the new row number
    const updatedRange = response.data.updates?.updatedRange || '';
    const match = updatedRange.match(/!A(\d+):/);
    return match ? parseInt(match[1], 10) : 0;
}

// Helper: Update a specific row
export async function updateRow(sheetName: string, rowIndex: number, values: any[]): Promise<void> {
    await sheets.spreadsheets.values.update({
        spreadsheetId: getSpreadsheetId(),
        range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [values],
        },
    });
}

// Helper: Delete a row (clear it)
export async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
    await sheets.spreadsheets.values.clear({
        spreadsheetId: getSpreadsheetId(),
        range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
    });
}

// Helper: Find row by ID
export async function findRowById(sheetName: string, id: string | number): Promise<{ row: any; rowIndex: number } | null> {
    const data = await getSheetData(sheetName);
    if (data.length < 2) return null;

    const headers = data[0];
    const idIndex = headers.indexOf('id');
    if (idIndex === -1) return null;

    for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex]?.toString() === id.toString()) {
            const obj: any = {};
            headers.forEach((header: string, j: number) => {
                obj[header] = data[i][j] !== undefined ? data[i][j] : null;
            });
            return { row: obj, rowIndex: i + 1 };
        }
    }
    return null;
}

// Helper: Get next ID for a sheet
export async function getNextId(sheetName: string): Promise<number> {
    const data = await getSheetData(sheetName);
    if (data.length < 2) return 1;

    const headers = data[0];
    const idIndex = headers.indexOf('id');
    if (idIndex === -1) return 1;

    let maxId = 0;
    for (let i = 1; i < data.length; i++) {
        const id = parseInt(data[i][idIndex], 10);
        if (!isNaN(id) && id > maxId) maxId = id;
    }
    return maxId + 1;
}

export default sheets;
