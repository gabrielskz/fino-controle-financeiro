import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  DashboardData,
  Entry,
  EntryKind,
  EntryPayload,
  Recurrence,
  RecurrencePayload,
} from "@/lib/types";

const defaultCategories: Record<EntryKind, Array<{ name: string; color: string }>> = {
  expense: [
    { name: "Moradia", color: "#d8ff65" },
    { name: "Alimentação", color: "#8fd3b6" },
    { name: "Transporte", color: "#f2bd70" },
    { name: "Saúde", color: "#e9a5a0" },
    { name: "Educação", color: "#9cb8e7" },
    { name: "Lazer", color: "#c5a8de" },
    { name: "Assinaturas", color: "#91c7c4" },
    { name: "Outros", color: "#b7bbb4" },
  ],
  income: [
    { name: "Salário", color: "#8fd3b6" },
    { name: "Freelance", color: "#9cb8e7" },
    { name: "Investimentos", color: "#d8ff65" },
    { name: "Reembolso", color: "#f2bd70" },
    { name: "Vendas", color: "#c5a8de" },
    { name: "Outras receitas", color: "#b7bbb4" },
  ],
};

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function getCurrentUser() {
  const { data, error } = await createClient().auth.getUser();
  throwIfError(error);
  return data.user;
}

export async function ensureDefaultCategories(): Promise<void> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });
  throwIfError(error);
  if ((count ?? 0) > 0) return;

  const rows = (["expense", "income"] as EntryKind[]).flatMap((kind) =>
    defaultCategories[kind].map((category) => ({ ...category, kind })),
  );
  const { error: insertError } = await supabase.from("categories").insert(rows);
  throwIfError(insertError);
}

export async function getCategories(): Promise<Category[]> {
  await ensureDefaultCategories();
  const { data, error } = await createClient()
    .from("categories")
    .select("*")
    .order("kind")
    .order("name");
  throwIfError(error);
  return (data ?? []) as Category[];
}

export async function createCategory(
  name: string,
  kind: EntryKind,
  color = "#8fd3b6",
): Promise<Category> {
  const { data, error } = await createClient()
    .from("categories")
    .insert({ name: name.trim(), kind, color })
    .select()
    .single();
  if (error?.code === "23505") throw new Error("Essa categoria já existe.");
  throwIfError(error);
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await createClient().from("categories").delete().eq("id", id);
  throwIfError(error);
}

function dueDateForMonth(month: string, day: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export async function materializeRecurrences(month: string): Promise<void> {
  const supabase = createClient();
  const { data: recurrences, error } = await supabase
    .from("recurrences")
    .select("*")
    .eq("active", true)
    .lte("start_month", month)
    .or(`end_month.is.null,end_month.gte.${month}`);
  throwIfError(error);
  if (!recurrences?.length) return;

  const ids = recurrences.map((item) => item.id);
  const { data: existing, error: existingError } = await supabase
    .from("entries")
    .select("recurrence_id")
    .eq("reference_month", month)
    .in("recurrence_id", ids);
  throwIfError(existingError);
  const generated = new Set((existing ?? []).map((item) => item.recurrence_id));

  const missing = (recurrences as Recurrence[])
    .filter((item) => !generated.has(item.id))
    .map((item) => ({
      description: item.description,
      amount_cents: item.amount_cents,
      kind: item.kind,
      category: item.category,
      status: "pending",
      due_date: dueDateForMonth(month, item.day_of_month),
      reference_month: month,
      notes: item.notes,
      recurrence_id: item.id,
    }));

  if (missing.length) {
    const { error: insertError } = await supabase.from("entries").insert(missing);
    if (insertError?.code !== "23505") throwIfError(insertError);
  }
}

export async function getEntries(fromMonth: string, toMonth = fromMonth): Promise<Entry[]> {
  const { data, error } = await createClient()
    .from("entries")
    .select("*")
    .gte("reference_month", fromMonth)
    .lte("reference_month", toMonth)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as Entry[];
}

export async function getReportEntries(fromMonth: string, toMonth: string): Promise<Entry[]> {
  const [startYear, startMonth] = fromMonth.split("-").map(Number);
  const [endYear, endMonth] = toMonth.split("-").map(Number);
  const cursor = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);
  let processed = 0;
  while (cursor <= end && processed < 120) {
    const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    await materializeRecurrences(month);
    cursor.setMonth(cursor.getMonth() + 1);
    processed += 1;
  }
  return getEntries(fromMonth, toMonth);
}

