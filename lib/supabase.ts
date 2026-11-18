import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
    },
    global: {
      fetch: (input, init = {}) => {
        // No servidor (Next.js 14), impede que o Data Cache congele as consultas ao Supabase em force-cache.
        // O controle de cache é feito pelo ISR (export const revalidate = 60) e pelo webhook on-demand.
        if (typeof window === "undefined") {
          return fetch(input, {
            ...init,
            cache: "no-store",
          });
        }
        return fetch(input, init);
      },
    },
  });

  return cachedClient;
}

export function cidadeSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
