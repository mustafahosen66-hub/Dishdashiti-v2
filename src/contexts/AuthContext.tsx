import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string | null;
  role: 'owner' | 'admin' | 'employee' | 'tailor' | 'accountant';
  is_active: boolean;
};

type Tenant = {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  plan: string;
  expires_at: string;
  is_blocked: boolean;
  is_owner: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isExpired: () => boolean;
  isBlocked: () => boolean;
  daysLeft: () => number;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  tenant: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  isExpired: () => false,
  isBlocked: () => false,
  daysLeft: () => 0,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (p) {
      setProfile(p as Profile);
      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', p.tenant_id)
        .single();
      setTenant(t as Tenant);
    }
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const isExpired = () => {
    if (!tenant) return false;
    if (tenant.is_owner) return false;
    return new Date(tenant.expires_at).getTime() < Date.now();
  };

  const isBlocked = () => {
    if (!tenant) return false;
    return tenant.is_blocked === true;
  };

  const daysLeft = () => {
    if (!tenant) return 0;
    const diff = new Date(tenant.expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id);
      else {
        setProfile(null);
        setTenant(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        tenant,
        loading,
        signOut,
        refreshProfile,
        isExpired,
        isBlocked,
        daysLeft,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);