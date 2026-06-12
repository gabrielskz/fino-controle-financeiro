"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, X } from "lucide-react";

import { currencyInput, parseCurrency } from "@/lib/format";
import type { Category, Entry, EntryKind, EntrySubmission, EntryStatus } from "@/lib/types";

interface EntryFormProps {
  month: string;
  entry: Entry | null;
  initialKind: EntryKind;
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onSave: (submission: EntrySubmission) => Promise<void>;
  onCreateCategory: (name: string, kind: EntryKind) => Promise<Category>;
}

export function EntryForm({ month, entry, initialKind, categories, saving, onClose, onSave, onCreateCategory }: EntryFormProps) {
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? initialKind);
  const availableCategories = useMemo(() => categories.filter((item) => item.kind === kind), [categories, kind]);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [amount, setAmount] = useState(entry ? currencyInput(entry.amount_cents) : "");
  const [category, setCategory] = useState(entry?.category ?? categories.find((item) => item.kind === initialKind)?.name ?? "");
  const [status, setStatus] = useState<EntryStatus>(entry?.status ?? (initialKind === "expense" ? "pending" : "received"));
  const [dueDate, setDueDate] = useState(entry?.due_date ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(2);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function changeKind(nextKind: EntryKind) {
    setKind(nextKind);
    setCategory(categories.find((item) => item.kind === nextKind)?.name ?? "");
    setStatus(nextKind === "expense" ? "pending" : "received");
    setCreatingCategory(false);
    if (nextKind === "income") setInstallmentEnabled(false);
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    try {
      const created = await onCreateCategory(newCategory, kind);
      setCategory(created.name);
      setNewCategory("");
      setCreatingCategory(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar a categoria.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cents = parseCurrency(amount);
    if (!description.trim()) return setError("Informe uma descrição.");
    if (cents <= 0) return setError("Informe um valor maior que zero.");
    if (!category) return setError("Escolha uma categoria.");
    setError("");
    if (installmentEnabled && !dueDate) return setError("Informe a data da primeira parcela.");
    await onSave({
      payload: { description: description.trim(), amount_cents: cents, kind, category, status, due_date: dueDate || null, reference_month: month, notes: notes.trim() || null, recurrence_id: entry?.recurrence_id ?? null },
      installment_count: installmentEnabled ? installmentCount : 1,
    });
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101b16]/55 backdrop-blur-[3px] sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="fade-in max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-[#fbfbf8] p-5 shadow-2xl sm:max-w-[610px] sm:rounded-[28px] sm:p-7"><div className="mb-6 flex items-start justify-between"><div><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#778079]">{entry ? "Editar lançamento" : "Novo lançamento"}</p><h2 className="text-2xl font-semibold tracking-[-0.03em]">{entry ? entry.description : "Organize uma movimentação"}</h2></div><button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full border border-[#dedfd8] p-2 text-[#626b65]"><X size={19} /></button></div><form onSubmit={submit} className="space-y-5"><div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#edeee8] p-1.5"><button type="button" onClick={() => changeKind("expense")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${kind === "expense" ? "bg-white shadow-sm" : "text-[#737b76]"}`}><ArrowUpRight size={17} /> Despesa</button><button type="button" onClick={() => changeKind("income")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${kind === "income" ? "bg-white shadow-sm" : "text-[#737b76]"}`}><ArrowDownLeft size={17} /> Receita</button></div><label className="block"><span className="mb-2 block text-sm font-semibold">Descrição</span><input autoFocus required value={description} onChange={(event) => setDescription(event.target.value)} placeholder={kind === "expense" ? "Ex.: Notebook" : "Ex.: Salário"} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none focus:border-[#5a715f] focus:ring-4 focus:ring-[#d8ff65]/25" /></label><div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">{installmentEnabled ? "Valor total da compra" : "Valor"}</span><div className="flex rounded-2xl border border-[#d8dad3] bg-white"><span className="py-3.5 pl-4 font-semibold text-[#7a817c]">R$</span><input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" className="min-w-0 flex-1 bg-transparent px-2 py-3.5 font-semibold outline-none" /></div></label><label><span className="mb-2 block text-sm font-semibold">{installmentEnabled ? "Data da primeira parcela" : "Data"}</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none" /></label></div>{kind === "expense" && !entry && <div className="rounded-2xl border border-[#d8dad3] bg-white p-4"><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={installmentEnabled} onChange={(event) => setInstallmentEnabled(event.target.checked)} className="h-4 w-4" /> Dividir esta compra em parcelas</label>{installmentEnabled && <div className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr]"><label><span className="mb-2 block text-xs font-bold text-[#737b76]">Quantidade</span><input type="number" min={2} max={120} value={installmentCount} onChange={(event) => setInstallmentCount(Math.min(120, Math.max(2, Number(event.target.value))))} className="w-full rounded-xl border border-[#d8dad3] px-3 py-2.5" /></label><div className="rounded-xl bg-[#edeee8] px-4 py-3 text-sm"><p className="font-semibold">{installmentCount} parcelas de aproximadamente {currencyInput(Math.floor(parseCurrency(amount) / installmentCount))}</p><p className="mt-1 text-xs text-[#737b76]">Uma parcela será lançada em cada mês.</p></div></div>}</div>}<div className="grid gap-5 sm:grid-cols-2"><div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold">Categoria</label><button type="button" onClick={() => setCreatingCategory((value) => !value)} className="flex items-center gap-1 text-xs font-bold text-[#4f6758]"><Plus size={13} /> Nova</button></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none">{availableCategories.map((item) => <option key={item.id}>{item.name}</option>)}</select>{creatingCategory && <div className="mt-2 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Nome da categoria" className="min-w-0 flex-1 rounded-xl border border-[#d8dad3] bg-white px-3 py-2.5 text-sm" /><button type="button" onClick={() => void addCategory()} className="rounded-xl bg-[#17231d] px-3 text-xs font-bold text-white">Criar</button></div>}</div><label><span className="mb-2 block text-sm font-semibold">Situação</span><select value={status} onChange={(event) => setStatus(event.target.value as EntryStatus)} disabled={installmentEnabled} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none disabled:opacity-60"><option value="pending">Pendente</option>{kind === "expense" ? <option value="paid">Pago</option> : <option value="received">Recebido</option>}</select></label></div><label className="block"><span className="mb-2 block text-sm font-semibold">Observações <i className="font-normal text-[#8c928e]">(opcional)</i></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none" /></label>{error && <p className="rounded-xl bg-[#fff0ed] px-4 py-3 text-sm font-medium text-[#a43f35]">{error}</p>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-2xl border border-[#d8dad3] px-5 py-3.5 text-sm font-semibold">Cancelar</button><button disabled={saving} className="rounded-2xl bg-[#17211c] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Salvando..." : entry ? "Salvar alterações" : installmentEnabled ? `Criar ${installmentCount} parcelas` : "Adicionar lançamento"}</button></div></form></div></div>;
}
