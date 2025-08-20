// providers/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthCtx = { userId: string | null; userEmail?: string | null; loading: boolean };
const Ctx = createContext<AuthCtx>({ userId: null, loading: true });

export const useAuth = () => useContext(Ctx);


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

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
