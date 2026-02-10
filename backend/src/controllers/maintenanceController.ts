import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

export const getMaintenanceLogs = async (req: Request, res: Response) => {
    try {
        const { project_id, status, search } = req.query;

        let query = supabase
            .from('maintenance_logs')
            .select('*, users(name), projects(project_name, customers(company_name))');

        if (project_id) {
            query = query.eq('project_id', project_id);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (search) {
            query = query.or(`target_area.ilike.%${search}%,situation.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const logs = (data || []).map((log: any) => ({
            ...log,
            user_name: log.users?.name || '',
            project_name: log.projects?.project_name || '',
            company_name: log.projects?.customers?.company_name || '',
            users: undefined,
            projects: undefined,
        }));

        res.json(logs);
    } catch (error) {
        console.error('getMaintenanceLogs error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Alias for route compatibility
export const getAllMaintenanceLogs = getMaintenanceLogs;

export const getMaintenanceLog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('maintenance_logs')
            .select('*, users(name), projects(project_name)')
            .eq('id', id)
            .single();

        if (error || !data) return res.status(404).json({ message: 'Log not found' });

        res.json({
            ...data,
            user_name: data.users?.name || '',
            project_name: data.projects?.project_name || '',
            users: undefined,
            projects: undefined,
        });
    } catch (error) {
        console.error('getMaintenanceLog error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createMaintenanceLog = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const { data, error } = await supabase
            .from('maintenance_logs')
            .insert({ ...req.body, user_id: userId })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('createMaintenanceLog error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateMaintenanceLog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('maintenance_logs')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('updateMaintenanceLog error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteMaintenanceLog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('maintenance_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error('deleteMaintenanceLog error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
