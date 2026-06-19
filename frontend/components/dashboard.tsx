"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowDownLeft, ArrowUpRight, Calculator, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, FileChartColumn, LayoutDashboard, LogOut, Menu, Pencil, Plus, Repeat2, Search, Settings, Tags, Trash2, X } from "lucide-react";

import { CategoriesView } from "@/components/categories/categories-view";
import { CalculatorPanel } from "@/components/calculator/calculator-panel";
import { EntryForm } from "@/components/entry-form";
import { RecurrencesView } from "@/components/recurrences/recurrences-view";
import { ReportsView } from "@/components/reports/reports-view";
import { AccountSettings } from "@/components/settings/account-settings";
import { createCategory, createEntry, createInstallmentEntries, deleteCategory, deleteEntry, getCategories, getDashboard, markMonthExpensesPaid, updateEntry } from "@/lib/api";
import { currentMonth, formatCurrency, formatDate, formatMonth, shiftMonth } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { AppView, Category, DashboardData, Entry, EntryKind, EntrySubmission } from "@/lib/types";

type Filter = "all" | EntryKind | "pending";

const viewTitles: Record<AppView, { eyebrow: string; title: string }> = {
  overview: { eyebrow: "Visão geral", title: "Seu mês, sem surpresas." },
  categories: { eyebrow: "Organização", title: "Suas categorias." },
  recurrences: { eyebrow: "Planejamento", title: "O que se repete todo mês." },
  reports: { eyebrow: "Análise", title: "Entenda seus números." },
  settings: { eyebrow: "Sua conta", title: "Acesso e segurança." },
};

