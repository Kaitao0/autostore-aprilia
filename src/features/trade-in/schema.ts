import { z } from "zod";

const optionalTrimmed = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z
    .number("Inserisci un numero valido")
    .int("Inserisci un numero intero")
    .nullable(),
);

function optionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.enum(values).nullable(),
  );
}

export const tradeInFormSchema = z.object({
  first_name: z.string().trim().min(2, "Inserisci il nome"),
  last_name: optionalTrimmed,
  email: z.string().trim().email("Inserisci un'email valida"),
  phone: optionalTrimmed,
  car_make: z.string().trim().min(1, "Inserisci la marca dell'auto"),
  car_model: z.string().trim().min(1, "Inserisci il modello dell'auto"),
  car_version: optionalTrimmed,
  car_year: optionalInt.refine(
    (v) => v === null || (v >= 1950 && v <= 2100),
    "Anno non valido",
  ),
  car_mileage: optionalInt.refine(
    (v) => v === null || v >= 0,
    "I km non possono essere negativi",
  ),
  car_fuel_type: optionalEnum([
    "benzina",
    "diesel",
    "gpl",
    "metano",
    "hybrid",
    "hybrid_plugin",
    "mild_hybrid",
    "elettrico",
    "altro",
  ]),
  car_transmission: optionalEnum(["manuale", "automatico", "semiautomatico"]),
  plate: optionalTrimmed,
  existing_finance: z.boolean(),
  message: z
    .string()
    .trim()
    .max(2000, "Messaggio troppo lungo (max 2000 caratteri)")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  privacy_consent: z.literal(true, {
    error: "Per inviare la richiesta è necessario accettare la privacy policy",
  }),
  website: z.string().max(0).optional(),
});

export type TradeInFormValues = z.infer<typeof tradeInFormSchema>;

export const TRADE_IN_MAX_PHOTOS = 6;
export const TRADE_IN_MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
export const TRADE_IN_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
