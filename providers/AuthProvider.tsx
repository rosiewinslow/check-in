import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthCtx = { userId?: string | null; loading: boolean; };
const AuthContext = createContext<AuthCtx>({ userId: null, loading: true });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthCtx>({ userId: null, loading: true });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setState({ userId: data.user?.id ?? null, loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ userId: session?.user?.id ?? null, loading: false });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
