import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Service-role client — BYPASSES RLS. Server-side only (enforced by
 * the "server-only" import). Use exclusively where the anon/user
 * context cannot work (e.g. reading autoscout_settings for the public
 * embed, storage cleanup on vehicle deletion).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase service role non configurato: impostare SUPABASE_SERVICE_ROLE_KEY in .env.local (solo server-side)",
    );
  }
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
