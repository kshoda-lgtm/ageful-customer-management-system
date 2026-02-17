import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiGetProjects } from '../lib/api';
import { Search, Loader2, Zap, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';

export default function ProjectListPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchProjects = async (searchTerm = '') => {
        setLoading(true);
        try {
            const data = await apiGetProjects();
            const list = Array.isArray(data) ? data : [];
            // Flatten customer data
            const flat = list.map((p: any) => ({
                ...p,
                contact_name: p.customers?.contact_name,
                company_name: p.customers?.company_name,
            }));
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                setProjects(flat.filter((p: any) =>
                    (p.project_name || '').toLowerCase().includes(term) ||
                    (p.project_number || '').toLowerCase().includes(term)
                ));
            } else {
                setProjects(flat);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProjects(search);
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">案件・発電所管理</h1>
                    {/* Projects are created from Customer Detail, so no "New" button here usually, or link to Customers */}
                    <Link to="/customers" className="text-sm text-blue-600 hover:underline">
                        新規案件は顧客詳細から登録
                    </Link>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="案件名、ID、顧客名で検索..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 border-gray-200"
                        />
                    </form>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            案件が見つかりません
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {projects.map((project: any) => (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                    className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2 group-hover:text-amber-600 transition-colors">
                                                    {project.project_name}
                                                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        {project.project_number}
                                                    </span>
                                                </h3>
                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                                    {project.contact_name && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-gray-400">顧客:</span>
                                                            {project.contact_name} {project.company_name ? `(${project.company_name})` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                {project.site_address && (
                                                    <p className="mt-1 text-sm text-gray-400 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {project.site_address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
