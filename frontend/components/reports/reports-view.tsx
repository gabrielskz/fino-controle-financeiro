"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileDown, Gauge, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { getReportEntries } from "@/lib/api";
import { currentMonth, formatCurrency, formatDate, formatMonth, shiftMonth } from "@/lib/format";
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
  const monthCount = inclusiveMonthCount(fromMonth, toMonth);
  const monthlyAverage = Math.round(expense / monthCount);
  const maxValue = Math.max(...reports.flatMap((item) => [item.income_cents, item.expense_cents]), 1);
  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    entries.filter((item) => item.kind === "expense").forEach((item) => totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount_cents));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);
  const largestExpenses = useMemo(() => entries.filter((item) => item.kind === "expense").sort((a, b) => b.amount_cents - a.amount_cents).slice(0, 8), [entries]);

  function exportCsv() {
    const rows = [["Mês", "Data", "Tipo", "Descrição", "Categoria", "Situação", "Parcela", "Valor"], ...entries.map((entry) => [entry.reference_month, entry.due_date ?? "", entry.kind === "income" ? "Receita" : "Despesa", entry.description, entry.category, entry.status, installmentLabel(entry), (entry.amount_cents / 100).toFixed(2).replace(".", ",")])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `relatorio-${fromMonth}-a-${toMonth}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportPdf() {
    const document = new jsPDF();
    document.setFontSize(18);
    document.text("Relatório financeiro", 14, 18);
    document.setFontSize(10);
    document.setTextColor(90);
    document.text(`${formatMonth(fromMonth)} a ${formatMonth(toMonth)}`, 14, 25);
    document.setTextColor(20);
    document.text(`Receitas: ${formatCurrency(income)}`, 14, 35);
    document.text(`Despesas: ${formatCurrency(expense)}`, 14, 41);
    document.text(`Resultado: ${formatCurrency(income - expense)}`, 14, 47);
    document.text(`Média mensal de gastos: ${formatCurrency(monthlyAverage)}`, 14, 53);
    autoTable(document, {
      startY: 61,
      head: [["Data", "Tipo", "Descrição", "Categoria", "Situação", "Valor"]],
      body: entries.map((entry) => [formatDate(entry.due_date), entry.kind === "income" ? "Receita" : "Despesa", `${entry.description}${installmentLabel(entry) ? ` (${installmentLabel(entry)})` : ""}`, entry.category, entry.status === "pending" ? "Pendente" : "Concluído", formatCurrency(entry.amount_cents)]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [23, 35, 29] },
      alternateRowStyles: { fillColor: [246, 247, 243] },
    });
    document.save(`relatorio-${fromMonth}-a-${toMonth}.pdf`);
  }

  return <>
    <div className="mb-5 flex flex-col justify-between gap-3 rounded-[20px] border border-[#dedfd8] bg-[#fbfbf8] p-4 panel-shadow lg:flex-row lg:items-end"><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-xs font-bold text-[#737b76]">De</span><input type="month" value={fromMonth} max={toMonth} onChange={(event) => changeFrom(event.target.value)} className="w-full rounded-xl border border-[#d8dad3] bg-white px-3 py-2.5 text-sm" /></label><label><span className="mb-1.5 block text-xs font-bold text-[#737b76]">Até</span><input type="month" value={toMonth} min={fromMonth} onChange={(event) => changeTo(event.target.value)} className="w-full rounded-xl border border-[#d8dad3] bg-white px-3 py-2.5 text-sm" /></label></div><div className="flex flex-col gap-2 sm:flex-row"><button onClick={exportCsv} disabled={!entries.length} className="flex items-center justify-center gap-2 rounded-xl border border-[#cfd3cb] bg-white px-4 py-3 text-sm font-bold disabled:opacity-40"><Download size={17} /> Exportar CSV</button><button onClick={exportPdf} disabled={!entries.length} className="flex items-center justify-center gap-2 rounded-xl bg-[#17231d] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><FileDown size={17} /> Exportar PDF</button></div></div>
    {error && <p className="mb-5 rounded-xl bg-[#fff0ed] p-4 text-sm text-[#a43f35]">{error}</p>}
    <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><ReportCard label="Receitas" value={income} icon={<TrendingUp size={20} />} tone="green" /><ReportCard label="Despesas" value={expense} icon={<TrendingDown size={20} />} tone="red" /><ReportCard label="Resultado" value={income - expense} icon={<Wallet size={20} />} tone="dark" /><ReportCard label="Média mensal de gastos" value={monthlyAverage} icon={<Gauge size={20} />} tone="lime" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><section className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6"><h2 className="text-lg font-semibold">Evolução mensal</h2><p className="mt-1 text-sm text-[#7b827d]">Comparação entre entradas e saídas.</p>{loading ? <p className="py-16 text-center text-sm text-[#858c87]">Carregando...</p> : reports.length ? <div className="mt-8 space-y-6">{reports.map((item) => <div key={item.month} className="grid grid-cols-[95px_1fr] items-center gap-3"><span className="text-xs font-semibold text-[#68716b]">{formatMonth(item.month).replace(/ de \d{4}/, "")}</span><div className="space-y-2"><div className="flex items-center gap-2"><div className="h-3 rounded-full bg-[#68b890]" style={{ width: `${Math.max(item.income_cents / maxValue * 100, 1)}%` }} /><span className="whitespace-nowrap text-[11px] font-semibold">{formatCurrency(item.income_cents)}</span></div><div className="flex items-center gap-2"><div className="h-3 rounded-full bg-[#d9867c]" style={{ width: `${Math.max(item.expense_cents / maxValue * 100, 1)}%` }} /><span className="whitespace-nowrap text-[11px] font-semibold">{formatCurrency(item.expense_cents)}</span></div></div></div>)}</div> : <p className="py-16 text-center text-sm text-[#858c87]">Nenhum lançamento nesse intervalo.</p>}</section><section className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6"><h2 className="text-lg font-semibold">Despesas por categoria</h2><div className="mt-6 space-y-4">{categories.slice(0, 8).map(([name, value]) => <div key={name}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate">{name}</span><strong>{formatCurrency(value)}</strong></div><div className="h-1.5 rounded-full bg-[#e8e9e3]"><div className="h-full rounded-full bg-[#d8ff65]" style={{ width: `${expense ? value / expense * 100 : 0}%` }} /></div></div>)}</div></section></div>
    <section className="mt-5 rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6"><h2 className="text-lg font-semibold">Maiores despesas</h2><p className="mt-1 text-sm text-[#7b827d]">Os maiores gastos no intervalo selecionado.</p><div className="mt-5 divide-y divide-[#e5e6df]">{largestExpenses.length ? largestExpenses.map((entry, index) => <div key={entry.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f8e9e6] text-xs font-bold text-[#a94c40]">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{entry.description}</p><p className="mt-1 truncate text-xs text-[#7b827d]">{entry.category} · {formatDate(entry.due_date)}{installmentLabel(entry) ? ` · ${installmentLabel(entry)}` : ""}</p></div><strong className="text-sm">{formatCurrency(entry.amount_cents)}</strong></div>) : <p className="py-8 text-center text-sm text-[#858c87]">Nenhuma despesa nesse intervalo.</p>}</div></section>
  </>;
}

function ReportCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "green" | "red" | "dark" | "lime" }) {
  const styles = tone === "green" ? "bg-[#e4f4ec] text-[#287055]" : tone === "red" ? "bg-[#f8e9e6] text-[#a94c40]" : tone === "lime" ? "bg-[#efffc1] text-[#536628]" : "bg-[#17231d] text-[#d8ff65]";
  return <div className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow"><div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-full ${styles}`}>{icon}</div><p className="text-sm text-[#737b76]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{formatCurrency(value)}</p></div>;
}

function inclusiveMonthCount(fromMonth: string, toMonth: string): number {
  const [fromYear, fromNumber] = fromMonth.split("-").map(Number);
  const [toYear, toNumber] = toMonth.split("-").map(Number);
  return Math.max((toYear - fromYear) * 12 + toNumber - fromNumber + 1, 1);
}

function installmentLabel(entry: Entry): string {
  return entry.installment_number && entry.installment_total ? `Parcela ${entry.installment_number}/${entry.installment_total}` : "";
}
