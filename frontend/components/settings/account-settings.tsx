"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { KeyRound, Mail, ShieldAlert, Trash2 } from "lucide-react";

import { deleteOwnAccount } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export function AccountSettings({ user }: { user: User }) {
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"email" | "password" | "delete" | null>(null);

  async function updateEmail(event: React.FormEvent) {
    event.preventDefault();
    setSaving("email");
    setMessage("");
    setError("");
    try {
      const { error: updateError } = await createClient().auth.updateUser({ email: email.trim() });
      if (updateError) throw updateError;
      setMessage("E-mail atualizado. Se a confirmação estiver ativa no Supabase, confirme o novo endereço.");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(null);
    }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (password.length < 6) return setError("A nova senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirmPassword) return setError("As senhas não coincidem.");
    setSaving("password");
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirmPassword("");
      setMessage("Senha alterada com sucesso.");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(null);
    }
  }

  async function removeAccount() {
    if (deleteConfirmation !== "EXCLUIR") return;
    if (!window.confirm("Excluir definitivamente sua conta e todos os dados? Esta ação não pode ser desfeita.")) return;
    setSaving("delete");
    setMessage("");
    setError("");
    try {
      await deleteOwnAccount();
      await createClient().auth.signOut();
      window.location.assign("/");
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(null);
    }
  }

  return <div className="grid gap-5 xl:grid-cols-2">
    <section className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-[#e4f4ec] text-[#287055]"><Mail size={20} /></div>
      <h2 className="text-lg font-semibold">Alterar e-mail</h2>
      <p className="mt-1 text-sm text-[#737b76]">Este e-mail também é usado para entrar no aplicativo.</p>
      <form onSubmit={updateEmail} className="mt-5 space-y-4">
        <label><span className="mb-1.5 block text-xs font-bold">Novo e-mail</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-xl border border-[#d8dad3] bg-white px-4 py-3 text-sm outline-none" /></label>
        <button disabled={saving !== null || email.trim() === user.email} className="rounded-xl bg-[#17231d] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{saving === "email" ? "Salvando..." : "Atualizar e-mail"}</button>
      </form>
    </section>

    <section className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-[#eee9fa] text-[#664ba0]"><KeyRound size={20} /></div>
      <h2 className="text-lg font-semibold">Alterar senha</h2>
      <p className="mt-1 text-sm text-[#737b76]">Use no mínimo 6 caracteres.</p>
      <form onSubmit={updatePassword} className="mt-5 space-y-4">
        <label><span className="mb-1.5 block text-xs font-bold">Nova senha</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" className="w-full rounded-xl border border-[#d8dad3] bg-white px-4 py-3 text-sm outline-none" /></label>
        <label><span className="mb-1.5 block text-xs font-bold">Confirmar nova senha</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} autoComplete="new-password" className="w-full rounded-xl border border-[#d8dad3] bg-white px-4 py-3 text-sm outline-none" /></label>
        <button disabled={saving !== null} className="rounded-xl bg-[#17231d] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{saving === "password" ? "Salvando..." : "Atualizar senha"}</button>
      </form>
    </section>

    {(message || error) && <div className={`xl:col-span-2 rounded-xl p-4 text-sm ${error ? "bg-[#fff0ed] text-[#a43f35]" : "bg-[#e4f4ec] text-[#287055]"}`}>{error || message}</div>}

    <section className="rounded-[24px] border border-[#e7bdb7] bg-[#fff8f6] p-5 panel-shadow xl:col-span-2 sm:p-6">
      <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f8e9e6] text-[#a94c40]"><ShieldAlert size={20} /></div><div><h2 className="text-lg font-semibold">Excluir conta</h2><p className="mt-1 text-sm text-[#7d6864]">Apaga permanentemente lançamentos, categorias, recorrências e seu acesso.</p></div></div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder="Digite EXCLUIR" className="rounded-xl border border-[#e2c5c0] bg-white px-4 py-3 text-sm outline-none sm:max-w-xs" /><button type="button" onClick={() => void removeAccount()} disabled={deleteConfirmation !== "EXCLUIR" || saving !== null} className="flex items-center justify-center gap-2 rounded-xl bg-[#a94c40] px-5 py-3 text-sm font-bold text-white disabled:opacity-40"><Trash2 size={17} /> {saving === "delete" ? "Excluindo..." : "Excluir minha conta"}</button></div>
    </section>
  </div>;
}

function errorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Não foi possível concluir a operação.";
}
