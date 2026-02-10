import { useState } from 'react';
import { X, Save, Loader2, Calendar, Receipt } from 'lucide-react';

export type InvoiceFormData = {
    billing_period: string;
    amount: string;
    status: string;
    payment_due_date: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InvoiceFormData) => Promise<void>;
    contractLabel?: string;
};

const STATUS_OPTIONS = [
    { value: 'unbilled', label: '未請求', color: 'bg-gray-100 text-gray-700' },
    { value: 'billed', label: '請求済', color: 'bg-blue-100 text-blue-700' },
    { value: 'paid', label: '入金済', color: 'bg-green-100 text-green-700' },
];

export default function InvoiceModal({ isOpen, onClose, onSubmit, contractLabel }: Props) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [form, setForm] = useState<InvoiceFormData>({
        billing_period: currentMonth,
        amount: '',
        status: 'unbilled',
        payment_due_date: '',
    });
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleChange = (field: keyof InvoiceFormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.billing_period || !form.amount) return;
        setSaving(true);
        try {
            await onSubmit(form);
            setForm({
                billing_period: currentMonth,
                amount: '',
                status: 'unbilled',
                payment_due_date: '',
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert('追加に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">請求を追加</h2>
                            {contractLabel && <p className="text-xs text-gray-500">{contractLabel}</p>}
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Billing Period */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            請求対象年月 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="month"
                            value={form.billing_period}
                            onChange={(e) => handleChange('billing_period', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            請求金額 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">¥</span>
                            <input
                                type="number"
                                value={form.amount}
                                onChange={(e) => handleChange('amount', e.target.value)}
                                placeholder="0"
                                className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Due Date */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            支払期限
                        </label>
                        <input
                            type="date"
                            value={form.payment_due_date}
                            onChange={(e) => handleChange('payment_due_date', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                        <div className="flex gap-3">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleChange('status', opt.value)}
                                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${form.status === opt.value
                                            ? `${opt.color} border-current shadow-sm`
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            キャンセル
                        </button>
                        <button type="submit" disabled={saving || !form.billing_period || !form.amount}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            登録する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
