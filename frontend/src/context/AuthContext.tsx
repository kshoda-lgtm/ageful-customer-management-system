import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiLogin } from '../lib/api';

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
            const result = await apiLogin(email, password);

            if (!result.success) {
                return { success: false, error: result.error || 'ログインに失敗しました' };
            }

            const loggedInUser: User = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
            };

            setUser(loggedInUser);
            localStorage.setItem('ageful_user', JSON.stringify(loggedInUser));
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