export function Dashboard({ user }: { user: User }) {
  const [view, setView] = useState<AppView>("overview");
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formKind, setFormKind] = useState<EntryKind>("expense");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [saving, setSaving] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [initialAmountCents, setInitialAmountCents] = useState(0);

  useEffect(() => {
    let active = true;
    void getCategories().then((items) => { if (active) setCategories(items); }).catch((caught) => { if (active) setError(errorMessage(caught)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void getDashboard(month).then((dashboard) => { if (active) setData(dashboard); }).catch((caught) => { if (active) setError(errorMessage(caught)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  async function reloadDashboard() {
    setLoading(true);
    try { setData(await getDashboard(month)); } catch (caught) { setError(errorMessage(caught)); } finally { setLoading(false); }
  }

  async function reloadCategories() {
    const items = await getCategories();
    setCategories(items);
    return items;
  }

  function changeMonth(nextMonth: string) { setLoading(true); setError(""); setMonth(nextMonth); }
  function openNew(kind: EntryKind, amountCents = 0) { setEditing(null); setFormKind(kind); setInitialAmountCents(amountCents); setFormOpen(true); }

  async function saveEntry({ payload, installment_count }: EntrySubmission) {
    setSaving(true);
    try { if (editing) await updateEntry(editing.id, payload); else if (installment_count > 1) await createInstallmentEntries(payload, installment_count); else await createEntry(payload); setFormOpen(false); setEditing(null); await reloadDashboard(); } catch (caught) { setError(errorMessage(caught)); } finally { setSaving(false); }
  }

  async function payAllExpenses() {
    const pending = data?.entries.filter((entry) => entry.kind === "expense" && entry.status === "pending") ?? [];
    if (!pending.length) return;
    const total = pending.reduce((sum, entry) => sum + entry.amount_cents, 0);
    if (!window.confirm(`Marcar ${pending.length} despesa(s), no total de ${formatCurrency(total)}, como pagas?`)) return;
    try { await markMonthExpensesPaid(month); await reloadDashboard(); } catch (caught) { setError(errorMessage(caught)); }
  }

  async function removeEntry(entry: Entry) { const question = entry.recurrence_id ? `Remover "${entry.description}" somente de ${formatMonth(entry.reference_month)}? A recorrência continuará nos próximos meses.` : `Remover "${entry.description}"?`; if (!window.confirm(question)) return; try { await deleteEntry(entry); await reloadDashboard(); } catch (caught) { setError(errorMessage(caught)); } }
  async function toggleStatus(entry: Entry) { const status = entry.kind === "expense" ? entry.status === "paid" ? "pending" : "paid" : entry.status === "received" ? "pending" : "received"; try { await updateEntry(entry.id, { status }); await reloadDashboard(); } catch (caught) { setError(errorMessage(caught)); } }

  async function addCategory(name: string, kind: EntryKind, color = "#8fd3b6") { const created = await createCategory(name, kind, color); await reloadCategories(); return created; }
  async function removeCategory(category: Category) { if (!window.confirm(`Excluir a categoria "${category.name}"? Os lançamentos existentes não serão apagados.`)) return; try { await deleteCategory(category.id); await reloadCategories(); } catch (caught) { setError(errorMessage(caught)); } }

  const entries = useMemo(() => (data?.entries ?? []).filter((entry) => (filter === "all" || filter === "pending" ? filter === "all" || entry.status === "pending" : entry.kind === filter) && (!search.trim() || `${entry.description} ${entry.category}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")))), [data?.entries, filter, search]);
  const heading = viewTitles[view];

  return <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
    <Sidebar user={user} active={view} mobileOpen={mobileNav} onNavigate={(next) => { setView(next); setMobileNav(false); }} onClose={() => setMobileNav(false)} />
    <main className="min-w-0 px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
      <header className="mb-6 flex items-center justify-between gap-4 pr-14 sm:pr-16"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setMobileNav(true)} className="rounded-xl border border-[#dcded6] bg-[#fbfbf8] p-2.5 lg:hidden"><Menu size={20} /></button><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#808781]">{heading.eyebrow}</p><h1 className="truncate text-2xl font-semibold tracking-[-0.035em] sm:mt-0.5 sm:text-[28px]">{heading.title}</h1></div></div><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => setCalculatorOpen(true)} title="Abrir calculadora" aria-label="Abrir calculadora" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dcded6] bg-[#fbfbf8] text-[#56615b] panel-shadow"><Calculator size={20} /></button>{view === "overview" && <button onClick={() => openNew("expense")} className="flex items-center gap-2 rounded-full bg-[#17211c] px-3 py-2.5 text-sm font-bold text-white sm:px-5"><Plus size={18} /><span className="hidden sm:inline">Novo lançamento</span></button>}</div></header>
      {error && <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#e7bdb7] bg-[#fff1ee] px-4 py-3 text-sm text-[#923d34]"><span>{error}</span><button onClick={() => setError("")}><X size={18} /></button></div>}
      {view === "overview" && <Overview month={month} data={data} entries={entries} categories={categories} loading={loading} search={search} filter={filter} onSearch={setSearch} onFilter={setFilter} onMonth={changeMonth} onAdd={openNew} onEdit={(entry) => { setEditing(entry); setFormKind(entry.kind); setInitialAmountCents(0); setFormOpen(true); }} onDelete={removeEntry} onToggle={toggleStatus} onPayAll={() => void payAllExpenses()} />}
      {view === "categories" && <CategoriesView categories={categories} onCreate={async (name, kind, color) => { await addCategory(name, kind, color); }} onDelete={removeCategory} />}
      {view === "recurrences" && <RecurrencesView categories={categories} onCreateCategory={addCategory} onChanged={reloadDashboard} />}
      {view === "reports" && <ReportsView />}
      {view === "settings" && <AccountSettings user={user} />}
    </main>
    {formOpen && <EntryForm month={month} entry={editing} initialKind={formKind} initialAmountCents={initialAmountCents} categories={categories} saving={saving} onClose={() => { setFormOpen(false); setEditing(null); setInitialAmountCents(0); }} onSave={saveEntry} onCreateCategory={addCategory} />}
    <CalculatorPanel open={calculatorOpen} onClose={() => setCalculatorOpen(false)} onCreateEntry={openNew} />
  </div>;
}

function Overview({ month, data, entries, categories, loading, search, filter, onSearch, onFilter, onMonth, onAdd, onEdit, onDelete, onToggle, onPayAll }: { month: string; data: DashboardData | null; entries: Entry[]; categories: Category[]; loading: boolean; search: string; filter: Filter; onSearch: (value: string) => void; onFilter: (value: Filter) => void; onMonth: (value: string) => void; onAdd: (kind: EntryKind) => void; onEdit: (entry: Entry) => void; onDelete: (entry: Entry) => void; onToggle: (entry: Entry) => void; onPayAll: () => void }) {
  const maxCategory = Math.max(...(data?.categories.map((item) => item.amount_cents) ?? [0]), 1);
  return <><div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[#dedfd8] bg-[#fbfbf8]/80 p-2 panel-shadow sm:w-fit"><button onClick={() => onMonth(shiftMonth(month, -1))} className="rounded-xl p-2 hover:bg-[#e9eae4]"><ChevronLeft size={18} /></button><label className="relative flex min-w-[175px] items-center justify-center gap-2 px-1 text-sm font-bold"><CalendarDays size={17} /><span>{formatMonth(month)}</span><input type="month" value={month} onChange={(event) => event.target.value && onMonth(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" /></label><button onClick={() => onMonth(shiftMonth(month, 1))} className="rounded-xl p-2 hover:bg-[#e9eae4]"><ChevronRight size={18} /></button></div>
    <section className="mb-5 grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]"><div className="balance-grid rounded-[26px] bg-[#17231d] p-6 text-white panel-shadow sm:p-7"><div className="mb-7 flex justify-between"><span className="text-sm text-white/65">Saldo previsto</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${data && data.balance_cents < 0 ? "bg-[#ef8c7d]/15 text-[#ffb5aa]" : "bg-[#d8ff65]/15 text-[#d8ff65]"}`}>{data && data.balance_cents < 0 ? "Atenção" : "No caminho"}</span></div><p className="text-3xl font-semibold tracking-[-0.045em] sm:text-[40px]">{loading ? "..." : formatCurrency(data?.balance_cents ?? 0)}</p><p className="mt-2 text-sm text-white/55">Receitas menos todas as despesas do mês</p></div><SummaryCard title="Receitas" value={data?.income_cents ?? 0} helper={`${formatCurrency(data?.pending_income_cents ?? 0)} a receber`} kind="income" onAdd={onAdd} /><SummaryCard title="Despesas" value={data?.expense_cents ?? 0} helper={`${formatCurrency(data?.pending_expense_cents ?? 0)} pendentes`} kind="expense" onAdd={onAdd} /></section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]"><div className="overflow-hidden rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] panel-shadow"><div className="border-b border-[#e3e4dd] p-5 sm:p-6"><div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Lançamentos</h2><p className="mt-1 text-sm text-[#7b827d]">Tudo que entra e sai neste mês</p></div><div className="relative sm:w-64"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a918c]" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar lançamento" className="w-full rounded-xl border border-[#dcded6] bg-white py-2.5 pl-10 pr-3 text-sm outline-none" /></div></div><div className="flex flex-wrap gap-2">{(["all", "pending", "expense", "income"] as Filter[]).map((item) => <button key={item} onClick={() => onFilter(item)} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === item ? "bg-[#17211c] text-white" : "border border-[#dcded6] bg-white text-[#68706b]"}`}>{item === "all" ? "Todos" : item === "pending" ? "Pendentes" : item === "expense" ? "Despesas" : "Receitas"}</button>)}<button onClick={onPayAll} disabled={!data?.pending_expense_cents || loading} className="ml-auto flex items-center gap-2 rounded-full border border-[#b9c8bd] bg-[#e4f4ec] px-4 py-2 text-xs font-bold text-[#287055] disabled:cursor-not-allowed disabled:opacity-40"><CheckCheck size={15} /> Marcar despesas como pagas</button></div></div><div className="min-h-[360px]">{loading ? <LoadingRows /> : entries.length ? entries.map((entry) => <EntryRow key={entry.id} entry={entry} onEdit={() => onEdit(entry)} onDelete={() => void onDelete(entry)} onToggle={() => void onToggle(entry)} />) : <EmptyState onAdd={() => onAdd("expense")} />}</div></div>
      <div className="space-y-5"><div className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6"><div className="mb-6 flex justify-between"><div><h2 className="text-lg font-semibold">Por categoria</h2><p className="mt-1 text-sm text-[#7b827d]">Onde seu dinheiro vai</p></div><Tags size={20} /></div><div className="space-y-5">{data?.categories.slice(0, 7).map((item) => { const color = categories.find((category) => category.kind === "expense" && category.name === item.category)?.color ?? "#d8ff65"; return <div key={item.category}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{item.category}</span><strong>{formatCurrency(item.amount_cents)}</strong></div><div className="h-1.5 rounded-full bg-[#e8e9e3]"><div className="h-full rounded-full" style={{ width: `${Math.max(item.amount_cents / maxCategory * 100, 4)}%`, backgroundColor: color }} /></div></div>})}</div></div><div className="rounded-[24px] bg-[#d8ff65] p-6 text-[#17211c]"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#17211c] text-[#d8ff65]"><Check size={19} /></div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#526228]">Progresso do mês</p><h3 className="mt-2 text-xl font-semibold text-[#17211c]">{data?.expense_cents ? Math.round(data.paid_expense_cents / data.expense_cents * 100) : 0}% das despesas pagas</h3><div className="mt-5 h-2 rounded-full bg-[#17211c]/15"><div className="h-full rounded-full bg-[#17211c]" style={{ width: `${data?.expense_cents ? data.paid_expense_cents / data.expense_cents * 100 : 0}%` }} /></div></div></div></section></>;
}

function Sidebar({ user, active, mobileOpen, onNavigate, onClose }: { user: User; active: AppView; mobileOpen: boolean; onNavigate: (view: AppView) => void; onClose: () => void }) {
  return <>{mobileOpen && <button className="fixed inset-0 z-40 bg-[#101b16]/45 lg:hidden" onClick={onClose} />}<aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[#dfe0da] bg-[#f8f8f4] p-5 transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}><div className="mb-9 flex items-center justify-between px-2"><div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17211c] text-[#d8ff65]"><CircleDollarSign size={21} /></div><span className="text-xl font-bold tracking-[-0.04em]">fino.</span></div><button onClick={onClose} className="lg:hidden"><X size={19} /></button></div><nav className="space-y-1.5"><NavItem icon={<LayoutDashboard size={19} />} label="Visão geral" active={active === "overview"} onClick={() => onNavigate("overview")} /><NavItem icon={<Tags size={19} />} label="Categorias" active={active === "categories"} onClick={() => onNavigate("categories")} /><NavItem icon={<Repeat2 size={19} />} label="Recorrências" active={active === "recurrences"} onClick={() => onNavigate("recurrences")} /><NavItem icon={<FileChartColumn size={19} />} label="Relatórios" active={active === "reports"} onClick={() => onNavigate("reports")} /><NavItem icon={<Settings size={19} />} label="Conta" active={active === "settings"} onClick={() => onNavigate("settings")} /></nav><div className="mt-auto border-t border-[#dfe0da] pt-4"><p className="truncate px-3 text-xs font-semibold">{user.email}</p><button onClick={() => void createClient().auth.signOut()} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#68706b] hover:bg-[#e9eae4]"><LogOut size={18} /> Sair</button></div></aside></>;
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? "bg-[#17211c] text-white" : "text-[#667069] hover:bg-[#e9eae4]"}`}>{icon}{label}</button>; }
function SummaryCard({ title, value, helper, kind, onAdd }: { title: string; value: number; helper: string; kind: EntryKind; onAdd: (kind: EntryKind) => void }) { return <div className="rounded-[26px] border border-[#dedfd8] bg-[#fbfbf8] p-6 panel-shadow"><div className="mb-6 flex justify-between"><div className={`rounded-full p-2.5 ${kind === "income" ? "bg-[#e4f4ec] text-[#287055]" : "bg-[#f8e9e6] text-[#a94c40]"}`}>{kind === "income" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</div><button onClick={() => onAdd(kind)} className="rounded-full border border-[#dedfd8] p-1.5"><Plus size={16} /></button></div><p className="text-sm text-[#737b76]">{title}</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(value)}</p><p className="mt-3 text-xs text-[#89908b]">{helper}</p></div>; }
function EntryRow({ entry, onEdit, onDelete, onToggle }: { entry: Entry; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const complete = entry.status === "paid" || entry.status === "received";
  const statusLabel = entry.status === "paid" ? "Pago" : entry.status === "received" ? "Recebido" : "Pendente";

  return <div className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-l-4 border-b-[#e7e8e2] px-4 py-4 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_115px_auto] sm:px-6 ${complete ? "border-l-[#68b890]" : "border-l-[#d9867c] bg-[#fff8f6]"}`}>
    <button onClick={onToggle} aria-label={complete ? "Marcar como pendente" : "Marcar como concluído"} className={`flex h-10 w-10 items-center justify-center rounded-xl ${entry.kind === "income" ? "bg-[#e4f4ec] text-[#287055]" : "bg-[#f8e9e6] text-[#a94c40]"}`}>{entry.kind === "income" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</button>
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{entry.description}</p>
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${complete ? "bg-[#e4f4ec] text-[#287055]" : "bg-[#f8e9e6] text-[#a94c40]"}`}>{complete ? <Check size={11} /> : <Clock3 size={11} />}{statusLabel}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs leading-relaxed text-[#858c87]">
        <span className="min-w-0 break-words">{entry.category}</span>
        <span className="shrink-0">· {formatDate(entry.due_date)}</span>
        {entry.installment_number && entry.installment_total ? <span className="shrink-0">· Parcela {entry.installment_number}/{entry.installment_total}</span> : null}
      </div>
    </div>
    <p className={`text-right text-sm font-bold ${entry.kind === "income" ? "text-[#287055]" : ""}`}>{entry.kind === "income" ? "+" : "-"} {formatCurrency(entry.amount_cents)}</p>
    <div className="col-start-2 flex justify-end gap-1 sm:col-auto"><button onClick={onEdit} aria-label="Editar lançamento" className="rounded-lg p-2 text-[#7c847f] hover:bg-[#eceee8]"><Pencil size={15} /></button><button onClick={onDelete} aria-label="Excluir lançamento" className="rounded-lg p-2 text-[#9b7c77] hover:bg-[#fff0ed]"><Trash2 size={15} /></button></div>
  </div>;
}
function EmptyState({ onAdd }: { onAdd: () => void }) { return <div className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center"><Clock3 size={30} className="text-[#858c87]" /><h3 className="mt-4 font-semibold">Nenhum lançamento por aqui</h3><p className="mt-2 text-sm text-[#858c87]">Adicione a primeira conta ou receita deste mês.</p><button onClick={onAdd} className="mt-5 rounded-full bg-[#17211c] px-5 py-2.5 text-sm font-bold text-white">Adicionar agora</button></div>; }
function LoadingRows() { return <div className="animate-pulse">{[1, 2, 3, 4].map((item) => <div key={item} className="flex gap-4 border-b border-[#e7e8e2] px-6 py-5"><div className="h-10 w-10 rounded-xl bg-[#e6e7e1]" /><div className="flex-1"><div className="h-3 w-40 rounded bg-[#e2e3dd]" /><div className="mt-2 h-2.5 w-24 rounded bg-[#ecece7]" /></div></div>)}</div>; }
function errorMessage(caught: unknown) { return caught instanceof Error ? caught.message : "Não foi possível concluir a operação."; }
