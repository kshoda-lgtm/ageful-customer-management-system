import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import api from '../lib/api';
import { Loader2, Save, ArrowLeft, Zap, FileText, Info, MapPin, Wrench, Plus, DollarSign, Trash2, Edit2 } from 'lucide-react';
import type { Project, PowerPlantSpec, RegulatoryInfo, MaintenanceLog, Contract, Invoice } from '../types';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'regulatory' | 'maintenance' | 'contracts'>('basic');
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);

    const { register, handleSubmit, reset, watch } = useForm<Project & {
        power_plant_specs: PowerPlantSpec;
        regulatory_info: RegulatoryInfo;
    }>();

    useEffect(() => {
        if (id === 'new') {
            alert('案件の新規登録は顧客詳細画面から行ってください');
            navigate(-1);
            return;
        }

        const fetchData = async () => {
            try {
                const projRes = await api.get(`/projects/${id}`);
                reset(projRes.data);
            } catch (err) {
                console.error('Failed to fetch project:', err);
                navigate('/');
                return;
            }

            // These can fail without blocking the page
            try {
                const logsRes = await api.get(`/projects/${id}/maintenance`);
                setMaintenanceLogs(logsRes.data || []);
            } catch (err) {
                console.error('Failed to fetch maintenance logs:', err);
            }

            try {
                const contractsRes = await api.get(`/contracts/project/${id}`);
                setContracts(contractsRes.data || []);
            } catch (err) {
                console.error('Failed to fetch contracts:', err);
            }

            setLoading(false);
        };
        fetchData();
    }, [id, navigate, reset]);

    const onSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            await api.put(`/projects/${id}`, data);
            alert('保存しました');
        } catch (err) {
            console.error(err);
            alert('エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    const handleMaintenanceSubmit = async () => {
        const date = prompt('発生日 (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
        if (!date) return;
        const type = prompt('作業種別 (例: 除草、点検)');
        const content = prompt('対応内容');

        if (date && type && content) {
            try {
                await api.post('/maintenance', {
                    project_id: id,
                    occurrence_date: date,
                    work_type: type,
                    target_area: '全域',
                    situation: '定期メンテ',
                    response: content,
                    status: 'completed'
                });
                const logsRes = await api.get(`/projects/${id}/maintenance`);
                setMaintenanceLogs(logsRes.data);
                alert('追加しました');
            } catch (err) {
                console.error(err);
                alert('追加に失敗しました');
            }
        }
    };

    const handleContractSubmit = async () => {
        const startDate = prompt('契約開始日 (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
        if (!startDate) return;
        const fee = prompt('年間保守料（税抜）', '0');
        const landRent = prompt('土地賃料', '0');
        const commFee = prompt('通信料', '0');

        try {
            await api.post('/contracts', {
                project_id: id,
                contract_type: 'maintenance',
                start_date: startDate,
                annual_maintenance_fee: parseFloat(fee || '0'),
                land_rent: parseFloat(landRent || '0'),
                communication_fee: parseFloat(commFee || '0')
            });
            const contractsRes = await api.get(`/contracts/project/${id}`);
            setContracts(contractsRes.data);
            alert('契約を追加しました');
        } catch (err) {
            console.error(err);
            alert('追加に失敗しました');
        }
    };

    const handleInvoiceSubmit = async (contractId: number) => {
        const month = prompt('請求対象年月 (YYYY-MM)', new Date().toISOString().slice(0, 7));
        if (!month) return;
        const amount = prompt('請求金額', '0');

        try {
            await api.post('/contracts/invoices', {
                contract_id: contractId,
                billing_period: month,
                issue_date: new Date().toISOString().split('T')[0],
                amount: parseFloat(amount || '0'),
                status: 'unbilled'
            });
            const contractsRes = await api.get(`/contracts/project/${id}`);
            setContracts(contractsRes.data);
            alert('請求書を追加しました');
        } catch (err) {
            console.error(err);
            alert('追加に失敗しました');
        }
    };

    const handleInvoiceStatusChange = async (invoiceId: number, newStatus: string) => {
        try {
            await api.patch(`/contracts/invoices/${invoiceId}/status`, { status: newStatus });
            const contractsRes = await api.get(`/contracts/project/${id}`);
            setContracts(contractsRes.data);
        } catch (err) {
            console.error(err);
            alert('ステータス更新に失敗しました');
        }
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

    const customerId = watch('customer_id');

    const tabs = [
        { id: 'basic', label: '基本情報', icon: Info },
        { id: 'specs', label: '設備スペック', icon: Zap },
        { id: 'regulatory', label: '制度情報', icon: FileText },
        { id: 'maintenance', label: 'メンテナンス履歴', icon: Wrench },
        { id: 'contracts', label: '契約・請求', icon: DollarSign },
    ];

    const statusLabels: Record<string, { label: string; color: string }> = {
        unbilled: { label: '未請求', color: 'bg-gray-100 text-gray-800' },
        billed: { label: '請求済', color: 'bg-blue-100 text-blue-800' },
        paid: { label: '入金済', color: 'bg-green-100 text-green-800' },
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => customerId ? navigate(`/customers/${customerId}`) : navigate(-1)}
                            className="p-2 hover:bg-white rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {watch('project_name') || '案件詳細'}
                            </h1>
                            <p className="text-sm text-gray-500">{watch('project_number')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSaving}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        保存する
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                    ? 'border-slate-900 text-slate-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Basic Info Tab */}
                    <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
                        <div className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">案件概要</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">案件名</label>
                                    <input {...register('project_name')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">案件番号 (ID)</label>
                                    <input {...register('project_number')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">カギNo (キーボックス)</label>
                                    <input {...register('key_number')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-2 mb-4">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <h3 className="font-semibold text-gray-900">所在地情報</h3>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
                                    <input {...register('site_postal_code')} className="w-32 px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">設置場所住所</label>
                                    <input {...register('site_address')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Googleマップ座標・URL</label>
                                    <input {...register('map_coordinates')} className="w-full px-3 py-2 border rounded-lg" placeholder="35.681236, 139.767125" />
                                    {watch('map_coordinates') && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${watch('map_coordinates')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                        >
                                            Googleマップで開く
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specs Tab */}
                    <div className={activeTab === 'specs' ? 'block' : 'hidden'}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">ソーラーパネル</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">出力 (kW)</label>
                                        <input type="number" step="0.01" {...register('power_plant_specs.panel_kw')} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">枚数</label>
                                        <input type="number" {...register('power_plant_specs.panel_count')} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">メーカー</label>
                                    <input {...register('power_plant_specs.panel_manufacturer')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">型式</label>
                                    <input {...register('power_plant_specs.panel_model')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">パワーコンディショナ (PCS)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">出力 (kW)</label>
                                        <input type="number" step="0.01" {...register('power_plant_specs.pcs_kw')} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">台数</label>
                                        <input type="number" {...register('power_plant_specs.pcs_count')} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">メーカー</label>
                                    <input {...register('power_plant_specs.pcs_manufacturer')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">型式</label>
                                    <input {...register('power_plant_specs.pcs_model')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Regulatory Tab */}
                    <div className={activeTab === 'regulatory' ? 'block' : 'hidden'}>
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                            <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">認定・制度情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">設備ID (経産省)</label>
                                    <input {...register('regulatory_info.meti_id')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">受電地点特定番号</label>
                                    <input {...register('regulatory_info.power_reception_id')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">FIT単価 (円)</label>
                                    <input type="number" step="0.1" {...register('regulatory_info.fit_rate')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">認定日</label>
                                    <input type="date" {...register('regulatory_info.meti_certification_date')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">運転開始日</label>
                                    <input type="date" {...register('regulatory_info.supply_start_date')} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="font-medium text-sm text-gray-700 mb-3">遠隔監視システム</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">システム名／ステータス</label>
                                        <input {...register('regulatory_info.remote_monitoring_status')} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID/Passなど</label>
                                        <input {...register('regulatory_info.monitoring_credentials')} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Tab */}
                    <div className={activeTab === 'maintenance' ? 'block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">メンテナンス履歴</h2>
                                <button
                                    type="button"
                                    onClick={handleMaintenanceSubmit}
                                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    記録を追加
                                </button>
                            </div>

                            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                                {maintenanceLogs.length === 0 && (
                                    <p className="pl-6 text-gray-500 py-4">履歴はありません</p>
                                )}
                                {maintenanceLogs.map((log) => (
                                    <div key={log.id} className="relative pl-6">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-white ring-2 ring-slate-100 flex items-center justify-center">
                                            <div className={`w-2 h-2 rounded-full ${log.status === 'completed' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                                            <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                                                <div>
                                                    <span className="text-sm font-semibold text-slate-900 mr-2">{log.occurrence_date}</span>
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                        {log.work_type}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    記録者: {log.reported_by || '不明'}
                                                </div>
                                            </div>
                                            <p className="text-gray-800 text-sm mb-2">{log.response}</p>
                                            {log.target_area && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <MapPin className="w-3 h-3" />
                                                    対象: {log.target_area}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contracts Tab */}
                    <div className={activeTab === 'contracts' ? 'block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">契約・請求管理</h2>
                                <button
                                    type="button"
                                    onClick={handleContractSubmit}
                                    className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    契約を追加
                                </button>
                            </div>

                            {contracts.length === 0 && (
                                <p className="text-gray-500 py-4">契約情報はありません</p>
                            )}

                            {contracts.map((contract) => (
                                <div key={contract.id} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {contract.contract_type === 'maintenance' ? '保守契約' : contract.contract_type}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                開始日: {contract.start_date || '未設定'}
                                                {contract.end_date && ` ～ ${contract.end_date}`}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleInvoiceSubmit(contract.id)}
                                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            請求追加
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">年間保守料</span>
                                            <p className="font-medium">¥{(contract.annual_maintenance_fee || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">土地賃料</span>
                                            <p className="font-medium">¥{(contract.land_rent || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">通信料</span>
                                            <p className="font-medium">¥{(contract.communication_fee || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Invoices list */}
                                    {contract.invoices && contract.invoices.length > 0 && (
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">請求履歴</h4>
                                            <div className="space-y-2">
                                                {contract.invoices.map((invoice: Invoice) => (
                                                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-medium">{invoice.billing_period}</span>
                                                            <span className="text-sm text-gray-600">¥{invoice.amount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={invoice.status}
                                                                onChange={(e) => handleInvoiceStatusChange(invoice.id, e.target.value)}
                                                                className={`text-xs px-2 py-1 rounded font-medium ${statusLabels[invoice.status]?.color || 'bg-gray-100'}`}
                                                            >
                                                                <option value="unbilled">未請求</option>
                                                                <option value="billed">請求済</option>
                                                                <option value="paid">入金済</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
