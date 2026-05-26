import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import AdminTerminal from './AdminTerminal';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';
import AdminRefunds from './AdminRefunds';
import AdminPayments from './AdminPayments';
import AdminSettings from './AdminSettings';
import { LayoutDashboard, Terminal, Package, ShoppingBag, Users, RotateCcw, Settings, LogOut, ArrowLeft, CreditCard } from 'lucide-react';

interface Props { onExitAdmin: () => void; }
type Tab = 'dash' | 'terminal' | 'products' | 'orders' | 'users' | 'payments' | 'refunds' | 'settings';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'terminal', label: 'API Sync', icon: Terminal },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'refunds', label: 'Refunds', icon: RotateCcw },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AdminPanel: React.FC<Props> = ({ onExitAdmin }) => {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dash');
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-white/10 transform ${navOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white text-black rounded-lg flex items-center justify-center font-black">D</div>
            <div>
              <div className="font-bold text-sm">DHRU Admin</div>
              <div className="text-xs text-white/40">Control Center</div>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setNavOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-white text-black' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-white/10 space-y-1">
          <button onClick={onExitAdmin} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to App
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {navOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setNavOpen(false)} />}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="border-b border-white/10 p-4 flex items-center gap-3 lg:hidden">
          <button onClick={() => setNavOpen(true)} className="p-2 rounded-lg bg-white/10">
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <div className="font-bold">DHRU Admin</div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <div className="hidden lg:flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{tabs.find((t) => t.id === tab)?.label}</h1>
          </div>
          {tab === 'dash' && <AdminDashboard />}
          {tab === 'terminal' && <AdminTerminal />}
          {tab === 'products' && <AdminProducts />}
          {tab === 'orders' && <AdminOrders />}
          {tab === 'users' && <AdminUsers />}
          {tab === 'payments' && <AdminPayments />}
          {tab === 'refunds' && <AdminRefunds />}
          {tab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
