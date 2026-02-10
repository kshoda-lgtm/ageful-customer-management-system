import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import api from '../lib/api';
import { Loader2, Save, ArrowLeft, Building2, MapPin, Phone, Mail, FileText, Plus } from 'lucide-react';
import type { Customer, Project } from '../types';

export default function CustomerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<Customer>();

    useEffect(() => {
        if (id === 'new') {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const res = await api.get(`/customers/${id}`);
                // Separate projects from customer data for form handling
                const { projects: initialProjects, ...customerData } = res.data;
                reset(customerData);
                setProjects(initialProjects || []);
            } catch (err) {
                console.error(err);
                navigate('/customers');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, reset]);

    const onSubmit = async (data: Customer) => {
        setIsSaving(true);
        try {
            if (id === 'new') {
                const res = await api.post('/customers', data);
                navigate(`/customers/${res.data.id}`);
            } else {
                await api.put(`/customers/${id}`, data);
                // Standard toast success message could go here
                alert('保存しました');
            }
        } catch (err) {
            console.error(err);
            alert('エラーが発生しました');
        } finally {
            setIsSaving(false);
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

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/customers')}
                        className="p-2 hover:bg-white rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {id === 'new' ? '新規顧客登録' : '顧客詳細・編集'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Basic & Billing Info Combined Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Left Column: Basic Info */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                                <Building2 className="w-5 h-5 text-slate-400" />
                                <h2 className="font-semibold text-lg text-gray-800">基本情報</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">氏名・担当者名 <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('contact_name', { required: '必須項目です' })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholder="田中 太郎"
                                    />
                                    {errors.contact_name && <p className="text-red-500 text-xs mt-1">{errors.contact_name.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">会社名（法人・屋号）</label>
                                    <input
                                        {...register('company_name')}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholder="株式会社 エイジフル"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                            <input
                                                {...register('phone')}
                                                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                placeholder="090-0000-0000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                            <input
                                                {...register('email')}
                                                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                        <input
                                            {...register('address')}
                                            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            placeholder="東京都渋谷区..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                                    <textarea
                                        {...register('notes')}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Billing Info & Projects */}
                        <div className="space-y-6">
                            {/* Billing Info */}
                            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                                <div className="flex items-center gap-2 border-b pb-4 mb-4">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                    <h2 className="font-semibold text-lg text-gray-800">請求書送付先</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">請求先宛名</label>
                                        <input
                                            {...register('billing_contact_name')}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            placeholder="上記と同じ場合は空欄"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
                                            <input
                                                {...register('billing_postal_code')}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                placeholder="000-0000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">請求先住所</label>
                                        <input
                                            {...register('billing_address')}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            placeholder="上記と同じ場合は空欄"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Projects List (Only for existing users) */}
                            {id !== 'new' && (
                                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-slate-400" />
                                            <h2 className="font-semibold text-lg text-gray-800">所有案件</h2>
                                        </div>
                                        <button type="button" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                            <Plus className="w-3 h-3" />
                                            案件追加
                                        </button>
                                    </div>

                                    {projects.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">登録されている案件はありません</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {projects.map(proj => (
                                                <div
                                                    key={proj.id}
                                                    onClick={() => navigate(`/projects/${proj.id}`)}
                                                    className="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center cursor-pointer transition-colors group"
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{proj.project_name}</p>
                                                        <p className="text-xs text-gray-500">{proj.project_number}</p>
                                                    </div>
                                                    <ArrowLeft className="w-4 h-4 rotate-180 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/customers')}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-slate-900 text-white px-8 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
