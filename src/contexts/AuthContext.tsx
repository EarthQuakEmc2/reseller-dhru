import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  wallet_balance: number;
  role: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error?: string }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  oauthMock: (provider: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({} as any);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('dhru_user_id');
    if (stored) {
      loadUser(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (id: string) => {
    const { data } = await supabase.from('dhru_users').select('*').eq('id', id).maybeSingle();
    if (data) setUser(data as AppUser);
  };

  const refreshUser = async () => {
    if (user) await loadUser(user.id);
  };

  const signIn = async (email: string, password: string) => {
    const { data } = await supabase.from('dhru_users').select('*').eq('email', email.toLowerCase()).maybeSingle();
    if (!data) return { error: 'User not found' };
    if (data.password_hash !== password) return { error: 'Invalid password' };
    localStorage.setItem('dhru_user_id', data.id);
    setUser(data as AppUser);
    return {};
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const existing = await supabase.from('dhru_users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existing.data) return { error: 'Email already registered' };
    const { data, error } = await supabase.from('dhru_users').insert({
      email: email.toLowerCase(), password_hash: password, name, phone, role: 'user', wallet_balance: 0
    }).select('*').single();
    if (error) return { error: error.message };
    localStorage.setItem('dhru_user_id', data.id);
    setUser(data as AppUser);
    return {};
  };

  const oauthMock = async (provider: string) => {
    const email = `${provider}_user_${Date.now()}@oauth.local`;
    const { data, error } = await supabase.from('dhru_users').insert({
      email, password_hash: 'oauth', name: `${provider} User`,
      oauth_provider: provider, role: 'user', wallet_balance: 0
    }).select('*').single();
    if (error) return { error: error.message };
    localStorage.setItem('dhru_user_id', data.id);
    setUser(data as AppUser);
    return {};
  };

  const signOut = () => {
    localStorage.removeItem('dhru_user_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser, oauthMock }}>
      {children}
    </AuthContext.Provider>
  );
};
