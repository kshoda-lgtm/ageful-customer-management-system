import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiGetAllMaintenanceLogs } from '../lib/api';
import { Loader2, Search, MapPin, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { MaintenanceLog } from '../types';

type ExtendedMaintenanceLog = MaintenanceLog & {
    project_name?: string;
    company_name?: string;
    contact_name?: string;
};

export default function MaintenanceListPage() {
    const [logs, setLogs] = useState<ExtendedMaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await apiGetAllMaintenanceLogs();
                const list = Array.isArray(data) ? data : [];
                const flat = list.map((log: any) => ({
                    ...log,
                    project_name: log.projects?.project_name,
                    company_name: log.projects?.customers?.company_name,
                    contact_name: log.projects?.customers?.contact_name,
                }));
                if (statusFilter) {
                    setLogs(flat.filter((l: any) => l.status === statusFilter));
                } else {
                    setLogs(flat);
                }
            } catch (err) {
                console.error('Failed to fetch maintenance logs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [statusFilter]);

    const filteredLogs = logs.filter(log => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (log.project_name?.toLowerCase().includes(searchLower) || false) ||
            (log.company_name?.toLowerCase().includes(searchLower) || false) ||
            (log.work_type?.toLowerCase().includes(searchLower) || false) ||
            (log.response?.toLowerCase().includes(searchLower) || false)
        );
    });

    const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
        completed: { label: '完了', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        pending: { label: '未対応', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
        in_progress: { label: '対応中', icon: AlertCircle, color: 'text-blue-600 bg-blue-50' },
    };

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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">保守記録一覧</h1>
                        <p className="text-sm text-gray-500 mt-1">全案件のメンテナンス履歴を確認できます</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="案件名、顧客名、作業内容で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border rounded-lg bg-white"
                        >
                            <option value="">すべてのステータス</option>
                            <option value="completed">完了</option>
                            <option value="pending">未対応</option>
                            <option value="in_progress">対応中</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500">総件数</p>
                        <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500">完了</p>
                        <p className="text-2xl font-bold text-green-600">
                            {logs.filter(l => l.status === 'completed').length}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500">未対応</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {logs.filter(l => l.status === 'pending').length}
                        </p>
                    </div>
                </div>

                {/* Logs List */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    {filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {searchTerm || statusFilter ? '条件に一致する記録がありません' : '保守記録がありません'}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredLogs.map((log) => {
                                const config = statusConfig[log.status] || statusConfig.pending;
                                const StatusIcon = config.icon;
                                return (
                                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link
                                                        to={`/projects/${log.project_id}`}
                                                        className="font-semibold text-gray-900 hover:text-blue-600 truncate"
                                                    >
                                                        {log.project_name || '不明な案件'}
                                                    </Link>
                                                    <span className="text-xs text-gray-400">
                                                        {log.company_name || log.contact_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <span className="font-medium">{log.occurrence_date}</span>
                                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                                                        {log.work_type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 line-clamp-2">{log.response}</p>
                                                {log.target_area && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {log.target_area}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {config.label}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
