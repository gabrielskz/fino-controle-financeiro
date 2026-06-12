export type EntryKind = "income" | "expense";
export type EntryStatus = "pending" | "paid" | "received";
export type AppView = "overview" | "categories" | "recurrences" | "reports";

export interface Entry {
  id: string;
  user_id: string;
  description: string;
  amount_cents: number;
  kind: EntryKind;
  category: string;
  status: EntryStatus;
  due_date: string | null;
  reference_month: string;
  notes: string | null;
  recurrence_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryPayload {
  description: string;
  amount_cents: number;
  kind: EntryKind;
  category: string;
  status: EntryStatus;
  due_date: string | null;
  reference_month: string;
  notes: string | null;
  recurrence_id?: string | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: EntryKind;
  color: string;
  created_at: string;
}

export interface Recurrence {
  id: string;
  user_id: string;
  description: string;
  amount_cents: number;
  kind: EntryKind;
  category: string;
  day_of_month: number;
  start_month: string;
  end_month: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type RecurrencePayload = Omit<
  Recurrence,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface CategoryTotal {
  category: string;
  amount_cents: number;
}

export interface DashboardData {
  reference_month: string;
  income_cents: number;
  expense_cents: number;
  balance_cents: number;
  paid_expense_cents: number;
  pending_expense_cents: number;
  pending_income_cents: number;
  categories: CategoryTotal[];
  entries: Entry[];
}

export interface MonthlyReport {
  month: string;
  income_cents: number;
  expense_cents: number;
  balance_cents: number;
}

