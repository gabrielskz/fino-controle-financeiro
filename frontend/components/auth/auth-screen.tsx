"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, CircleDollarSign, KeyRound, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot";

function friendlyError(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.toLowerCase().includes("email rate limit exceeded")) {
    return "O limite temporário de e-mails do Supabase foi atingido. Desative a confirmação de e-mail no Supabase ou aguarde o limite ser liberado.";
  }
  if (message.includes("User already registered")) return "Este e-mail já possui uma conta.";
  if (message.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  return message;
}

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmation("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (resetError) throw resetError;
        setMessage("Enviamos um link para seu e-mail. Abra-o para criar uma nova senha.");
        return;
      }

      if (mode === "signup") {
        if (password !== confirmation) throw new Error("As senhas não são iguais.");
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signupError) throw signupError;
        if (!data.session) {
          setMessage("Cadastro criado, mas a confirmação de e-mail ainda está habilitada no Supabase.");
        }
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (loginError) throw loginError;
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : "Não foi possível continuar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f3f3ee] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#17231d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-[#d8ff65]/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d8ff65] text-[#17231d]"><CircleDollarSign size={25} /></div>
          <span className="text-2xl font-bold tracking-[-0.05em]">fino.</span>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#d8ff65]">Controle financeiro pessoal</p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.055em]">Seu dinheiro organizado, onde você estiver.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/55">Lançamentos, recorrências e relatórios protegidos na sua conta.</p>
        </div>
        <p className="relative text-xs text-white/35">Seus dados ficam protegidos pelo Supabase.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17231d] text-[#d8ff65]"><CircleDollarSign size={22} /></div>
            <span className="text-2xl font-bold tracking-[-0.05em]">fino.</span>
          </div>

          {mode === "forgot" ? (
            <button onClick={() => changeMode("login")} className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#68716b]"><ArrowLeft size={17} /> Voltar para o login</button>
          ) : (
            <div className="mb-7 grid grid-cols-2 rounded-2xl bg-[#e7e8e2] p-1.5">
              <button onClick={() => changeMode("login")} className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === "login" ? "bg-white shadow-sm" : "text-[#747c77]"}`}>Entrar</button>
              <button onClick={() => changeMode("signup")} className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === "signup" ? "bg-white shadow-sm" : "text-[#747c77]"}`}>Criar conta</button>
            </div>
          )}

          <div className="mb-7">
            <h2 className="text-3xl font-semibold tracking-[-0.045em]">{mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Crie sua conta" : "Recuperar senha"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#747c77]">{mode === "forgot" ? "Informe o e-mail usado no cadastro para receber o link de troca." : "Use seu e-mail como usuário de acesso."}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">E-mail</span>
              <div className="flex items-center rounded-2xl border border-[#d5d7cf] bg-white px-4 focus-within:border-[#66736b] focus-within:ring-4 focus-within:ring-[#d8ff65]/25">
                <Mail size={18} className="text-[#8a918c]" />
                <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" className="min-w-0 flex-1 bg-transparent px-3 py-3.5 outline-none" />
              </div>
            </label>

            {mode !== "forgot" && <label className="block">
              <span className="mb-2 block text-sm font-semibold">Senha</span>
              <div className="flex items-center rounded-2xl border border-[#d5d7cf] bg-white px-4 focus-within:border-[#66736b] focus-within:ring-4 focus-within:ring-[#d8ff65]/25">
                <KeyRound size={18} className="text-[#8a918c]" />
                <input type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" className="min-w-0 flex-1 bg-transparent px-3 py-3.5 outline-none" />
              </div>
            </label>}

            {mode === "signup" && <label className="block">
              <span className="mb-2 block text-sm font-semibold">Confirmar senha</span>
              <input type="password" required minLength={6} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-2xl border border-[#d5d7cf] bg-white px-4 py-3.5 outline-none focus:border-[#66736b] focus:ring-4 focus:ring-[#d8ff65]/25" />
            </label>}

            {error && <p className="rounded-xl bg-[#fff0ed] px-4 py-3 text-sm font-medium text-[#a43f35]">{error}</p>}
            {message && <p className="rounded-xl bg-[#e7f5ec] px-4 py-3 text-sm font-medium text-[#276449]">{message}</p>}

            <button disabled={loading} className="w-full rounded-2xl bg-[#17231d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#26372e] disabled:opacity-60">{loading ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Cadastrar" : "Enviar link de recuperação"}</button>
          </form>

          {mode === "login" && <button onClick={() => changeMode("forgot")} className="mt-5 w-full text-center text-sm font-semibold text-[#5d6a62] hover:underline">Esqueci minha senha</button>}
        </div>
      </section>
    </main>
  );
}
