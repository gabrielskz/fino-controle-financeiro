"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { getReportEntries } from "@/lib/api";
import { currentMonth, formatCurrency, formatMonth, shiftMonth } from "@/lib/format";
import type { Entry, MonthlyReport } from "@/lib/types";

export function ReportsView() {
  const [fromMonth, setFromMonth] = useState(() => shiftMonth(currentMonth(), -5));
  const [toMonth, setToMonth] = useState(currentMonth);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getReportEntries(fromMonth, toMonth).then((data) => { if (active) setEntries(data); }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Não foi possível carregar."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fromMonth, toMonth]);

  function changeFrom(value: string) { setLoading(true); setError(""); setFromMonth(value); }
  function changeTo(value: string) { setLoading(true); setError(""); setToMonth(value); }

  const reports = useMemo(() => {
    const result = new Map<string, MonthlyReport>();
    entries.forEach((entry) => {
      const current = result.get(entry.reference_month) ?? { month: entry.reference_month, income_cents: 0, expense_cents: 0, balance_cents: 0 };
      if (entry.kind === "income") current.income_cents += entry.amount_cents;
      else current.expense_cents += entry.amount_cents;
      current.balance_cents = current.income_cents - current.expense_cents;
      result.set(entry.reference_month, current);
    });
    return [...result.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [entries]);

  const income = entries.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount_cents, 0);
  const expense = entries.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount_cents, 0);
  const maxValue = Math.max(...reports.flatMap((item) => [item.income_cents, item.expense_cents]), 1);
  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    entries.filter((item) => item.kind === "expense").forEach((item) => totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount_cents));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  function exportCsv() {
    const rows = [["Mês", "Data", "Tipo", "Descrição", "Categoria", "Situação", "Valor"], ...entries.map((entry) => [entry.reference_month, entry.due_date ?? "", entry.kind === "income" ? "Receita" : "Despesa", entry.description, entry.category, entry.status, (entry.amount_cents / 100).toFixed(2).replace(".", ",")])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `relatorio-${fromMonth}-a-${toMonth}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return <>
    <div className="mb-5 flex flex-col justify-between gap-3 rounded-[20px] border border-[#dedfd8] bg-[#fbfbf8] p-4 panel-shadow sm:flex-row sm:items-end"><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-bold text-[#737b76]">De</span><input type="month" value={fromMonth} max={toMonth} onChange={(event) => changeFrom(event.target.value)} className="rounded-xl border border-[#d8dad3] bg-white px-3 py-2.5 text-sm" /></label><label><span className="mb-1.5 block text-xs font-bold text-[#737b76]">Até</span><input type="month" value={toMonth} min={fromMonth} onChange={(event) => changeTo(event.target.value)} className="rounded-xl border border-[#d8dad3] bg-white px-3 py-2.5 text-sm" /></label></div><button onClick={exportCsv} disabled={!entries.length} className="flex items-center justify-center gap-2 rounded-xl bg-[#17231d] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><Download size={17} /> Exportar CSV</button></div>
    {error && <p className="mb-5 rounded-xl bg-[#fff0ed] p-4 text-sm text-[#a43f35]">{error}</p>}
    <div className="mb-5 grid gap-4 md:grid-cols-3"><ReportCard label="Receitas" value={income} icon={<TrendingUp size={20} />} tone="green" /><ReportCard label="Despesas" value={expense} icon={<TrendingDown size={20} />} tone="red" /><ReportCard label="Resultado" value={income - expense} icon={<Wallet size={20} />} tone="dark" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><section className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6"><h2 className="text-lg font-semibold">Evolução mensal</h2><p className="mt-1 text-sm text-[#7b827d]">Comparação entre entradas e saídas.</p>{loading ? <p className="py-16 text-center text-sm text-[#858c87]">Carregando...</p> : reports.length ? <div className="mt-8 space-y-6">{reports.map((item) => <div key={item.month} className="grid grid-cols-[95px_1fr] items-center gap-3"><span className="text-xs font-semibold text-[#68716b]">{formatMonth(item.month).replace(/ de \d{4}/, "")}</span><div className="space-y-2"><div className="flex items-center gap-2"><div className="h-3 rounded-full bg-[#68b890]" style={{ width: `${Math.max(item.income_cents / maxValue * 100, 1)}%` }} /><span className="whitespace-nowrap text-[11px] font-semibold">{formatCurrency(item.income_cents)}</span></div><div className="flex items-center gap-2"><div className="h-3 rounded-full bg-[#d9867c]" style={{ width: `${Math.max(item.expense_cents / maxValue * 100, 1)}%` }} /><span className="whitespace-nowrap text-[11px] font-semibold">{formatCurrency(item.expense_cents)}</span></div></div></div>)}</div> : <p className="py-16 text-center text-sm text-[#858c87]">Nenhum lançamento nesse intervalo.</p>}</section><section className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6"><h2 className="text-lg font-semibold">Despesas por categoria</h2><div className="mt-6 space-y-4">{categories.slice(0, 8).map(([name, value]) => <div key={name}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate">{name}</span><strong>{formatCurrency(value)}</strong></div><div className="h-1.5 rounded-full bg-[#e8e9e3]"><div className="h-full rounded-full bg-[#d8ff65]" style={{ width: `${expense ? value / expense * 100 : 0}%` }} /></div></div>)}</div></section></div>
  </>;
}

function ReportCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "green" | "red" | "dark" }) {
  const styles = tone === "green" ? "bg-[#e4f4ec] text-[#287055]" : tone === "red" ? "bg-[#f8e9e6] text-[#a94c40]" : "bg-[#17231d] text-[#d8ff65]";
  return <div className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow"><div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-full ${styles}`}>{icon}</div><p className="text-sm text-[#737b76]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{formatCurrency(value)}</p></div>;
}
