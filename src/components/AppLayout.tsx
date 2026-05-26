import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthScreen from './AuthScreen';
import UserPanel from './user/UserPanel';
import AdminPanel from './admin/AdminPanel';
import { Loader2 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  if (user.role === 'admin' && showAdmin) return <AdminPanel onExitAdmin={() => setShowAdmin(false)} />;

  return <UserPanel onAdmin={() => setShowAdmin(true)} />;
};

export default AppLayout;
