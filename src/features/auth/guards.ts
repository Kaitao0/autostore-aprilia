import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

export type StaffContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  isSuperAdmin: boolean;
};

/**
 * Server-side guard for admin pages and actions (defense in depth on
 * top of the middleware). Redirects to /admin/login when the request
 * has no valid staff session.
 */
export async function requireStaff(): Promise<StaffContext> {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login?reason=not_configured");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?reason=session_expired");
  }

  const { data: isStaff } = await supabase.rpc("is_staff", {
    _user_id: user.id,
  });
  if (!isStaff) {
    redirect("/admin/login?reason=unauthorized");
  }

  const { data: isSuperAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "super_admin",
  });

  return { supabase, user, isSuperAdmin: Boolean(isSuperAdmin) };
}

/** Same as requireStaff but for Server Actions: returns an error instead of redirecting. */
export async function getStaffOrNull(): Promise<StaffContext | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isStaff } = await supabase.rpc("is_staff", {
    _user_id: user.id,
  });
  if (!isStaff) return null;

  const { data: isSuperAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "super_admin",
  });

  return { supabase, user, isSuperAdmin: Boolean(isSuperAdmin) };
}