export async function getDashboard(month: string): Promise<DashboardData> {
  await materializeRecurrences(month);
  const entries = await getEntries(month);
  const income = entries.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount_cents, 0);
  const expense = entries.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount_cents, 0);
  const categoryMap = new Map<string, number>();
  entries.filter((item) => item.kind === "expense").forEach((item) => {
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.amount_cents);
  });

  return {
    reference_month: month,
    income_cents: income,
    expense_cents: expense,
    balance_cents: income - expense,
    paid_expense_cents: entries.filter((item) => item.kind === "expense" && item.status === "paid").reduce((sum, item) => sum + item.amount_cents, 0),
    pending_expense_cents: entries.filter((item) => item.kind === "expense" && item.status === "pending").reduce((sum, item) => sum + item.amount_cents, 0),
    pending_income_cents: entries.filter((item) => item.kind === "income" && item.status === "pending").reduce((sum, item) => sum + item.amount_cents, 0),
    categories: [...categoryMap.entries()]
      .map(([category, amount_cents]) => ({ category, amount_cents }))
      .sort((a, b) => b.amount_cents - a.amount_cents),
    entries,
  };
}

export async function createEntry(payload: EntryPayload): Promise<Entry> {
  const { data, error } = await createClient().from("entries").insert(payload).select().single();
  throwIfError(error);
  return data as Entry;
}

function shiftEntryMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftDueDate(dueDate: string | null, month: string, amount: number): string | null {
  if (!dueDate) return null;
  const day = Number(dueDate.slice(8, 10));
  return dueDateForMonth(shiftEntryMonth(month, amount), day);
}

export async function createInstallmentEntries(
  payload: EntryPayload,
  installmentCount: number,
): Promise<Entry[]> {
  const groupId = crypto.randomUUID();
  const baseAmount = Math.floor(payload.amount_cents / installmentCount);
  const remainder = payload.amount_cents % installmentCount;
  const rows = Array.from({ length: installmentCount }, (_, index) => ({
    ...payload,
    amount_cents: baseAmount + (index < remainder ? 1 : 0),
    status: "pending",
    reference_month: shiftEntryMonth(payload.reference_month, index),
    due_date: shiftDueDate(payload.due_date, payload.reference_month, index),
    installment_group_id: groupId,
    installment_number: index + 1,
    installment_total: installmentCount,
  }));
  const { data, error } = await createClient().from("entries").insert(rows).select();
  throwIfError(error);
  return (data ?? []) as Entry[];
}

export async function updateEntry(id: string, payload: Partial<EntryPayload>): Promise<Entry> {
  const { data, error } = await createClient().from("entries").update(payload).eq("id", id).select().single();
  throwIfError(error);
  return data as Entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await createClient().from("entries").delete().eq("id", id);
  throwIfError(error);
}

export async function markMonthExpensesPaid(month: string): Promise<number> {
  const { data, error } = await createClient()
    .from("entries")
    .update({ status: "paid" })
    .eq("reference_month", month)
    .eq("kind", "expense")
    .eq("status", "pending")
    .select("id");
  throwIfError(error);
  return data?.length ?? 0;
}

export async function deleteOwnAccount(): Promise<void> {
  const { error } = await createClient().rpc("delete_own_account");
  throwIfError(error);
}

export async function getRecurrences(): Promise<Recurrence[]> {
  const { data, error } = await createClient()
    .from("recurrences")
    .select("*")
    .order("active", { ascending: false })
    .order("description");
  throwIfError(error);
  return (data ?? []) as Recurrence[];
}

export async function createRecurrence(payload: RecurrencePayload): Promise<Recurrence> {
  const { data, error } = await createClient().from("recurrences").insert(payload).select().single();
  throwIfError(error);
  return data as Recurrence;
}

export async function updateRecurrence(id: string, payload: Partial<RecurrencePayload>): Promise<Recurrence> {
  const { data, error } = await createClient().from("recurrences").update(payload).eq("id", id).select().single();
  throwIfError(error);
  return data as Recurrence;
}

export async function deleteRecurrence(id: string): Promise<void> {
  const { error } = await createClient().from("recurrences").delete().eq("id", id);
  throwIfError(error);
}
