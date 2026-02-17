import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiGetDashboard } from '../lib/api';
import { Loader2, Users, Zap, Wrench, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [recentMaintenance, setRecentMaintenance] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await apiGetDashboard();
                setStats(result);
                setRecentMaintenance(result.recentMaintenance || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link to="/customers" className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">顧客数</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.totalCustomers || 0}</p>
                            </div>
                        </div>
                    </Link>
                    <Link to="/projects" className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">案件数</p>
                                <p className="text-3xl font-bold text-slate-900">{stats.totalProjects || 0}</p>
                            </div>
                        </div>
                    </Link>
                    <Link to="/maintenance" className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                                <Wrench className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">未対応メンテ</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.pendingMaintenanceCount || 0}</p>
                            </div>
                        </div>
                    </Link>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">未請求</p>
                                <p className="text-3xl font-bold text-green-600">{stats.unbilledInvoiceCount || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Maintenance */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">最近の保守記録</h2>
                        <Link to="/maintenance" className="text-sm text-blue-600 hover:underline">
                            すべて見る →
                        </Link>
                    </div>

                    {recentMaintenance.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            保守記録がありません
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentMaintenance.map((log: any) => (
                                <Link
                                    key={log.id}
                                    to={`/projects/${log.project_id}`}
                                    className="block p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {log.projects?.project_name || '不明な案件'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {log.occurrence_date} / {log.work_type}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                log.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {log.status === 'completed' ? '完了' : log.status === 'in_progress' ? '対応中' : '未対応'}
                                        </span>
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
