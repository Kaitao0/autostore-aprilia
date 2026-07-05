"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaffOrNull } from "@/features/auth/guards";
import type { ActionResult } from "@/features/vehicles/actions";

const updateLeadSchema = z.object({
  status: z.enum([
    "nuovo",
    "da_contattare",
    "contattato",
    "appuntamento",
    "chiuso",
    "non_interessato",
    "spam",
  ]),
  internal_notes: z
    .string()
    .trim()
    .max(4000)
    .transform((v) => (v === "" ? null : v)),
});

export async function updateLeadAction(
  id: string,
  input: { status: string; internal_notes: string },
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const parsed = updateLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const { error } = await staff.supabase
    .from("leads")
    .update({
      status: parsed.data.status,
      internal_notes: parsed.data.internal_notes,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/lead");
  revalidatePath(`/admin/lead/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateTradeInAction(
  id: string,
  input: { status: string },
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const parsed = updateLeadSchema.shape.status.safeParse(input.status);
  if (!parsed.success) return { ok: false, error: "Stato non valido" };

  const { error } = await staff.supabase
    .from("trade_in_requests")
    .update({ status: parsed.data })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/permute");
  revalidatePath(`/admin/permute/${id}`);
  return { ok: true };
}
