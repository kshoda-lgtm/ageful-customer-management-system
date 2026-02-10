import { useState } from 'react';
import { X, Save, Loader2, Calendar, DollarSign } from 'lucide-react';

export type ContractFormData = {
    contract_type: string;
    start_date: string;
    end_date: string;
    business_owner: string;
    contractor: string;
    subcontractor: string;
    annual_maintenance_fee: string;
    land_rent: string;
    communication_fee: string;
};

const CONTRACT_TYPES = [
    { value: 'maintenance', label: '保守契約' },
    { value: 'land_lease', label: '土地賃貸借契約' },
    { value: 'other', label: 'その他' },
];

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ContractFormData) => Promise<void>;
};

export default function ContractModal({ isOpen, onClose, onSubmit }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState<ContractFormData>({
        contract_type: 'maintenance',
        start_date: today,
        end_date: '',
        business_owner: '',
        contractor: '',
        subcontractor: '',
        annual_maintenance_fee: '',
        land_rent: '',
        communication_fee: '',
    });
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleChange = (field: keyof ContractFormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.start_date) return;
        setSaving(true);
        try {
            await onSubmit(form);
            // Reset form
            setForm({
                contract_type: 'maintenance',
                start_date: today,
                end_date: '',
                business_owner: '',
                contractor: '',
                subcontractor: '',
                annual_maintenance_fee: '',
                land_rent: '',
                communication_fee: '',
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">契約を追加</h2>
                            <p className="text-xs text-gray-500">新しい契約情報を登録します</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Contract Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">契約種別</label>
                        <div className="flex gap-2">
                            {CONTRACT_TYPES.map(ct => (
                                <button
                                    key={ct.value}
                                    type="button"
                                    onClick={() => handleChange('contract_type', ct.value)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${form.contract_type === ct.value
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {ct.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                契約開始日 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => handleChange('start_date', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                契約終了日
                            </label>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={(e) => handleChange('end_date', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">契約当事者</h3>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">事業主</label>
                            <input
                                type="text"
                                value={form.business_owner}
                                onChange={(e) => handleChange('business_owner', e.target.value)}
                                placeholder="事業主名"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">元請</label>
                                <input
                                    type="text"
                                    value={form.contractor}
                                    onChange={(e) => handleChange('contractor', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">下請</label>
                                <input
                                    type="text"
                                    value={form.subcontractor}
                                    onChange={(e) => handleChange('subcontractor', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fees */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">費用（税抜）</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">年間保守料</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                                    <input
                                        type="number"
                                        value={form.annual_maintenance_fee}
                                        onChange={(e) => handleChange('annual_maintenance_fee', e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">土地賃料</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                                    <input
                                        type="number"
                                        value={form.land_rent}
                                        onChange={(e) => handleChange('land_rent', e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">通信料</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                                    <input
                                        type="number"
                                        value={form.communication_fee}
                                        onChange={(e) => handleChange('communication_fee', e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            キャンセル
                        </button>
                        <button type="submit" disabled={saving || !form.start_date}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            登録する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
