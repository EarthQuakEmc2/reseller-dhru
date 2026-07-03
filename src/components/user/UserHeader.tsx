import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fmt } from '@/lib/format';
import { Wallet, LogOut, ShieldCheck } from 'lucide-react';

interface Props {
  onAdmin?: () => void;
}

const UserHeader: React.FC<Props> = ({ onAdmin }) => {
  const { user, signOut } = useAuth();
  return (
    <div className="bg-background text-foreground px-5 pt-6 pb-8 rounded-b-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Welcome back</div>
            <div className="font-semibold text-sm">{user?.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <button onClick={onAdmin} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80" title="Admin Panel">
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}
          <button onClick={signOut} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-primary text-primary-foreground rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-primary-foreground/60 uppercase tracking-wider font-medium">Wallet Balance</div>
          <Wallet className="w-4 h-4 text-primary-foreground/60" />
        </div>
        <div className="text-3xl font-bold tracking-tight">{fmt(user?.wallet_balance || 0)}</div>
        <div className="text-xs text-primary-foreground/50 mt-1">{user?.email}</div>
      </div>
    </div>
  );
};

export default UserHeader;
