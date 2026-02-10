import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

export const getProjects = async (req: Request, res: Response) => {
    try {
        const { customer_id, search } = req.query;

        let query = supabase.from('projects').select('*, customers(company_name, contact_name)');

        if (customer_id) {
            query = query.eq('customer_id', customer_id);
        }

        if (search) {
            query = query.or(`project_name.ilike.%${search}%,project_number.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        // Flatten customer data
        const projects = (data || []).map((p: any) => ({
            ...p,
            company_name: p.customers?.company_name || '',
            contact_name: p.customers?.contact_name || '',
            customers: undefined,
        }));

        res.json(projects);
    } catch (error) {
        console.error('getProjects error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: project, error } = await supabase
            .from('projects')
            .select('*, customers(company_name, contact_name)')
            .eq('id', id)
            .single();

        if (error || !project) return res.status(404).json({ message: 'Project not found' });

        // Get related data
        const [specsRes, regRes] = await Promise.all([
            supabase.from('power_plant_specs').select('*').eq('project_id', id).single(),
            supabase.from('regulatory_info').select('*').eq('project_id', id).single(),
        ]);

        res.json({
            ...project,
            company_name: project.customers?.company_name || '',
            contact_name: project.customers?.contact_name || '',
            customers: undefined,
            power_plant_spec: specsRes.data || null,
            regulatory_info: regRes.data || null,
        });
    } catch (error) {
        console.error('getProject error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Alias for route compatibility
export const getProjectById = getProject;

export const getProjectSpecs = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('power_plant_specs')
            .select('*')
            .eq('project_id', id)
            .single();
        if (error) return res.json(null);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const { power_plant_spec, regulatory_info, ...projectData } = req.body;

        const { data: project, error } = await supabase
            .from('projects')
            .insert(projectData)
            .select()
            .single();

        if (error) throw error;

        if (power_plant_spec) {
            await supabase.from('power_plant_specs').insert({ ...power_plant_spec, project_id: project.id });
        }
        if (regulatory_info) {
            await supabase.from('regulatory_info').insert({ ...regulatory_info, project_id: project.id });
        }

        res.status(201).json(project);
    } catch (error) {
        console.error('createProject error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { power_plant_spec, regulatory_info, ...projectData } = req.body;

        const { data: project, error } = await supabase
            .from('projects')
            .update({ ...projectData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (power_plant_spec) {
            const { data: existingSpec } = await supabase
                .from('power_plant_specs')
                .select('id')
                .eq('project_id', id)
                .single();

            if (existingSpec) {
                await supabase.from('power_plant_specs')
                    .update({ ...power_plant_spec, updated_at: new Date().toISOString() })
                    .eq('project_id', id);
            } else {
                await supabase.from('power_plant_specs')
                    .insert({ ...power_plant_spec, project_id: id });
            }
        }

        if (regulatory_info) {
            const { data: existingReg } = await supabase
                .from('regulatory_info')
                .select('id')
                .eq('project_id', id)
                .single();

            if (existingReg) {
                await supabase.from('regulatory_info')
                    .update({ ...regulatory_info, updated_at: new Date().toISOString() })
                    .eq('project_id', id);
            } else {
                await supabase.from('regulatory_info')
                    .insert({ ...regulatory_info, project_id: id });
            }
        }

        res.json(project);
    } catch (error) {
        console.error('updateProject error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get maintenance logs for a project
export const getProjectMaintenance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('maintenance_logs')
            .select('*, users(name)')
            .eq('project_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const logs = (data || []).map((log: any) => ({
            ...log,
            user_name: log.users?.name || '',
            users: undefined,
        }));

        res.json(logs);
    } catch (error) {
        console.error('getProjectMaintenance error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
