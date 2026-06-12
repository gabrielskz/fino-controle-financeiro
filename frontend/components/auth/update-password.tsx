"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, CircleDollarSign } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) return setError("As senhas não são iguais.");
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError(updateError.message);
    await supabase.auth.signOut();
    setSuccess(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f3ee] p-5">
      <div className="w-full max-w-md rounded-[28px] border border-[#dedfd8] bg-[#fbfbf8] p-7 panel-shadow sm:p-9">
        <div className="mb-7 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17231d] text-[#d8ff65]"><CircleDollarSign size={22} /></div><span className="text-2xl font-bold tracking-[-0.05em]">fino.</span></div>
        {success ? <div className="text-center"><CheckCircle2 size={44} className="mx-auto text-[#287055]" /><h1 className="mt-5 text-2xl font-semibold">Senha alterada</h1><p className="mt-2 text-sm text-[#747c77]">Agora você já pode entrar com a nova senha.</p><Link href="/" className="mt-6 inline-block rounded-2xl bg-[#17231d] px-6 py-3 text-sm font-bold text-white">Ir para o login</Link></div> : <>
          <h1 className="text-2xl font-semibold tracking-[-0.035em]">Crie uma nova senha</h1>
          <p className="mt-2 text-sm text-[#747c77]">Escolha uma senha com pelo menos 6 caracteres.</p>
          {!ready ? <p className="mt-6 rounded-xl bg-[#f1eee3] px-4 py-3 text-sm text-[#796824]">Validando o link de recuperação...</p> : <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold">Nova senha</span><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#d5d7cf] bg-white px-4 py-3.5 outline-none focus:border-[#66736b] focus:ring-4 focus:ring-[#d8ff65]/25" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Confirmar nova senha</span><input type="password" required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-2xl border border-[#d5d7cf] bg-white px-4 py-3.5 outline-none focus:border-[#66736b] focus:ring-4 focus:ring-[#d8ff65]/25" /></label>
            {error && <p className="rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#a43f35]">{error}</p>}
            <button disabled={loading} className="w-full rounded-2xl bg-[#17231d] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">{loading ? "Salvando..." : "Trocar senha"}</button>
          </form>}
        </>}
      </div>
    </main>
  );
}
