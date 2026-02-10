import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const { search, sort } = req.query;

        let query = supabase.from('customers').select('*');

        if (search) {
            query = query.or(`contact_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (sort === 'company_name') {
            query = query.order('company_name', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('getCustomers error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: customer, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !customer) return res.status(404).json({ message: 'Customer not found' });

        // Get related projects
        const { data: projects } = await supabase
            .from('projects')
            .select('*')
            .eq('customer_id', id)
            .order('created_at', { ascending: false });

        res.json({ ...customer, projects: projects || [] });
    } catch (error) {
        console.error('getCustomer error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Alias for route compatibility
export const getCustomerById = getCustomer;

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const { data, error } = await supabase
            .from('customers')
            .insert({ ...req.body, created_by: userId })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('createCustomer error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('customers')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('updateCustomer error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
