export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: { id: string; user_id: string; name: string; kind: string; color: string; created_at: string };
        Insert: { id?: string; user_id?: string; name: string; kind: string; color?: string; created_at?: string };
        Update: { id?: string; user_id?: string; name?: string; kind?: string; color?: string; created_at?: string };
        Relationships: [];
      };
      entries: {
        Row: { id: string; user_id: string; description: string; amount_cents: number; kind: string; category: string; status: string; due_date: string | null; reference_month: string; notes: string | null; recurrence_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id?: string; description: string; amount_cents: number; kind: string; category: string; status?: string; due_date?: string | null; reference_month: string; notes?: string | null; recurrence_id?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; description?: string; amount_cents?: number; kind?: string; category?: string; status?: string; due_date?: string | null; reference_month?: string; notes?: string | null; recurrence_id?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      recurrences: {
        Row: { id: string; user_id: string; description: string; amount_cents: number; kind: string; category: string; day_of_month: number; start_month: string; end_month: string | null; notes: string | null; active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; user_id?: string; description: string; amount_cents: number; kind: string; category: string; day_of_month: number; start_month: string; end_month?: string | null; notes?: string | null; active?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; description?: string; amount_cents?: number; kind?: string; category?: string; day_of_month?: number; start_month?: string; end_month?: string | null; notes?: string | null; active?: boolean; created_at?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

