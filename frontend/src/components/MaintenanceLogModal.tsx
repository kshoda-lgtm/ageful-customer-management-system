import { useState } from 'react';
import { X, Save, Loader2, Calendar, Wrench, MapPin, FileText, AlertCircle } from 'lucide-react';

export type MaintenanceLogFormData = {
    occurrence_date: string;
    inquiry_date: string;
    work_type: string;
    target_area: string;
    situation: string;
    response: string;
    report: string;
    status: string;
};

const WORK_TYPES = [
    '除草',
    '点検',
    'パネル清掃',
    'PCS故障対応',
    'フェンス修繕',
    '獣害対策',
    '電気設備点検',
    '遠隔監視対応',
    'その他',
];

const STATUS_OPTIONS = [
    { value: 'pending', label: '未対応', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: '対応中', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: '完了', color: 'bg-green-100 text-green-800' },
];

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MaintenanceLogFormData) => Promise<void>;
    initialData?: Partial<MaintenanceLogFormData>;
    isEditing?: boolean;
};

export default function MaintenanceLogModal({ isOpen, onClose, onSubmit, initialData, isEditing = false }: Props) {
    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState<MaintenanceLogFormData>({
        occurrence_date: initialData?.occurrence_date || today,
        inquiry_date: initialData?.inquiry_date || '',
        work_type: initialData?.work_type || '',
        target_area: initialData?.target_area || '',
        situation: initialData?.situation || '',
        response: initialData?.response || '',
        report: initialData?.report || '',
        status: initialData?.status || 'pending',
    });

    const [saving, setSaving] = useState(false);
    const [customWorkType, setCustomWorkType] = useState('');
    const [useCustomWorkType, setUseCustomWorkType] = useState(
        initialData?.work_type ? !WORK_TYPES.includes(initialData.work_type) : false
    );

    if (!isOpen) return null;

    const handleChange = (field: keyof MaintenanceLogFormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleWorkTypeSelect = (type: string) => {
        if (type === 'その他') {
            setUseCustomWorkType(true);
            setForm(prev => ({ ...prev, work_type: customWorkType }));
        } else {
            setUseCustomWorkType(false);
            setForm(prev => ({ ...prev, work_type: type }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.occurrence_date || !form.work_type) return;

        setSaving(true);
        try {
            const submitData = {
                ...form,
                work_type: useCustomWorkType ? customWorkType : form.work_type,
            };
            await onSubmit(submitData);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 animate-in">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Wrench className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'メンテナンス記録を編集' : 'メンテナンス記録を追加'}
                            </h2>
                            <p className="text-xs text-gray-500">作業履歴を詳細に記録します</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Date Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                発生日 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.occurrence_date}
                                onChange={(e) => handleChange('occurrence_date', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                問い合わせ日
                            </label>
                            <input
                                type="date"
                                value={form.inquiry_date}
                                onChange={(e) => handleChange('inquiry_date', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Work Type Section */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                            <Wrench className="w-3.5 h-3.5" />
                            作業種別 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {WORK_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleWorkTypeSelect(type)}
                                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${(type === 'その他' && useCustomWorkType) ||
                                            (!useCustomWorkType && form.work_type === type)
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        {useCustomWorkType && (
                            <input
                                type="text"
                                value={customWorkType}
                                onChange={(e) => {
                                    setCustomWorkType(e.target.value);
                                    setForm(prev => ({ ...prev, work_type: e.target.value }));
                                }}
                                placeholder="作業種別を入力..."
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mt-2"
                                autoFocus
                            />
                        )}
                    </div>

                    {/* Target Area */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            対象エリア
                        </label>
                        <input
                            type="text"
                            value={form.target_area}
                            onChange={(e) => handleChange('target_area', e.target.value)}
                            placeholder="例: A区画南側、パワコン2号機周辺"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* Situation */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            状況
                        </label>
                        <textarea
                            value={form.situation}
                            onChange={(e) => handleChange('situation', e.target.value)}
                            placeholder="発見時の状況を記録..."
                            rows={2}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        />
                    </div>

                    {/* Response */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            対応内容 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.response}
                            onChange={(e) => handleChange('response', e.target.value)}
                            placeholder="実施した作業内容を記録..."
                            rows={3}
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        />
                    </div>

                    {/* Report */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            報告・備考
                        </label>
                        <textarea
                            value={form.report}
                            onChange={(e) => handleChange('report', e.target.value)}
                            placeholder="追加の報告事項や備考があれば..."
                            rows={2}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                        <div className="flex gap-3">
                            {STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleChange('status', opt.value)}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${form.status === opt.value
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
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !form.occurrence_date || !form.work_type}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isEditing ? '更新する' : '記録する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
