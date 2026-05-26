import React, { useState } from 'react';
import UserHeader from './UserHeader';
import DepositModal from './DepositModal';
import ServicesList from './ServicesList';
import OrdersList from './OrdersList';
import WalletHistory from './WalletHistory';
import { Smartphone, Server, Monitor, Plus, Receipt, Wallet, Home } from 'lucide-react';

interface Props { onAdmin: () => void; }

type Tab = 'home' | 'imei' | 'server' | 'remote' | 'orders' | 'wallet';

const UserPanel: React.FC<Props> = ({ onAdmin }) => {
  const [tab, setTab] = useState<Tab>('home');
  const [depositOpen, setDepositOpen] = useState(false);

  const renderContent = () => {
    if (tab === 'home') {
      return (
        <div className="px-4 pb-24">
          <div className="-mt-4 mb-4">
            <button
              onClick={() => setDepositOpen(true)}
              className="w-full bg-primary border-2 border-primary text-primary-foreground rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition"
            >
              <Plus className="w-4 h-4" /> Add Funds
            </button>
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Services</h2>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <ServiceTile icon={Smartphone} label="IMEI" onClick={() => setTab('imei')} />
            <ServiceTile icon={Server} label="Server" onClick={() => setTab('server')} />
            <ServiceTile icon={Monitor} label="Remote" onClick={() => setTab('remote')} />
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickTile icon={Receipt} label="My Orders" onClick={() => setTab('orders')} />
            <QuickTile icon={Wallet} label="Wallet" onClick={() => setTab('wallet')} />
          </div>
        </div>
      );
    }
    if (tab === 'imei') return <ServicesList serviceType="imei" />;
    if (tab === 'server') return <ServicesList serviceType="server" />;
    if (tab === 'remote') return <ServicesList serviceType="remote" />;
    if (tab === 'orders') return <OrdersList />;
    if (tab === 'wallet') return <WalletHistory />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <UserHeader onAdmin={onAdmin} />
      <div className="max-w-2xl mx-auto">
        {renderContent()}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-card text-foreground border-t border-border">
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          <NavBtn active={tab === 'home'} onClick={() => setTab('home')} icon={Home} label="Home" />
          <NavBtn active={tab === 'imei'} onClick={() => setTab('imei')} icon={Smartphone} label="IMEI" />
          <NavBtn active={tab === 'server'} onClick={() => setTab('server')} icon={Server} label="Server" />
          <NavBtn active={tab === 'remote'} onClick={() => setTab('remote')} icon={Monitor} label="Remote" />
          <NavBtn active={tab === 'orders'} onClick={() => setTab('orders')} icon={Receipt} label="Orders" />
        </div>
      </nav>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
    </div>
  );
};

const ServiceTile: React.FC<{ icon: any; label: string; onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="aspect-square bg-primary text-primary-foreground rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary/90 transition">
    <Icon className="w-6 h-6" />
    <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
  </button>
);

const QuickTile: React.FC<{ icon: any; label: string; onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-foreground transition">
    <Icon className="w-5 h-5" />
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`py-3 flex flex-col items-center gap-1 transition ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
    <Icon className="w-4 h-4" />
    <span className="text-[10px] font-semibold">{label}</span>
    {active && <div className="absolute top-0 w-8 h-0.5 bg-primary" />}
  </button>
);

export default UserPanel;
