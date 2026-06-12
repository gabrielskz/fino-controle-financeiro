"use client";

import { FormEvent, useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";

import type { Category, EntryKind } from "@/lib/types";

const colors = ["#d8ff65", "#8fd3b6", "#f2bd70", "#9cb8e7", "#e9a5a0", "#c5a8de", "#91c7c4", "#b7bbb4"];

interface CategoriesViewProps {
  categories: Category[];
  onCreate: (name: string, kind: EntryKind, color: string) => Promise<void>;
  onDelete: (category: Category) => Promise<void>;
}

export function CategoriesView({ categories, onCreate, onDelete }: CategoriesViewProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<EntryKind>("expense");
  const [color, setColor] = useState(colors[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onCreate(name, kind, color);
      setName("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="h-fit rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-6 panel-shadow">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#17231d] text-[#d8ff65]"><Plus size={21} /></div>
        <h2 className="text-xl font-semibold tracking-[-0.03em]">Nova categoria</h2>
        <p className="mt-1 text-sm text-[#7b827d]">Crie opções próprias para receitas ou despesas.</p>
        <div className="mt-6 space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-semibold">Nome</span><input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Viagens" className="w-full rounded-2xl border border-[#d8dad3] bg-white px-4 py-3.5 outline-none focus:border-[#5a715f] focus:ring-4 focus:ring-[#d8ff65]/25" /></label>
          <div><span className="mb-2 block text-sm font-semibold">Tipo</span><div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#edeee8] p-1.5"><button type="button" onClick={() => setKind("expense")} className={`rounded-xl px-3 py-2.5 text-sm font-bold ${kind === "expense" ? "bg-white shadow-sm" : "text-[#747c77]"}`}>Despesa</button><button type="button" onClick={() => setKind("income")} className={`rounded-xl px-3 py-2.5 text-sm font-bold ${kind === "income" ? "bg-white shadow-sm" : "text-[#747c77]"}`}>Receita</button></div></div>
          <div><span className="mb-2 block text-sm font-semibold">Cor</span><div className="flex flex-wrap gap-2">{colors.map((item) => <button type="button" key={item} onClick={() => setColor(item)} aria-label={`Escolher cor ${item}`} className={`h-9 w-9 rounded-full transition ${color === item ? "scale-110 ring-2 ring-[#17231d] ring-offset-2" : "hover:scale-105"}`} style={{ backgroundColor: item }} />)}</div></div>
          {error && <p className="rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#a43f35]">{error}</p>}
          <button disabled={saving} className="w-full rounded-2xl bg-[#17231d] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Criando..." : "Criar categoria"}</button>
        </div>
      </form>

      <div className="grid gap-5 md:grid-cols-2">
        <CategoryGroup title="Despesas" kind="expense" categories={categories} onDelete={onDelete} />
        <CategoryGroup title="Receitas" kind="income" categories={categories} onDelete={onDelete} />
      </div>
    </div>
  );
}

function CategoryGroup({ title, kind, categories, onDelete }: { title: string; kind: EntryKind; categories: Category[]; onDelete: (category: Category) => Promise<void> }) {
  const filtered = categories.filter((category) => category.kind === kind);
  return <section className="rounded-[24px] border border-[#dedfd8] bg-[#fbfbf8] p-5 panel-shadow sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-xs text-[#858c87]">{filtered.length} categorias</p></div><Tags size={20} className="text-[#7a837d]" /></div><div className="space-y-2">{filtered.map((category) => <div key={category.id} className="group flex items-center gap-3 rounded-2xl border border-[#e4e5df] bg-white px-4 py-3"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{category.name}</span><button onClick={() => void onDelete(category)} className="rounded-lg p-2 text-[#a18a86] opacity-60 transition hover:bg-[#fff0ed] hover:text-[#a43f35] group-hover:opacity-100" aria-label={`Excluir ${category.name}`}><Trash2 size={15} /></button></div>)}</div></section>;
}

