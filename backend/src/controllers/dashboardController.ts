import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

export const getBillingSummary = async (req: Request, res: Response) => {
    try {
        const { year, month } = req.query;

        const targetDate = new Date();
        const targetYear = year ? parseInt(year as string) : targetDate.getFullYear();
        const targetMonth = month ? parseInt(month as string) : targetDate.getMonth() + 1;
        const billingPeriod = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('*, contracts(project_id, projects(project_name, customers(company_name, contact_name)))')
            .eq('billing_period', billingPeriod);

        if (error) throw error;

        const summary = (invoices || []).map((inv: any) => ({
            invoice_id: inv.id,
            invoice_status: inv.status,
            amount: inv.amount,
            customer_name: inv.contracts?.projects?.customers?.contact_name || inv.contracts?.projects?.customers?.company_name || '',
            project_name: inv.contracts?.projects?.project_name || '',
            project_id: inv.contracts?.project_id || '',
            contract_id: inv.contract_id || '',
        }));

        res.json({ period: billingPeriod, data: summary });
    } catch (error) {
        console.error('getBillingSummary error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
