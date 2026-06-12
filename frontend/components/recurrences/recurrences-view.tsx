"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, Pencil, Plus, Power, Trash2, X } from "lucide-react";

import { createRecurrence, deleteRecurrence, getRecurrences, updateRecurrence } from "@/lib/api";
import { currencyInput, currentMonth, formatCurrency, parseCurrency } from "@/lib/format";
import type { Category, EntryKind, Recurrence, RecurrencePayload } from "@/lib/types";

interface RecurrencesViewProps {
  categories: Category[];
  onCreateCategory: (name: string, kind: EntryKind) => Promise<Category>;
  onChanged: () => Promise<void>;
}

export function RecurrencesView({ categories, onCreateCategory, onChanged }: RecurrencesViewProps) {
  const [items, setItems] = useState<Recurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Recurrence | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try { setItems(await getRecurrences()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar."); } finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    void getRecurrences()
      .then((data) => { if (active) setItems(data); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Não foi possível carregar."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(payload: RecurrencePayload) {
    if (editing) await updateRecurrence(editing.id, payload);
    else await createRecurrence(payload);
    setFormOpen(false);
    setEditing(null);
    await load();
    await onChanged();
  }

  async function toggle(item: Recurrence) {
    await updateRecurrence(item.id, { active: !item.active });
    await load();
    await onChanged();
  }

  async function remove(item: Recurrence) {
    if (!window.confirm(`Excluir a recorrência "${item.description}"?`)) return;
    await deleteRecurrence(item.id);
    await load();
    await onChanged();
  }

  return <>
    {error && <p className="mb-5 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm text-[#a43f35]">{error}</p>}
    <div className="mb-5 flex justify-end"><button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 rounded-full bg-[#17231d] px-5 py-3 text-sm font-bold text-white"><Plus size={18} /> Nova recorrência</button></div>
    <section className="overflow-hidden rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] panel-shadow">
      <div className="border-b border-[#e3e4dd] p-6"><h2 className="text-lg font-semibold">Lançamentos recorrentes</h2><p className="mt-1 text-sm text-[#7b827d]">Contas e receitas criadas automaticamente a cada mês.</p></div>
      {loading ? <div className="p-8 text-sm text-[#7b827d]">Carregando...</div> : items.length ? <div>{items.map((item) => <div key={item.id} className="grid gap-3 border-b border-[#e7e8e2] p-5 last:border-0 sm:grid-cols-[minmax(0,1fr)_120px_140px_auto] sm:items-center sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.active ? "bg-[#e4f4ec] text-[#287055]" : "bg-[#ecece7] text-[#868d88]"}`}><CalendarClock size={19} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.description}</p><p className="mt-1 text-xs text-[#858c87]">{item.category} · dia {item.day_of_month}</p></div></div><p className={`text-sm font-bold ${item.kind === "income" ? "text-[#287055]" : ""}`}>{item.kind === "income" ? "+" : "-"} {formatCurrency(item.amount_cents)}</p><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${item.active ? "bg-[#e4f4ec] text-[#287055]" : "bg-[#ecece7] text-[#747c77]"}`}>{item.active ? "Ativa" : "Pausada"}</span><div className="flex gap-1"><button onClick={() => void toggle(item)} className="rounded-lg p-2 text-[#6f7872] hover:bg-[#eceee8]" aria-label={item.active ? "Pausar" : "Ativar"}><Power size={16} /></button><button onClick={() => { setEditing(item); setFormOpen(true); }} className="rounded-lg p-2 text-[#6f7872] hover:bg-[#eceee8]" aria-label="Editar"><Pencil size={16} /></button><button onClick={() => void remove(item)} className="rounded-lg p-2 text-[#9b7c77] hover:bg-[#fff0ed] hover:text-[#a43f35]" aria-label="Excluir"><Trash2 size={16} /></button></div></div>)}</div> : <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><CalendarClock size={32} className="text-[#8b928d]" /><h3 className="mt-4 font-semibold">Nenhuma recorrência</h3><p className="mt-2 max-w-sm text-sm text-[#858c87]">Cadastre aluguel, salário, assinaturas e outros valores que se repetem mensalmente.</p></div>}
    </section>
    {formOpen && <RecurrenceForm item={editing} categories={categories} onCreateCategory={onCreateCategory} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={save} />}
  </>;
}

function RecurrenceForm({ item, categories, onCreateCategory, onClose, onSave }: { item: Recurrence | null; categories: Category[]; onCreateCategory: (name: string, kind: EntryKind) => Promise<Category>; onClose: () => void; onSave: (payload: RecurrencePayload) => Promise<void> }) {
  const [description, setDescription] = useState(item?.description ?? "");
  const [amount, setAmount] = useState(item ? currencyInput(item.amount_cents) : "");
  const [kind, setKind] = useState<EntryKind>(item?.kind ?? "expense");
  const available = categories.filter((category) => category.kind === kind);
  const [category, setCategory] = useState(item?.category ?? available[0]?.name ?? "");
  const [day, setDay] = useState(item?.day_of_month ?? 1);
  const [startMonth, setStartMonth] = useState(item?.start_month ?? currentMonth());
  const [endMonth, setEndMonth] = useState(item?.end_month ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function changeKind(next: EntryKind) { setKind(next); setCategory(categories.find((value) => value.kind === next)?.name ?? ""); }
  async function addCategory() { if (!newCategory.trim()) return; const created = await onCreateCategory(newCategory, kind); setCategory(created.name); setNewCategory(""); }
  async function submit(event: FormEvent) { event.preventDefault(); const cents = parseCurrency(amount); if (cents <= 0) return setError("Informe um valor válido."); setSaving(true); setError(""); try { await onSave({ description: description.trim(), amount_cents: cents, kind, category, day_of_month: day, start_month: startMonth, end_month: endMonth || null, notes: notes.trim() || null, active }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar."); } finally { setSaving(false); } }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101b16]/55 backdrop-blur-[3px] sm:items-center sm:p-6"><div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-[#fbfbf8] p-5 shadow-2xl sm:max-w-2xl sm:rounded-[28px] sm:p-7"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b827d]">Planejamento mensal</p><h2 className="mt-1 text-2xl font-semibold">{item ? "Editar recorrência" : "Nova recorrência"}</h2></div><button onClick={onClose} className="rounded-full border border-[#dedfd8] p-2"><X size={19} /></button></div><form onSubmit={submit} className="space-y-5"><div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#edeee8] p-1.5"><button type="button" onClick={() => changeKind("expense")} className={`rounded-xl py-3 text-sm font-bold ${kind === "expense" ? "bg-white shadow-sm" : "text-[#747c77]"}`}>Despesa</button><button type="button" onClick={() => changeKind("income")} className={`rounded-xl py-3 text-sm font-bold ${kind === "income" ? "bg-white shadow-sm" : "text-[#747c77]"}`}>Receita</button></div><label className="block"><span className="mb-2 block text-sm font-semibold">Descrição</span><input required value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none" /></label><div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Valor mensal</span><input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none" /></label><label><span className="mb-2 block text-sm font-semibold">Dia do mês</span><input required type="number" min={1} max={31} value={day} onChange={(event) => setDay(Number(event.target.value))} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none" /></label></div><div><label className="mb-2 block text-sm font-semibold">Categoria</label><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5">{available.map((value) => <option key={value.id}>{value.name}</option>)}</select><div className="mt-2 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Criar nova categoria" className="min-w-0 flex-1 rounded-xl border border-[#d8dad3] bg-white px-3 py-2.5 text-sm" /><button type="button" onClick={() => void addCategory()} className="rounded-xl border border-[#d8dad3] px-4 text-sm font-bold">Criar</button></div></div><div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Começa em</span><input type="month" required value={startMonth} onChange={(event) => setStartMonth(event.target.value)} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5" /></label><label><span className="mb-2 block text-sm font-semibold">Termina em <i className="font-normal text-[#8b928d]">(opcional)</i></span><input type="month" value={endMonth} onChange={(event) => setEndMonth(event.target.value)} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5" /></label></div><label className="block"><span className="mb-2 block text-sm font-semibold">Observações</span><textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5" /></label><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4" /> Recorrência ativa</label>{error && <p className="rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#a43f35]">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-2xl border border-[#d8dad3] px-5 py-3 text-sm font-bold">Cancelar</button><button disabled={saving} className="rounded-2xl bg-[#17231d] px-6 py-3 text-sm font-bold text-white">{saving ? "Salvando..." : "Salvar recorrência"}</button></div></form></div></div>;
}
