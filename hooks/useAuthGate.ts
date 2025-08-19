import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAuthGate() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    // 앱 시작 시 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(!!data.session);
      setReady(true);
    });

    // 세션 변경 감지
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSignedIn(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { ready, signedIn };
}
