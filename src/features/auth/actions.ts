"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().trim().email("Inserisci un indirizzo email valido"),
  password: z.string().min(1, "Inserisci la password"),
  next: z.string().startsWith("/admin").optional(),
});

export type LoginState = {
  error: string | null;
};

export async function signInAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase non è configurato: impostare le variabili d'ambiente in .env.local prima di accedere.",
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Credenziali non valide. Riprova." };
  }

  const { data: isStaff } = await supabase.rpc("is_staff", {
    _user_id: data.user.id,
  });
  if (!isStaff) {
    await supabase.auth.signOut();
    return {
      error:
        "L'account non ha i permessi per accedere all'area amministrativa.",
    };
  }

  redirect(parsed.data.next ?? "/admin");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
