import { z } from "zod";

/**
 * Shared client+server validation for the vehicle form.
 * Draft saves are permissive (make/model only); publishing is BLOCKED
 * unless the publish requirements below are satisfied.
 */

const optionalTrimmed = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().finite().nullable(),
);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().nullable(),
);

/** Empty select value ("") becomes null before enum validation. */
function optionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.enum(values).nullable(),
  );
}

export const vehicleFormSchema = z
  .object({
    make: z.string().trim().min(1, "La marca è obbligatoria"),
    model: z.string().trim().min(1, "Il modello è obbligatorio"),
    version: optionalTrimmed,
    display_title: optionalTrimmed,
    slug: optionalTrimmed,
    internal_code: optionalTrimmed,
    condition: z.enum(["nuovo", "usato", "km0", "aziendale", "demo"]),
    body_type: optionalEnum([
      "berlina",
      "station_wagon",
      "suv",
      "crossover",
      "citycar",
      "utilitaria",
      "monovolume",
      "coupe",
      "cabrio",
      "pickup",
      "furgone",
      "altro",
    ]),
    availability: z.enum([
      "disponibile",
      "riservato",
      "venduto",
      "in_arrivo",
      "non_disponibile",
    ]),
    price: optionalNumber,
    previous_price: optionalNumber,
    price_on_request: z.boolean(),
    vat_deductible: z.boolean().nullable().optional(),
    year: optionalInt,
    registration_month: optionalInt.refine(
      (v) => v === null || (v >= 1 && v <= 12),
      "Mese non valido (1-12)",
    ),
    mileage: optionalInt.refine(
      (v) => v === null || v >= 0,
      "I km non possono essere negativi",
    ),
    fuel_type: optionalEnum([
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
    transmission: optionalEnum(["manuale", "automatico", "semiautomatico"]),
    power_hp: optionalInt,
    power_kw: optionalInt,
    engine_displacement: optionalInt,
    exterior_color: optionalTrimmed,
    interior_color: optionalTrimmed,
    doors: optionalInt,
    seats: optionalInt,
    emission_class: optionalTrimmed,
    drivetrain: optionalEnum(["anteriore", "posteriore", "integrale"]),
    previous_owners: optionalInt,
    plate: optionalTrimmed,
    vin: optionalTrimmed,
    description: optionalTrimmed,
    warranty: optionalTrimmed,
    internal_notes: optionalTrimmed,
    location: optionalTrimmed,
    cover_image_url: optionalTrimmed,
    video_url: optionalTrimmed,
    autoscout_url: optionalTrimmed,
    equipment: z
      .array(z.string())
      .default([])
      .transform((items) => items.map((s) => s.trim()).filter(Boolean)),
    featured: z.boolean(),
    published: z.boolean(),
    showroom_enabled: z.boolean(),
    sort_order: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
      z.number().int(),
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.published) return;

    const require = (
      condition: boolean,
      path: keyof typeof data,
      message: string,
    ) => {
      if (!condition) {
        ctx.addIssue({ code: "custom", path: [path], message });
      }
    };

    require(
      data.price !== null || data.price_on_request,
      "price",
      "Per pubblicare serve un prezzo oppure 'Prezzo su richiesta'",
    );
    require(data.year !== null, "year", "Per pubblicare serve l'anno");
    require(
      data.mileage !== null,
      "mileage",
      "Per pubblicare servono i chilometri",
    );
    require(
      data.fuel_type != null,
      "fuel_type",
      "Per pubblicare serve l'alimentazione",
    );
    require(
      Boolean(data.cover_image_url),
      "cover_image_url",
      "Per pubblicare serve almeno un'immagine di copertina",
    );
    require(
      Boolean(data.description && data.description.length >= 60),
      "description",
      "Per pubblicare serve una descrizione di almeno 60 caratteri",
    );
  });

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
export type VehicleFormInput = z.input<typeof vehicleFormSchema>;

/** Publish requirements checked again server-side for quick actions. */
export function getPublishBlockers(vehicle: {
  make: string | null;
  model: string | null;
  price: number | null;
  price_on_request: boolean;
  year: number | null;
  mileage: number | null;
  fuel_type: string | null;
  cover_image_url: string | null;
  description: string | null;
}): string[] {
  const blockers: string[] = [];
  if (!vehicle.make) blockers.push("marca mancante");
  if (!vehicle.model) blockers.push("modello mancante");
  if (vehicle.price === null && !vehicle.price_on_request)
    blockers.push("prezzo mancante (o attivare 'Prezzo su richiesta')");
  if (vehicle.year === null) blockers.push("anno mancante");
  if (vehicle.mileage === null) blockers.push("chilometri mancanti");
  if (!vehicle.fuel_type) blockers.push("alimentazione mancante");
  if (!vehicle.cover_image_url) blockers.push("immagine di copertina mancante");
  if (!vehicle.description || vehicle.description.length < 60)
    blockers.push("descrizione troppo corta (minimo 60 caratteri)");
  return blockers;
}
