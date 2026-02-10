import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = window.location.pathname;

  useEffect(() => {
    if (!loading && !user && !path.startsWith('/login')) {
      navigate('/login');
    }
    if (!loading && user && path.startsWith('/login')) {
      navigate('/');
    }
  }, [user, loading, navigate, path]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Outlet />
    </div>
  );
}

export default App;
