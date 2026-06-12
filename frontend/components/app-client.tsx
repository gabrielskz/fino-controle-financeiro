"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { AuthScreen } from "@/components/auth/auth-screen";
import { Dashboard } from "@/components/dashboard";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AppClient() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [configured]);

  if (!configured) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f3f3ee] p-5"><div className="max-w-lg rounded-[28px] border border-[#dedfd8] bg-white p-8 panel-shadow"><h1 className="text-2xl font-semibold">Conecte o Supabase</h1><p className="mt-3 leading-relaxed text-[#6c746f]">Crie o arquivo <code>.env.local</code> dentro de <code>frontend</code> usando o modelo <code>.env.local.example</code>. O README explica onde encontrar as duas chaves.</p></div></main>;
  }
  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f3f3ee]"><div className="h-9 w-9 animate-spin rounded-full border-4 border-[#d8ff65] border-t-[#17231d]" /></main>;
  if (!user) return <AuthScreen />;
  return <Dashboard user={user} />;
}

