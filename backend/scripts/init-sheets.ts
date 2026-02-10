import { google } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../google-credentials.json'),
    scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

// Sheet configurations with headers
const SHEET_CONFIGS = [
    {
        name: 'users',
        headers: ['id', 'email', 'password_hash', 'name', 'role', 'created_at'],
    },
    {
        name: 'customers',
        headers: ['id', 'company_name', 'contact_name', 'email', 'phone', 'postal_code', 'address', 'billing_postal_code', 'billing_address', 'billing_contact_name', 'notes', 'created_at'],
    },
    {
        name: 'projects',
        headers: ['id', 'customer_id', 'project_name', 'project_number', 'site_postal_code', 'site_address', 'map_coordinates', 'key_number', 'created_at'],
    },
    {
        name: 'power_plant_specs',
        headers: ['id', 'project_id', 'panel_kw', 'panel_count', 'panel_manufacturer', 'panel_model', 'pcs_kw', 'pcs_count', 'pcs_manufacturer', 'pcs_model'],
    },
    {
        name: 'regulatory_info',
        headers: ['id', 'project_id', 'meti_id', 'meti_certification_date', 'fit_rate', 'supply_start_date', 'power_reception_id', 'remote_monitoring_status', 'is_4g_compatible', 'monitoring_credentials'],
    },
    {
        name: 'maintenance_logs',
        headers: ['id', 'project_id', 'user_id', 'occurrence_date', 'work_type', 'target_area', 'situation', 'response', 'report', 'status', 'inquiry_date', 'created_at', 'updated_at'],
    },
    {
        name: 'contracts',
        headers: ['id', 'project_id', 'contract_type', 'business_owner', 'contractor', 'subcontractor', 'annual_maintenance_fee', 'land_rent', 'communication_fee', 'start_date', 'end_date'],
    },
    {
        name: 'invoices',
        headers: ['id', 'contract_id', 'billing_period', 'issue_date', 'amount', 'status', 'payment_due_date', 'paid_at'],
    },
];

async function initializeSheets() {
    console.log('🚀 Initializing Google Sheets...');
    console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);

    try {
        // Get current spreadsheet info
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
        console.log('Existing sheets:', existingSheets);

        // Create missing sheets
        const requests: any[] = [];

        for (const config of SHEET_CONFIGS) {
            if (!existingSheets.includes(config.name)) {
                requests.push({
                    addSheet: {
                        properties: {
                            title: config.name,
                        },
                    },
                });
                console.log(`📄 Will create sheet: ${config.name}`);
            }
        }

        // Execute batch update for new sheets
        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests,
                },
            });
            console.log('✅ Created new sheets');
        }

        // Add headers to each sheet
        for (const config of SHEET_CONFIGS) {
            // Check if headers exist
            const existingData = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${config.name}!A1:Z1`,
            });

            if (!existingData.data.values || existingData.data.values.length === 0) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${config.name}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [config.headers],
                    },
                });
                console.log(`📝 Added headers to: ${config.name}`);
            } else {
                console.log(`⏭️  Headers already exist in: ${config.name}`);
            }
        }

        // Add a default admin user if users sheet is empty
        const usersData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'users!A:A',
        });

        if (!usersData.data.values || usersData.data.values.length <= 1) {
            // Simple hash for demo (in production use bcrypt)
            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash('admin123', 10);

            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'users!A:F',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['1', 'admin@ageful.jp', passwordHash, '管理者', 'admin', new Date().toISOString()]],
                },
            });
            console.log('👤 Created default admin user (admin@ageful.jp / admin123)');
        }

        console.log('\n✅ Google Sheets initialization complete!');
        console.log('📊 Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID);

    } catch (error) {
        console.error('❌ Error initializing sheets:', error);
        throw error;
    }
}

initializeSheets();
