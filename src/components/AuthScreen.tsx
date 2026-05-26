import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const { signIn, signUp, oauthMock } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'phone'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'login') {
      const r = await signIn(email, password);
      if (r.error) setError(r.error);
    } else if (mode === 'register') {
      const r = await signUp(email, password, name, phone);
      if (r.error) setError(r.error);
    } else if (mode === 'phone') {
      if (!codeSent) {
        setCodeSent(true);
        setError('Verification code sent: 123456 (demo)');
      } else {
        if (code === '123456') {
          const r = await signUp(`${phone}@phone.local`, 'phone-auth', `User ${phone.slice(-4)}`, phone);
          if (r.error) {
            // try sign-in
            const r2 = await signIn(`${phone}@phone.local`, 'phone-auth');
            if (r2.error) setError(r2.error);
          }
        } else {
          setError('Invalid code. Use 123456');
        }
      }
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: string) => {
    setLoading(true);
    await oauthMock(provider);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-black font-black text-2xl mb-4">
            D
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DHRU Reseller</h1>
          <p className="text-white/60 mt-1 text-sm">IMEI · Server · Remote Services</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl">
            {(['login', 'register', 'phone'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setCodeSent(false); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  mode === m ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : m === 'register' ? 'Register' : 'Phone'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Full name" required
                  className="w-full pl-10 pr-3 py-3 bg-black border border-white/15 rounded-lg text-sm focus:border-white outline-none"
                />
              </div>
            )}
            {mode === 'phone' ? (
              <>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                  <input
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000" required
                    className="w-full pl-10 pr-3 py-3 bg-black border border-white/15 rounded-lg text-sm focus:border-white outline-none"
                  />
                </div>
                {codeSent && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                    <input
                      value={code} onChange={(e) => setCode(e.target.value)}
                      placeholder="6-digit code" required
                      className="w-full pl-10 pr-3 py-3 bg-black border border-white/15 rounded-lg text-sm focus:border-white outline-none tracking-widest"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email" required
                    className="w-full pl-10 pr-3 py-3 bg-black border border-white/15 rounded-lg text-sm focus:border-white outline-none"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" required
                    className="w-full pl-10 pr-3 py-3 bg-black border border-white/15 rounded-lg text-sm focus:border-white outline-none"
                  />
                </div>
                {mode === 'register' && (
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                    <input
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="w-full pl-10 pr-3 py-3 bg-black border border-white/15 rounded-lg text-sm focus:border-white outline-none"
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : codeSent ? 'Verify Code' : 'Send Code'}
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3 text-xs text-white/40 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span>or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => handleOAuth('google')} className="py-2.5 rounded-lg border border-white/15 hover:bg-white hover:text-black transition text-xs font-medium">
                Google
              </button>
              <button type="button" onClick={() => handleOAuth('x')} className="py-2.5 rounded-lg border border-white/15 hover:bg-white hover:text-black transition text-xs font-medium">
                X.com
              </button>
              <button type="button" onClick={() => handleOAuth('facebook')} className="py-2.5 rounded-lg border border-white/15 hover:bg-white hover:text-black transition text-xs font-medium">
                Facebook
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-white/40">
            Demo: admin@dhru.app / admin123 · user@dhru.app / user123
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
