import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

// ========== Contract handlers ==========

export const getContractsByProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;

        const { data: contracts, error } = await supabase
            .from('contracts')
            .select('*, projects(project_name)')
            .eq('project_id', projectId)
            .order('start_date', { ascending: false });

        if (error) throw error;

        // Get invoices for each contract
        const contractIds = (contracts || []).map((c: any) => c.id);
        const { data: invoices } = contractIds.length > 0
            ? await supabase.from('invoices').select('*').in('contract_id', contractIds)
            : { data: [] };

        const result = (contracts || []).map((c: any) => ({
            ...c,
            project_name: c.projects?.project_name || '',
            projects: undefined,
            invoices: (invoices || []).filter((i: any) => i.contract_id === c.id),
        }));

        res.json(result);
    } catch (error) {
        console.error('getContractsByProject error:', error);
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
};

export const getContract = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: contract, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !contract) return res.status(404).json({ error: 'Contract not found' });

        const { data: invoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('contract_id', id)
            .order('billing_period', { ascending: false });

        res.json({ ...contract, invoices: invoices || [] });
    } catch (error) {
        console.error('getContract error:', error);
        res.status(500).json({ error: 'Failed to fetch contract' });
    }
};

export const createContract = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('contracts')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('createContract error:', error);
        res.status(500).json({ error: 'Failed to create contract' });
    }
};

export const updateContract = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('contracts')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('updateContract error:', error);
        res.status(500).json({ error: 'Failed to update contract' });
    }
};

export const deleteContract = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabase.from('contracts').delete().eq('id', id);
        if (error) throw error;

        res.json({ message: 'Contract deleted' });
    } catch (error) {
        console.error('deleteContract error:', error);
        res.status(500).json({ error: 'Failed to delete contract' });
    }
};

// ========== Invoice handlers ==========

export const getInvoicesByContract = async (req: Request, res: Response) => {
    try {
        const { contractId } = req.params;

        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('contract_id', contractId)
            .order('billing_period', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('getInvoicesByContract error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const { year, month, status } = req.query;

        let query = supabase
            .from('invoices')
            .select('*, contracts(project_id, projects(project_name, customers(company_name, contact_name)))');

        if (year && month) {
            const billingPeriod = `${year}-${String(month).padStart(2, '0')}`;
            query = query.eq('billing_period', billingPeriod);
        }
        if (status) {
            query = query.eq('status', status);
        }

        query = query.order('billing_period', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const invoices = (data || []).map((inv: any) => ({
            ...inv,
            project_id: inv.contracts?.project_id || '',
            project_name: inv.contracts?.projects?.project_name || '',
            company_name: inv.contracts?.projects?.customers?.company_name || '',
            contact_name: inv.contracts?.projects?.customers?.contact_name || '',
            contracts: undefined,
        }));

        res.json(invoices);
    } catch (error) {
        console.error('getAllInvoices error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('createInvoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, paid_at } = req.body;

        const updateData: any = { status };
        if (status === 'paid') {
            updateData.paid_at = paid_at || new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('invoices')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('updateInvoiceStatus error:', error);
        res.status(500).json({ error: 'Failed to update invoice status' });
    }
};

export const updateInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('invoices')
            .update(req.body)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('updateInvoice error:', error);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
};

export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) throw error;

        res.json({ message: 'Invoice deleted' });
    } catch (error) {
        console.error('deleteInvoice error:', error);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
};
