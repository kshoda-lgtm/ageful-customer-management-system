import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import bcryptjs from 'bcryptjs';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is stored in localStorage
        const storedUser = localStorage.getItem('ageful_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('ageful_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            // Fetch user from Supabase users table
            const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !userData) {
                return { success: false, error: 'ユーザーが見つかりません' };
            }

            // Verify password
            const isValid = await bcryptjs.compare(password, userData.password_hash);
            if (!isValid) {
                return { success: false, error: 'パスワードが間違っています' };
            }

            const user: User = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
            };

            setUser(user);
            localStorage.setItem('ageful_user', JSON.stringify(user));
            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'ログインに失敗しました' };
        }
    };

    const logout = () => {
        localStorage.removeItem('ageful_user');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
