import { useState } from 'react';
import { X, Save, Loader2, MapPin, FileText, Zap } from 'lucide-react';

export type ProjectFormData = {
    project_name: string;
    project_number: string;
    address: string;
    latitude: string;
    longitude: string;
    status: string;
};

const STATUS_OPTIONS = [
    { value: 'active', label: '稼働中', color: 'bg-green-100 text-green-700' },
    { value: 'planning', label: '計画中', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'suspended', label: '停止中', color: 'bg-red-100 text-red-700' },
];

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProjectFormData) => Promise<void>;
    customerName?: string;
};

export default function ProjectModal({ isOpen, onClose, onSubmit, customerName }: Props) {
    const [form, setForm] = useState<ProjectFormData>({
        project_name: '',
        project_number: '',
        address: '',
        latitude: '',
        longitude: '',
        status: 'active',
    });
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleChange = (field: keyof ProjectFormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.project_name) return;
        setSaving(true);
        try {
            await onSubmit(form);
            setForm({
                project_name: '',
                project_number: '',
                address: '',
                latitude: '',
                longitude: '',
                status: 'active',
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
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Zap className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">案件を追加</h2>
                            {customerName && <p className="text-xs text-gray-500">{customerName}</p>}
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Project Name */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            案件名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.project_name}
                            onChange={(e) => handleChange('project_name', e.target.value)}
                            placeholder="例: 千葉第3太陽光発電所"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Project Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">案件番号</label>
                        <input
                            type="text"
                            value={form.project_number}
                            onChange={(e) => handleChange('project_number', e.target.value)}
                            placeholder="例: PRJ-2026-003"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            所在地
                        </label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="例: 千葉県市原市..."
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">緯度</label>
                            <input
                                type="text"
                                value={form.latitude}
                                onChange={(e) => handleChange('latitude', e.target.value)}
                                placeholder="35.xxxx"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">経度</label>
                            <input
                                type="text"
                                value={form.longitude}
                                onChange={(e) => handleChange('longitude', e.target.value)}
                                placeholder="139.xxxx"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
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
                        <button type="submit" disabled={saving || !form.project_name}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            登録する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
