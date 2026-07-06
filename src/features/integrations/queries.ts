import "server-only";

import { cache } from "react";

/**
 * Public-side read of the AutoScout24 embed settings. The table is RLS
 * super_admin-only, so the public site reads it with the service role
 * (server-side). No service key → explicitly not configured.
 */
export const getAutoscoutPublicSettings = cache(
  async (): Promise<{ configured: boolean; snippet: string | null }> => {
    if (
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL
    ) {
      return { configured: false, snippet: null };
    }
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const { data } = await createAdminClient()
        .from("autoscout_settings")
        .select("embed_snippet, status")
        .eq("id", 1)
        .maybeSingle();
      const snippet = data?.embed_snippet ?? null;
      return { configured: Boolean(snippet), snippet };
    } catch {
      return { configured: false, snippet: null };
    }
  },
);
