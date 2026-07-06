import type {
  BodyType,
  FuelType,
  Transmission,
  VehicleCondition,
} from "@/lib/types/database";

/**
 * CSV import: shared field definitions + tolerant normalizers
 * (usable from both the client wizard and the server action).
 */

export type ImportRow = {
  external_id: string | null;
  make: string;
  model: string;
  version: string | null;
  price: number | null;
  year: number | null;
  mileage: number | null;
  fuel_type: FuelType | null;
  transmission: Transmission | null;
  body_type: BodyType | null;
  condition: VehicleCondition | null;
  exterior_color: string | null;
  power_hp: number | null;
  doors: number | null;
  seats: number | null;
  description: string | null;
};

export const IMPORT_FIELDS: Array<{
  key: keyof ImportRow;
  label: string;
  required?: boolean;
  hint?: string;
}> = [
  { key: "external_id", label: "Codice esterno (dedup)", hint: "Consigliato: evita i doppi inserimenti" },
  { key: "make", label: "Marca", required: true },
  { key: "model", label: "Modello", required: true },
  { key: "version", label: "Versione" },
  { key: "price", label: "Prezzo (€)" },
  { key: "year", label: "Anno" },
  { key: "mileage", label: "Chilometri" },
  { key: "fuel_type", label: "Alimentazione" },
  { key: "transmission", label: "Cambio" },
  { key: "body_type", label: "Carrozzeria" },
  { key: "condition", label: "Condizione" },
  { key: "exterior_color", label: "Colore esterno" },
  { key: "power_hp", label: "Potenza (CV)" },
  { key: "doors", label: "Porte" },
  { key: "seats", label: "Posti" },
  { key: "description", label: "Descrizione" },
];

/** Header auto-guessing: common Italian/AS24-style column names. */
export const HEADER_GUESSES: Record<keyof ImportRow, string[]> = {
  external_id: ["external_id", "id", "codice", "code", "riferimento", "ref"],
  make: ["make", "marca", "brand", "casa"],
  model: ["model", "modello"],
  version: ["version", "versione", "allestimento", "trim"],
  price: ["price", "prezzo", "prezzo_vendita", "importo"],
  year: ["year", "anno", "immatricolazione", "anno_immatricolazione"],
  mileage: ["mileage", "km", "chilometri", "chilometraggio"],
  fuel_type: ["fuel", "fuel_type", "alimentazione", "carburante"],
  transmission: ["transmission", "cambio", "trasmissione"],
  body_type: ["body", "body_type", "carrozzeria"],
  condition: ["condition", "condizione", "stato"],
  exterior_color: ["color", "colore", "exterior_color", "colore_esterno"],
  power_hp: ["power", "cv", "potenza", "power_hp", "hp"],
  doors: ["doors", "porte"],
  seats: ["seats", "posti"],
  description: ["description", "descrizione", "note"],
};

function clean(value: string | undefined | null): string {
  return (value ?? "").trim();
}

export function parseNumber(value: string | undefined | null): number | null {
  const raw = clean(value)
    .replace(/[€.\s]/g, "")
    .replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseIntSafe(value: string | undefined | null): number | null {
  const n = parseNumber(value);
  return n === null ? null : Math.round(n);
}

export function normalizeFuel(value: string | undefined | null): FuelType | null {
  const v = clean(value).toLowerCase();
  if (v === "") return null;
  if (v.includes("plug")) return "hybrid_plugin";
  if (v.includes("mild")) return "mild_hybrid";
  if (v.includes("ibrid") || v.includes("hybrid")) return "hybrid";
  if (v.includes("benzina") || v.includes("petrol") || v.includes("gasoline")) return "benzina";
  if (v.includes("diesel") || v.includes("gasolio")) return "diesel";
  if (v.includes("gpl") || v.includes("lpg")) return "gpl";
  if (v.includes("metano") || v.includes("cng")) return "metano";
  if (v.includes("elettric") || v.includes("electric") || v === "ev") return "elettrico";
  return "altro";
}

export function normalizeTransmission(
  value: string | undefined | null,
): Transmission | null {
  const v = clean(value).toLowerCase();
  if (v === "") return null;
  if (v.startsWith("semiaut")) return "semiautomatico";
  if (v.startsWith("aut")) return "automatico";
  if (v.startsWith("man")) return "manuale";
  return null;
}

export function normalizeBody(value: string | undefined | null): BodyType | null {
  const v = clean(value).toLowerCase().replace(/\s+/g, "_");
  if (v === "") return null;
  const map: Record<string, BodyType> = {
    berlina: "berlina", sedan: "berlina",
    station_wagon: "station_wagon", sw: "station_wagon", wagon: "station_wagon", familiare: "station_wagon",
    suv: "suv", fuoristrada: "suv",
    crossover: "crossover",
    citycar: "citycar", city_car: "citycar",
    utilitaria: "utilitaria", hatchback: "utilitaria",
    monovolume: "monovolume", minivan: "monovolume",
    coupe: "coupe", "coupé": "coupe",
    cabrio: "cabrio", cabriolet: "cabrio", spider: "cabrio",
    pickup: "pickup", pick_up: "pickup",
    furgone: "furgone", van: "furgone",
  };
  return map[v] ?? "altro";
}

export function normalizeCondition(
  value: string | undefined | null,
): VehicleCondition | null {
  const v = clean(value).toLowerCase().replace(/\s+/g, "");
  if (v === "") return null;
  if (v === "nuovo" || v === "new") return "nuovo";
  if (v === "km0" || v === "kmzero" || v === "km_0") return "km0";
  if (v.startsWith("aziendal")) return "aziendale";
  if (v === "demo" || v.startsWith("dimostrat")) return "demo";
  return "usato";
}

/** Maps a raw CSV record through the column mapping into an ImportRow. */
export function buildImportRow(
  record: Record<string, string>,
  mapping: Partial<Record<keyof ImportRow, string>>,
): { row: ImportRow; errors: string[] } {
  const get = (key: keyof ImportRow): string =>
    mapping[key] ? clean(record[mapping[key] as string]) : "";

  const errors: string[] = [];
  const make = get("make");
  const model = get("model");
  if (!make) errors.push("marca mancante");
  if (!model) errors.push("modello mancante");

  const price = parseNumber(get("price"));
  if (get("price") !== "" && price === null) errors.push("prezzo non numerico");
  const year = parseIntSafe(get("year"));
  if (year !== null && (year < 1950 || year > 2100)) errors.push("anno non valido");
  const mileage = parseIntSafe(get("mileage"));
  if (mileage !== null && mileage < 0) errors.push("km negativi");

  const row: ImportRow = {
    external_id: get("external_id") || null,
    make,
    model,
    version: get("version") || null,
    price,
    year,
    mileage,
    fuel_type: normalizeFuel(get("fuel_type")),
    transmission: normalizeTransmission(get("transmission")),
    body_type: normalizeBody(get("body_type")),
    condition: normalizeCondition(get("condition")),
    exterior_color: get("exterior_color") || null,
    power_hp: parseIntSafe(get("power_hp")),
    doors: parseIntSafe(get("doors")),
    seats: parseIntSafe(get("seats")),
    description: get("description") || null,
  };
  return { row, errors };
}
