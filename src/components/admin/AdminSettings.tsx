import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Eye, EyeOff } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [form, setForm] = useState<any>({ dhru_url: '', dhru_username: '', dhru_password: '', dhru_api_key: '' });
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('dhru_settings').select('*').then(({ data }) => {
      const obj: any = {};
      data?.forEach((s) => obj[s.key] = s.value);
      setForm(obj);
    });
  }, []);

  const save = async () => {
    await supabase.functions.invoke('dhru-api', { body: { action: 'update-settings', settings: form } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="font-bold mb-1">DHRU Fission API Configuration</h3>
        <p className="text-xs text-white/50 mb-5">Credentials for connecting to your DHRU server.</p>

        <div className="space-y-3">
          <Field label="Server URL" value={form.dhru_url} onChange={(v) => setForm({...form, dhru_url: v})} placeholder="https://easy-unlocker.com" />
          <Field label="Username" value={form.dhru_username} onChange={(v) => setForm({...form, dhru_username: v})} />
          <Field label="Password" value={form.dhru_password} onChange={(v) => setForm({...form, dhru_password: v})} type={showSecret ? 'text' : 'password'} />
          <Field label="API Key" value={form.dhru_api_key} onChange={(v) => setForm({...form, dhru_api_key: v})} type={showSecret ? 'text' : 'password'} mono />

          <button onClick={() => setShowSecret((s) => !s)} className="text-xs text-white/60 flex items-center gap-1.5 hover:text-white">
            {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSecret ? 'Hide secrets' : 'Show secrets'}
          </button>
        </div>

        <button onClick={save} className="mt-5 w-full py-3 bg-white text-black rounded-lg font-semibold flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saved ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm">
        <h3 className="font-bold mb-2">About DHRU Fission Integration</h3>
        <p className="text-white/60 leading-relaxed">
          This system uses the DHRU Fission HTTP API to pull IMEI, Server, and Remote services from your panel.
          Once configured, use the <strong>Sync</strong> terminal to import the live service catalog. All product
          edits made here (custom price, custom description, visibility) override the DHRU defaults shown to your customers.
        </p>
      </div>
    </div>
  );
};

const Field: React.FC<any> = ({ label, value, onChange, type = 'text', placeholder, mono }) => (
  <div>
    <label className="block text-xs text-white/60 mb-1 uppercase tracking-wide">{label}</label>
    <input
      type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full px-3 py-2 bg-black border border-white/15 rounded-lg text-white outline-none focus:border-white text-sm ${mono ? 'font-mono' : ''}`}
    />
  </div>
);

export default AdminSettings;
