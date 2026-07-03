import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Trash2, RefreshCw, Wifi, Loader2 } from 'lucide-react';

type Line = { time: string; type: 'info' | 'success' | 'error' | 'cmd' | 'data'; text: string };

const AdminTerminal: React.FC = () => {
  const [lines, setLines] = useState<Line[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const log = (type: Line['type'], text: string) => {
    setLines((prev) => [...prev, { time: new Date().toLocaleTimeString(), type, text }]);
  };

  useEffect(() => {
    log('info', 'DHRU API Terminal initialized');
    log('info', 'Endpoint: https://easy-unlocker.com/api/index.php');
    loadRecentLogs();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const loadRecentLogs = async () => {
    const { data } = await supabase.from('dhru_api_logs').select('*').order('created_at', { ascending: false }).limit(20);
    if (data && data.length > 0) {
      log('info', `Loaded ${data.length} recent log entries`);
      [...data].reverse().forEach((l) => {
        log('cmd', `> ${l.action} (${l.duration_ms}ms)`);
        log(l.status === 'success' ? 'success' : 'error', `  status: ${l.status}`);
        if (l.error_message) log('error', `  error: ${l.error_message}`);
        else if (l.response_data) log('data', `  resp: ${JSON.stringify(l.response_data).slice(0, 200)}...`);
      });
    }
  };

  const testConnection = async () => {
    setTesting(true);
    log('cmd', '> Testing connection to DHRU server...');
    try {
      const { data } = await supabase.functions.invoke('dhru-api', { body: { action: 'test-connection' } });
      if (data?.ok) {
        log('success', `✓ Connected (${data.duration}ms)`);
        log('data', JSON.stringify(data.data).slice(0, 400));
      } else {
        log('error', `✗ Connection failed`);
        log('error', JSON.stringify(data).slice(0, 400));
      }
    } catch (e: any) {
      log('error', `✗ ${e.message}`);
    }
    setTesting(false);
  };

  const syncProducts = async () => {
    setSyncing(true);
    log('cmd', '> Starting product synchronization...');
    log('info', '  fetching IMEI service list...');
    log('info', '  fetching Server service list...');
    log('info', '  fetching Remote service list...');
    try {
      const { data } = await supabase.functions.invoke('dhru-api', { body: { action: 'sync-products' } });
      if (data?.ok) {
        log('success', `✓ Imported ${data.imported} services`);
        if (data.errors?.length) {
          data.errors.forEach((err: string) => log('error', `  ! ${err}`));
        }
      } else {
        log('error', '✗ Sync failed');
        log('error', JSON.stringify(data).slice(0, 600));
      }
    } catch (e: any) {
      log('error', `✗ ${e.message}`);
    }
    setSyncing(false);
  };

  const clearTerminal = () => setLines([]);

  const clearServerLogs = async () => {
    await supabase.functions.invoke('dhru-api', { body: { action: 'clear-logs' } });
    log('info', 'Server logs cleared');
  };

  const colorFor = (t: Line['type']) =>
    t === 'success' ? 'text-green-400' :
    t === 'error' ? 'text-red-400' :
    t === 'cmd' ? 'text-foreground' :
    t === 'data' ? 'text-cyan-300' : 'text-foreground/70';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={testConnection} disabled={testing} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          Test Connection
        </button>
        <button onClick={syncProducts} disabled={syncing} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync Products
        </button>
        <button onClick={loadRecentLogs} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-secondary/80">
          <Play className="w-4 h-4" /> Reload Logs
        </button>
        <button onClick={clearTerminal} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-secondary/80">
          <Trash2 className="w-4 h-4" /> Clear Terminal
        </button>
        <button onClick={clearServerLogs} className="px-4 py-2 bg-red-500/10 text-red-300 border border-red-500/30 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-red-500/20">
          <Trash2 className="w-4 h-4" /> Clear Server Logs
        </button>
      </div>

      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">dhru-api://easy-unlocker.com</span>
        </div>
        <div className="h-[60vh] overflow-y-auto p-4 font-mono text-xs leading-relaxed">
          {lines.map((l, i) => (
            <div key={i} className={colorFor(l.type)}>
              <span className="text-foreground/30 mr-2">[{l.time}]</span>
              {l.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default AdminTerminal;
