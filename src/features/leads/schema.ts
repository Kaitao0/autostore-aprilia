import { z } from "zod";

/** Shared client+server validation for the public lead form. */
export const leadFormSchema = z.object({
  first_name: z.string().trim().min(2, "Inserisci il nome"),
  last_name: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  email: z.string().trim().email("Inserisci un'email valida"),
  phone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  message: z
    .string()
    .trim()
    .max(2000, "Messaggio troppo lungo (max 2000 caratteri)")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  preferred_channel: z.enum(["telefono", "whatsapp", "email"]).nullable().optional(),
  lead_type: z.enum([
    "info_veicolo",
    "test_drive",
    "visita",
    "permuta",
    "valutazione_usato",
    "contatto_generico",
    "finanziamento",
  ]),
  /** Free text: the car the visitor would trade in, if any. */
  trade_in: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  vehicle_id: z.uuid().nullable().optional(),
  source_page: z.string().trim().max(300).nullable().optional(),
  privacy_consent: z.literal(true, {
    error: "Per inviare la richiesta è necessario accettare la privacy policy",
  }),
  /** Honeypot: humans never fill this. */
  website: z.string().max(0).optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
