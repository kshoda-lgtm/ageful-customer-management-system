import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('正しいメールアドレスを入力してください'),
    password: z.string().min(6, 'パスワードは6文字以上です'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError('');
        try {
            const result = await login(data.email, data.password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error || 'ログインに失敗しました');
            }
        } catch {
            setError('ログインに失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8 flex flex-col items-center">
                    <img src="/logo.png" alt="Ageful Solar" className="h-12 w-auto object-contain mb-4" />
                    {/* <h1 className="text-2xl font-bold text-gray-900">Ageful 顧客管理システム</h1> */}
                    <p className="text-sm text-gray-500 mt-2">ログインして管理画面へアクセス</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                        <input
                            {...register('email')}
                            type="email"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="admin@ageful.jp"
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                        <input
                            {...register('password')}
                            type="password"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'ログイン'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                        初期ユーザー登録は管理者のみ可能です
                    </p>
                </div>
            </div>
        </div>
    );
}
