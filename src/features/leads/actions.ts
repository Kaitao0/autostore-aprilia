"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { sendStaffNotification } from "@/features/notifications/send";
import { leadTypeLabels } from "@/lib/labels";
import { leadFormSchema } from "./schema";

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  /** true when the request was saved but no email notification is configured */
  emailNotConfigured?: boolean;
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export async function submitLeadAction(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Il modulo non è ancora attivo (database non configurato). Contattaci via email o telefono.",
    };
  }

  const parsed = leadFormSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
    preferred_channel: formData.get("preferred_channel") || null,
    lead_type: formData.get("lead_type"),
    trade_in: formData.get("trade_in"),
    vehicle_id: formData.get("vehicle_id") || null,
    source_page: formData.get("source_page") || null,
    privacy_consent: formData.get("privacy_consent") === "on",
    website: (formData.get("website") as string) ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Controlla i dati inseriti",
    };
  }
  const values = parsed.data;

  // Honeypot filled: pretend success, store nothing.
  if (values.website && values.website.length > 0) {
    return { status: "success", message: "Richiesta inviata. Ti ricontatteremo al più presto." };
  }

  const ip = await clientIp();
  const limited = rateLimit(`lead:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return {
      status: "error",
      message: `Hai inviato troppe richieste ravvicinate. Riprova tra ${limited.retryAfterSeconds} secondi.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    first_name: values.first_name,
    last_name: values.last_name ?? null,
    email: values.email,
    phone: values.phone ?? null,
    message: values.message ?? null,
    lead_type: values.lead_type,
    vehicle_id: values.vehicle_id ?? null,
    source_page: values.source_page ?? null,
    source: "website",
    preferred_channel: values.preferred_channel ?? null,
    privacy_consent: true,
    trade_in_info: values.trade_in ? { note: values.trade_in } : null,
  });

  if (error) {
    return {
      status: "error",
      message:
        "Non è stato possibile salvare la richiesta. Riprova tra qualche istante o contattaci direttamente.",
    };
  }

  const outcome = await sendStaffNotification({
    subject: `Nuovo lead dal sito — ${leadTypeLabels[values.lead_type]}`,
    text: [
      `Tipo richiesta: ${leadTypeLabels[values.lead_type]}`,
      `Nome: ${values.first_name} ${values.last_name ?? ""}`.trim(),
      `Email: ${values.email}`,
      values.phone ? `Telefono: ${values.phone}` : null,
      values.preferred_channel
        ? `Canale preferito: ${values.preferred_channel}`
        : null,
      values.trade_in ? `Auto in permuta: ${values.trade_in}` : null,
      values.source_page ? `Pagina: ${values.source_page}` : null,
      "",
      values.message ?? "(nessun messaggio)",
      "",
      "Gestisci il lead: /admin/lead",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
    type: "lead",
  });

  return {
    status: "success",
    message: "Richiesta inviata. Ti ricontatteremo al più presto.",
    emailNotConfigured: outcome === "not_configured",
  };
}
