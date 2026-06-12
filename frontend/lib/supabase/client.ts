import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;
const persistencePreferenceKey = "fino-remember-session";

function shouldRememberSession(): boolean {
  return localStorage.getItem(persistencePreferenceKey) !== "false";
}

const authStorage = {
  getItem(key: string) {
    return shouldRememberSession() ? localStorage.getItem(key) : sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (shouldRememberSession()) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export function setAuthPersistence(remember: boolean): void {
  localStorage.setItem(persistencePreferenceKey, String(remember));
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase não configurado. Preencha o arquivo .env.local.");
  }

  client = createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: authStorage,
    },
  });
  return client;
}
