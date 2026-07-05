"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { sendStaffNotification } from "@/features/notifications/send";
import {
  TRADE_IN_ALLOWED_TYPES,
  TRADE_IN_MAX_PHOTO_BYTES,
  TRADE_IN_MAX_PHOTOS,
  tradeInFormSchema,
} from "./schema";

export type TradeInFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  emailNotConfigured?: boolean;
  /** photos saved / photos submitted (photos are best-effort) */
  photosSaved?: number;
  photosSubmitted?: number;
};

export async function submitTradeInAction(
  _prev: TradeInFormState,
  formData: FormData,
): Promise<TradeInFormState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Il modulo non è ancora attivo (database non configurato). Contattaci via email o telefono.",
    };
  }

  const parsed = tradeInFormSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    car_make: formData.get("car_make"),
    car_model: formData.get("car_model"),
    car_version: formData.get("car_version"),
    car_year: formData.get("car_year"),
    car_mileage: formData.get("car_mileage"),
    car_fuel_type: formData.get("car_fuel_type") || null,
    car_transmission: formData.get("car_transmission") || null,
    plate: formData.get("plate"),
    existing_finance: formData.get("existing_finance") === "on",
    message: formData.get("message"),
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

  // Honeypot: pretend success, store nothing.
  if (values.website && values.website.length > 0) {
    return {
      status: "success",
      message: "Richiesta inviata. Ti ricontatteremo con la valutazione.",
    };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const limited = rateLimit(`trade-in:${ip}`, { limit: 3, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return {
      status: "error",
      message: `Hai inviato troppe richieste ravvicinate. Riprova tra ${limited.retryAfterSeconds} secondi.`,
    };
  }

  // Photos: validated here, uploaded after the request row exists.
  const photos = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > TRADE_IN_MAX_PHOTOS) {
    return {
      status: "error",
      message: `Puoi allegare al massimo ${TRADE_IN_MAX_PHOTOS} foto.`,
    };
  }
  for (const photo of photos) {
    if (photo.size > TRADE_IN_MAX_PHOTO_BYTES) {
      return {
        status: "error",
        message: `La foto "${photo.name}" supera gli 8 MB consentiti.`,
      };
    }
    if (!TRADE_IN_ALLOWED_TYPES.includes(photo.type)) {
      return {
        status: "error",
        message: `Formato non supportato per "${photo.name}" (usa JPG, PNG, WEBP o HEIC).`,
      };
    }
  }

  // Anon RLS forbids reading the row back: generate the id ourselves.
  const requestId = randomUUID();
  const supabase = await createClient();
  const { error } = await supabase.from("trade_in_requests").insert({
    id: requestId,
    first_name: values.first_name,
    last_name: values.last_name ?? null,
    email: values.email,
    phone: values.phone ?? null,
    car_make: values.car_make,
    car_model: values.car_model,
    car_version: values.car_version ?? null,
    car_year: values.car_year ?? null,
    car_mileage: values.car_mileage ?? null,
    car_fuel_type: values.car_fuel_type ?? null,
    car_transmission: values.car_transmission ?? null,
    plate: values.plate ?? null,
    existing_finance: values.existing_finance,
    message: values.message ?? null,
    privacy_consent: true,
  });
  if (error) {
    return {
      status: "error",
      message:
        "Non è stato possibile salvare la richiesta. Riprova tra qualche istante o contattaci direttamente.",
    };
  }

  // Best-effort photo upload to the PRIVATE bucket (request already saved).
  let photosSaved = 0;
  if (photos.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      for (const [index, photo] of photos.entries()) {
        const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `trade-ins/${requestId}/${index + 1}-${randomUUID().slice(0, 8)}.${ext}`;
        const { error: uploadError } = await admin.storage
          .from("trade-in-images")
          .upload(path, photo, { contentType: photo.type });
        if (uploadError) continue;
        const { error: rowError } = await admin
          .from("trade_in_images")
          .insert({ trade_in_id: requestId, storage_path: path });
        if (!rowError) photosSaved += 1;
      }
    } catch {
      // Photos are best-effort; the request itself is already stored.
    }
  }

  const outcome = await sendStaffNotification({
    subject: `Nuova richiesta di valutazione — ${values.car_make} ${values.car_model}`,
    text: [
      `Auto: ${values.car_make} ${values.car_model} ${values.car_version ?? ""}`.trim(),
      values.car_year ? `Anno: ${values.car_year}` : null,
      values.car_mileage !== null && values.car_mileage !== undefined
        ? `Km: ${values.car_mileage}`
        : null,
      values.plate ? `Targa: ${values.plate}` : null,
      `Finanziamento in corso: ${values.existing_finance ? "sì" : "no"}`,
      `Foto allegate: ${photosSaved}/${photos.length}`,
      "",
      `Contatto: ${values.first_name} ${values.last_name ?? ""}`.trim(),
      `Email: ${values.email}`,
      values.phone ? `Telefono: ${values.phone}` : null,
      "",
      values.message ?? "(nessun messaggio)",
      "",
      "Gestisci la richiesta: /admin/permute",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
    type: "trade_in",
  });

  return {
    status: "success",
    message: "Richiesta inviata. Ti ricontatteremo con la valutazione.",
    emailNotConfigured: outcome === "not_configured",
    photosSaved,
    photosSubmitted: photos.length,
  };
}
