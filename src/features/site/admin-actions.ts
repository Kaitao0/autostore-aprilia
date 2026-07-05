"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaffOrNull } from "@/features/auth/guards";
import type { ActionResult } from "@/features/vehicles/actions";

const optionalTrimmed = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const businessSchema = z.object({
  phone: optionalTrimmed,
  whatsapp: optionalTrimmed,
  email: optionalTrimmed,
  address: optionalTrimmed,
  city: optionalTrimmed,
  zip: optionalTrimmed,
  province: optionalTrimmed,
  autoscout_dealer_url: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || v.startsWith("https://"),
      "L'URL del profilo AutoScout24 deve iniziare con https://",
    ),
  hours: z
    .array(z.object({ days: z.string().trim(), hours: z.string().trim() }))
    .max(7),
  social: z
    .array(
      z.object({
        platform: z.enum(["instagram", "facebook", "tiktok", "youtube"]),
        url: z.string().trim(),
        enabled: z.boolean(),
      }),
    )
    .max(4)
    .refine(
      (items) =>
        items.every((s) => !s.enabled || s.url.startsWith("https://")),
      "I profili social attivi devono avere un URL https://",
    ),
});

export type BusinessFormInput = z.input<typeof businessSchema>;

export async function updateBusinessInformationAction(
  input: BusinessFormInput,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff || !staff.isSuperAdmin) {
    return { ok: false, error: "Operazione riservata al super admin" };
  }

  const parsed = businessSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  const values = parsed.data;

  const { error } = await staff.supabase
    .from("business_information")
    .update({
      phone: values.phone,
      whatsapp: values.whatsapp,
      email: values.email,
      address: values.address,
      city: values.city,
      zip: values.zip,
      province: values.province,
      autoscout_dealer_url: values.autoscout_dealer_url,
      hours: values.hours.filter((h) => h.days !== ""),
      social: values.social,
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };

  // Business data is rendered on every public page.
  revalidatePath("/", "layout");
  revalidatePath("/admin/impostazioni");
  return { ok: true };
}
