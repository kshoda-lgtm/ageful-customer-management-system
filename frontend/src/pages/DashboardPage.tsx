import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Loader2, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;

                // Fetch invoices for this month with related data
                const billingMonth = `${year}-${String(month).padStart(2, '0')}`;

                const { data: invoices, error } = await supabase
                    .from('invoices')
                    .select(`
                        id,
                        amount,
                        status,
                        billing_period,
                        issue_date,
                        contract_id,
                        contracts (
                            id,
                            project_id,
                            projects (
                                id,
                                project_name,
                                customer_id,
                                customers (
                                    id,
                                    contact_name,
                                    company_name
                                )
                            )
                        )
                    `)
                    .eq('billing_period', billingMonth)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform data for display
                const transformed = (invoices || []).map((inv: any) => ({
                    invoice_id: inv.id,
                    amount: inv.amount || 0,
                    invoice_status: inv.status,
                    billing_date: inv.billing_period,
                    project_id: inv.contracts?.project_id,
                    project_name: inv.contracts?.projects?.project_name || '不明',
                    customer_id: inv.contracts?.projects?.customer_id,
                    customer_name: inv.contracts?.projects?.customers?.company_name ||
                        inv.contracts?.projects?.customers?.contact_name || '不明',
                }));

                setData(transformed);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    const billedCount = data.filter(d => d.invoice_status === 'billed' || d.invoice_status === 'paid').length;
    const paidCount = data.filter(d => d.invoice_status === 'paid').length;
    const paidPercent = data.length > 0 ? Math.round((paidCount / data.length) * 100) : 0;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">月別請求一覧</h1>

                    <div className="flex items-center gap-4 bg-white p-1 rounded-lg border shadow-sm">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                        >
                            ←
                        </button>
                        <span className="font-semibold text-lg min-w-[120px] text-center">
                            {format(currentDate, 'yyyy年 M月')}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                        >
                            →
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium">請求総額 (予定)</p>
                        <p className="text-3xl font-bold mt-2 text-slate-900">¥{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium">請求済み</p>
                        <p className="text-3xl font-bold mt-2 text-blue-600">{billedCount}件</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium">入金完了</p>
                        <p className="text-3xl font-bold mt-2 text-green-600">{paidPercent}%</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                        <h2 className="font-semibold text-gray-800">請求対象案件</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="案件名で検索..."
                                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 w-64"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            対象データの請求情報はありません
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-3 border-b">ステータス</th>
                                    <th className="px-6 py-3 border-b">顧客名</th>
                                    <th className="px-6 py-3 border-b">案件名</th>
                                    <th className="px-6 py-3 border-b text-right">請求金額</th>
                                    <th className="px-6 py-3 border-b text-center">保守予定</th>
                                    <th className="px-6 py-3 border-b"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.invoice_id} className="hover:bg-gray-50/50 border-b last:border-0 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                item.invoice_status === 'paid' ? "bg-green-100 text-green-800 border-green-200" :
                                                    item.invoice_status === 'billed' ? "bg-blue-100 text-blue-800 border-blue-200" :
                                                        "bg-gray-100 text-gray-800 border-gray-200"
                                            )}>
                                                {item.invoice_status === 'billed' ? '請求済' : item.invoice_status === 'paid' ? '入金済' : '未請求'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <Link to={`/customers/${item.customer_id}`} className="hover:underline">
                                                {item.customer_name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link to={`/projects/${item.project_id}`} className="hover:underline text-slate-600 hover:text-slate-900">
                                                {item.project_name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            ¥{item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-gray-400">-</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-slate-600">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    );
}
