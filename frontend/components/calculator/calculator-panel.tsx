"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Calculator, Delete, History, X } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import type { EntryKind } from "@/lib/types";

type Operation = "+" | "-" | "*" | "/";

export function CalculatorPanel({ open, onClose, onCreateEntry }: { open: boolean; onClose: () => void; onCreateEntry: (kind: EntryKind, amountCents: number) => void }) {
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [waitingForValue, setWaitingForValue] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const currentValue = parseDisplay(display);
  const amountCents = Math.round(Math.abs(currentValue) * 100);

  function inputDigit(digit: string) {
    if (waitingForValue) {
      setDisplay(digit);
      setWaitingForValue(false);
      return;
    }
    const digits = display.replace(/\D/g, "");
    if (digits.length >= 14) return;
    setDisplay(display === "0" ? digit : `${display}${digit}`);
  }

  function inputDecimal() {
    if (waitingForValue) {
      setDisplay("0,");
      setWaitingForValue(false);
    } else if (!display.includes(",")) {
      setDisplay(`${display},`);
    }
  }

  function chooseOperation(nextOperation: Operation) {
    const value = parseDisplay(display);
    if (accumulator === null) {
      setAccumulator(value);
    } else if (operation && !waitingForValue) {
      const result = calculate(accumulator, value, operation);
      setAccumulator(result);
      setDisplay(formatDisplay(result));
    }
    setOperation(nextOperation);
    setWaitingForValue(true);
  }

  function equals() {
    if (accumulator === null || !operation || waitingForValue) return;
    const value = parseDisplay(display);
    const result = calculate(accumulator, value, operation);
    setHistory((items) => [`${formatDisplay(accumulator)} ${operationSymbol(operation)} ${formatDisplay(value)} = ${formatDisplay(result)}`, ...items].slice(0, 4));
    setDisplay(formatDisplay(result));
    setAccumulator(null);
    setOperation(null);
    setWaitingForValue(true);
  }

  function clear() {
    setDisplay("0");
    setAccumulator(null);
    setOperation(null);
    setWaitingForValue(false);
  }

  function removeDigit() {
    if (waitingForValue) return;
    setDisplay((value) => value.length > 1 ? value.slice(0, -1) : "0");
  }

  function applyPercent() {
    setDisplay(formatDisplay(parseDisplay(display) / 100));
    setWaitingForValue(false);
  }

  function createEntryFromResult(kind: EntryKind) {
    if (!amountCents) return;
    onCreateEntry(kind, amountCents);
    onClose();
  }

  return <div className="fixed inset-0 z-[70] flex justify-end bg-[#101b16]/45 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="fade-in flex h-full w-full max-w-[410px] flex-col overflow-y-auto border-l border-[#dedfd8] bg-[#f8f8f4] p-5 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#778079]">Ferramenta rápida</p><h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold"><Calculator size={23} /> Calculadora</h2></div><button type="button" onClick={onClose} aria-label="Fechar calculadora" className="rounded-full border border-[#dedfd8] bg-[#fbfbf8] p-2.5 text-[#626b65]"><X size={19} /></button></div>

      <div className="rounded-[24px] bg-[#17231d] p-5 text-right text-white panel-shadow">
        <p className="h-5 text-xs font-semibold text-white/45">{accumulator !== null && operation ? `${formatDisplay(accumulator)} ${operationSymbol(operation)}` : "Resultado"}</p>
        <p className="mt-2 overflow-hidden text-4xl font-semibold tracking-[-0.04em]">{display}</p>
        <p className="mt-3 text-sm text-[#d8ff65]">{formatCurrency(amountCents)}</p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <CalculatorButton label="C" onClick={clear} accent />
        <CalculatorButton label="%" onClick={applyPercent} />
        <CalculatorButton label="⌫" onClick={removeDigit} icon={<Delete size={18} />} />
        <CalculatorButton label="÷" onClick={() => chooseOperation("/")} operator />
        {[["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"]].map((row, index) => <div key={row[0]} className="contents">{row.map((digit) => <CalculatorButton key={digit} label={digit} onClick={() => inputDigit(digit)} />)}<CalculatorButton label={["×", "−", "+"][index]} onClick={() => chooseOperation((["*", "-", "+"] as Operation[])[index])} operator /></div>)}
        <button type="button" onClick={() => { setDisplay(formatDisplay(-parseDisplay(display))); setWaitingForValue(false); }} className="rounded-2xl border border-[#dedfd8] bg-[#fbfbf8] py-4 text-lg font-semibold">±</button>
        <CalculatorButton label="0" onClick={() => inputDigit("0")} />
        <CalculatorButton label="," onClick={inputDecimal} />
        <button type="button" onClick={equals} className="rounded-2xl bg-[#d8ff65] py-4 text-xl font-bold text-[#17211c]">=</button>
      </div>

      <div className="mt-5 rounded-2xl border border-[#dedfd8] bg-[#fbfbf8] p-4"><div className="mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold"><History size={16} /> Histórico</p>{history.length > 0 && <button type="button" onClick={() => setHistory([])} className="text-xs font-bold text-[#68706b]">Limpar</button>}</div>{history.length ? <div className="space-y-2">{history.map((item, index) => <p key={`${item}-${index}`} className="truncate rounded-xl bg-[#edeee8] px-3 py-2 text-right text-sm">{item}</p>)}</div> : <p className="text-xs text-[#858c87]">Seus últimos cálculos aparecerão aqui.</p>}</div>

      <div className="mt-auto pt-5"><p className="mb-3 text-sm font-semibold">Usar {formatCurrency(amountCents)} em um lançamento</p><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => createEntryFromResult("expense")} disabled={!amountCents} className="flex items-center justify-center gap-2 rounded-2xl bg-[#f8e9e6] px-3 py-3.5 text-sm font-bold text-[#a94c40] disabled:opacity-40"><ArrowUpRight size={17} /> Nova despesa</button><button type="button" onClick={() => createEntryFromResult("income")} disabled={!amountCents} className="flex items-center justify-center gap-2 rounded-2xl bg-[#e4f4ec] px-3 py-3.5 text-sm font-bold text-[#287055] disabled:opacity-40"><ArrowDownLeft size={17} /> Nova receita</button></div></div>
    </aside>
  </div>;
}

function CalculatorButton({ label, onClick, accent = false, operator = false, icon }: { label: string; onClick: () => void; accent?: boolean; operator?: boolean; icon?: React.ReactNode }) {
  const style = accent ? "bg-[#f8e9e6] text-[#a94c40]" : operator ? "bg-[#17231d] text-[#d8ff65]" : "border border-[#dedfd8] bg-[#fbfbf8]";
  return <button type="button" onClick={onClick} aria-label={label} className={`flex items-center justify-center rounded-2xl py-4 text-lg font-semibold ${style}`}>{icon ?? label}</button>;
}

function parseDisplay(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round((value + Number.EPSILON) * 100000000) / 100000000;
  return new Intl.NumberFormat("pt-BR", { useGrouping: false, maximumFractionDigits: 8 }).format(rounded);
}

function calculate(left: number, right: number, operation: Operation): number {
  if (operation === "+") return left + right;
  if (operation === "-") return left - right;
  if (operation === "*") return left * right;
  return right === 0 ? 0 : left / right;
}

function operationSymbol(operation: Operation): string {
  return operation === "*" ? "×" : operation === "/" ? "÷" : operation === "-" ? "−" : "+";
}
