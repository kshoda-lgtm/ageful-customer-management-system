import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || ''
);

async function seedDemo() {
    console.log('🌱 デモデータを投入中...\n');

    // === 顧客データ ===
    const { data: customers } = await supabase.from('customers').insert([
        {
            type: 'corporate',
            company_name: '株式会社サンライズエナジー',
            contact_name: '田中 太郎',
            email: 'tanaka@sunrise-energy.co.jp',
            phone: '03-1234-5678',
            postal_code: '100-0001',
            address: '東京都千代田区千代田1-1-1',
            billing_postal_code: '100-0001',
            billing_address: '東京都千代田区千代田1-1-1',
            billing_contact_name: '経理部 山田',
            notes: '大口顧客。年次契約更新あり。',
            created_by: 1,
        },
        {
            type: 'corporate',
            company_name: '合同会社グリーンパワー',
            contact_name: '佐藤 花子',
            email: 'sato@greenpower.jp',
            phone: '06-9876-5432',
            postal_code: '530-0001',
            address: '大阪府大阪市北区梅田2-2-2',
            notes: '関西エリアの案件が多い',
            created_by: 1,
        },
        {
            type: 'individual',
            contact_name: '鈴木 一郎',
            email: 'suzuki@example.com',
            phone: '090-1111-2222',
            postal_code: '460-0001',
            address: '愛知県名古屋市中区栄3-3-3',
            notes: '個人所有の発電所',
            created_by: 1,
        },
    ]).select();

    console.log(`✅ 顧客 ${customers?.length || 0} 件を登録`);

    if (!customers || customers.length < 3) {
        console.error('顧客作成に失敗。スクリプトを中断します。');
        return;
    }

    // === 案件（プロジェクト）データ ===
    const { data: projects } = await supabase.from('projects').insert([
        {
            customer_id: customers[0].id,
            project_number: 'PJ-2024-001',
            project_name: '千葉第1太陽光発電所',
            site_postal_code: '260-0001',
            site_address: '千葉県千葉市中央区都町1-1',
            map_coordinates: '35.6074, 140.1065',
            key_number: 'KEY-001',
        },
        {
            customer_id: customers[0].id,
            project_number: 'PJ-2024-002',
            project_name: '茨城第2太陽光発電所',
            site_postal_code: '310-0001',
            site_address: '茨城県水戸市金町2-2-2',
            map_coordinates: '36.3658, 140.4710',
            key_number: 'KEY-002',
        },
        {
            customer_id: customers[1].id,
            project_number: 'PJ-2024-003',
            project_name: '三重メガソーラーパーク',
            site_postal_code: '514-0001',
            site_address: '三重県津市丸之内10-10',
            map_coordinates: '34.7303, 136.5086',
        },
        {
            customer_id: customers[2].id,
            project_number: 'PJ-2024-004',
            project_name: '名古屋屋根置き発電設備',
            site_postal_code: '460-0001',
            site_address: '愛知県名古屋市中区栄3-3-3',
        },
    ]).select();

    console.log(`✅ 案件 ${projects?.length || 0} 件を登録`);

    if (!projects || projects.length < 4) return;

    // === 発電所スペック ===
    await supabase.from('power_plant_specs').insert([
        {
            project_id: projects[0].id,
            panel_kw: 5.5,
            panel_count: 200,
            panel_manufacturer: 'LONGi',
            panel_model: 'LR5-54HTH-430M',
            pcs_kw: 49.5,
            pcs_count: 2,
            pcs_manufacturer: 'SMA',
            pcs_model: 'STP 25000TL-30',
        },
        {
            project_id: projects[1].id,
            panel_kw: 4.0,
            panel_count: 150,
            panel_manufacturer: 'JA Solar',
            panel_model: 'JAM72S30-545/MR',
            pcs_kw: 40.0,
            pcs_count: 1,
            pcs_manufacturer: 'Huawei',
            pcs_model: 'SUN2000-36KTL-JP',
        },
        {
            project_id: projects[2].id,
            panel_kw: 10.0,
            panel_count: 500,
            panel_manufacturer: 'Trina Solar',
            panel_model: 'TSM-DE19-545',
            pcs_kw: 100.0,
            pcs_count: 4,
            pcs_manufacturer: 'TMEIC',
            pcs_model: 'PVL-L0250',
        },
    ]);

    console.log('✅ 発電所スペック 3 件を登録');

    // === 法規制情報 ===
    await supabase.from('regulatory_info').insert([
        {
            project_id: projects[0].id,
            meti_id: 'METI-2023-12345',
            meti_certification_date: '2023-04-15',
            fit_rate: 12.0,
            supply_start_date: '2023-06-01',
            power_reception_id: 'PWR-001',
            remote_monitoring_status: '正常',
            is_4g_compatible: true,
        },
        {
            project_id: projects[2].id,
            meti_id: 'METI-2022-98765',
            meti_certification_date: '2022-01-10',
            fit_rate: 14.0,
            supply_start_date: '2022-04-01',
            power_reception_id: 'PWR-003',
            remote_monitoring_status: '正常',
            is_4g_compatible: true,
        },
    ]);

    console.log('✅ 法規制情報 2 件を登録');

    // === 契約データ ===
    const { data: contracts } = await supabase.from('contracts').insert([
        {
            project_id: projects[0].id,
            contract_type: 'maintenance',
            business_owner: '株式会社サンライズエナジー',
            contractor: '株式会社エイジフル',
            start_date: '2024-04-01',
            end_date: '2025-03-31',
            annual_maintenance_fee: 360000,
            land_rent: 120000,
            communication_fee: 36000,
        },
        {
            project_id: projects[1].id,
            contract_type: 'maintenance',
            business_owner: '株式会社サンライズエナジー',
            contractor: '株式会社エイジフル',
            start_date: '2024-04-01',
            end_date: '2025-03-31',
            annual_maintenance_fee: 300000,
            communication_fee: 36000,
        },
        {
            project_id: projects[2].id,
            contract_type: 'maintenance',
            business_owner: '合同会社グリーンパワー',
            contractor: '株式会社エイジフル',
            subcontractor: '有限会社メンテナンスプロ',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            annual_maintenance_fee: 600000,
            land_rent: 240000,
            communication_fee: 48000,
        },
    ]).select();

    console.log(`✅ 契約 ${contracts?.length || 0} 件を登録`);

    // === 請求書データ ===
    if (contracts && contracts.length >= 3) {
        await supabase.from('invoices').insert([
            {
                contract_id: contracts[0].id,
                billing_period: '2024-04',
                issue_date: '2024-04-01',
                amount: 30000,
                status: 'paid',
                payment_due_date: '2024-04-30',
                paid_at: '2024-04-25',
            },
            {
                contract_id: contracts[0].id,
                billing_period: '2024-05',
                issue_date: '2024-05-01',
                amount: 30000,
                status: 'paid',
                payment_due_date: '2024-05-31',
                paid_at: '2024-05-20',
            },
            {
                contract_id: contracts[0].id,
                billing_period: '2024-06',
                issue_date: '2024-06-01',
                amount: 30000,
                status: 'billed',
                payment_due_date: '2024-06-30',
            },
            {
                contract_id: contracts[2].id,
                billing_period: '2024-04',
                issue_date: '2024-04-01',
                amount: 50000,
                status: 'paid',
                payment_due_date: '2024-04-30',
                paid_at: '2024-04-28',
            },
            {
                contract_id: contracts[2].id,
                billing_period: '2024-05',
                issue_date: '2024-05-01',
                amount: 50000,
                status: 'unbilled',
                payment_due_date: '2024-05-31',
            },
        ]);

        console.log('✅ 請求書 5 件を登録');
    }

    // === 保守記録 ===
    await supabase.from('maintenance_logs').insert([
        {
            project_id: projects[0].id,
            user_id: 1,
            inquiry_date: '2024-05-10',
            occurrence_date: '2024-05-08',
            work_type: '定期点検',
            target_area: 'パネルエリアA',
            situation: 'パネル表面に汚れが確認された',
            response: '高圧洗浄にて清掃実施。異常なし。',
            report: '定期点検完了。次回は11月予定。',
            status: 'completed',
        },
        {
            project_id: projects[0].id,
            user_id: 1,
            inquiry_date: '2024-06-15',
            occurrence_date: '2024-06-14',
            work_type: '緊急対応',
            target_area: 'PCSユニット#2',
            situation: 'PCS#2が停止。エラーコードE-302表示。',
            response: '部品交換対応中。メーカーに連絡済み。',
            status: 'in_progress',
        },
        {
            project_id: projects[2].id,
            user_id: 1,
            inquiry_date: '2024-04-20',
            occurrence_date: '2024-04-20',
            work_type: '定期点検',
            target_area: '全エリア',
            situation: '春季定期点検',
            response: '全パネル・PCS正常動作確認。電気系統に問題なし。',
            report: '春季定期点検完了報告書',
            status: 'completed',
        },
        {
            project_id: projects[3].id,
            user_id: 1,
            inquiry_date: '2024-07-01',
            work_type: '問い合わせ',
            target_area: '監視システム',
            situation: '遠隔監視の数値が表示されない',
            status: 'pending',
        },
    ]);

    console.log('✅ 保守記録 4 件を登録');

    console.log('\n🎉 デモデータの投入が完了しました！');
    console.log('http://localhost:5173 でログインして確認してください。');
}

seedDemo().catch(console.error);
