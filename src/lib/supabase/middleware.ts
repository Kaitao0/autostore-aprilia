import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/types/database";
import type { User } from "@supabase/supabase-js";

/**
 * Refreshes the auth session cookie on every matched request and
 * returns the current user. Used by src/middleware.ts to protect /admin.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
  supabase: ReturnType<typeof createServerClient<Database>>;
}> {
  let response = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: do not run code between client creation and getUser() —
  // the call refreshes the session and rewrites cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
