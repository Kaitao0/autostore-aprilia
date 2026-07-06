"use server";

import { revalidatePath } from "next/cache";
import { getStaffOrNull } from "@/features/auth/guards";
import type { ActionResult } from "@/features/vehicles/actions";

/** Saves (or clears) the AutoScout24 Carportal embed snippet. */
export async function updateAutoscoutSnippetAction(
  snippet: string,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff || !staff.isSuperAdmin) {
    return { ok: false, error: "Operazione riservata al super admin" };
  }

  const trimmed = snippet.trim();
  if (trimmed.length > 20_000) {
    return { ok: false, error: "Snippet troppo lungo (max 20.000 caratteri)" };
  }
  // Minimal sanity check: the Carportal snippet is an <iframe> or <script>.
  if (trimmed !== "" && !/<(iframe|script|div)[\s>]/i.test(trimmed)) {
    return {
      ok: false,
      error:
        "Lo snippet non sembra un embed valido (atteso un tag iframe, script o div fornito da AutoScout24)",
    };
  }

  const { error } = await staff.supabase
    .from("autoscout_settings")
    .update({
      embed_snippet: trimmed === "" ? null : trimmed,
      status: trimmed === "" ? "not_configured" : "configured",
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/integrazioni");
  revalidatePath("/");
  revalidatePath("/contatti");
  return { ok: true };
}
