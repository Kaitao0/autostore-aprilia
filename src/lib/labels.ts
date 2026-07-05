import type {
  AvailabilityStatus,
  BodyType,
  Drivetrain,
  FuelType,
  LeadStatus,
  LeadType,
  Transmission,
  VehicleCondition,
} from "@/lib/types/database";

/** Italian UI labels for DB enums (code stays in English). */

export const conditionLabels: Record<VehicleCondition, string> = {
  nuovo: "Nuovo",
  usato: "Usato",
  km0: "Km 0",
  aziendale: "Aziendale",
  demo: "Demo",
};

export const availabilityLabels: Record<AvailabilityStatus, string> = {
  disponibile: "Disponibile",
  riservato: "Riservata",
  venduto: "Venduta",
  in_arrivo: "In arrivo",
  non_disponibile: "Non disponibile",
};

export const fuelTypeLabels: Record<FuelType, string> = {
  benzina: "Benzina",
  diesel: "Diesel",
  gpl: "GPL",
  metano: "Metano",
  hybrid: "Ibrida",
  hybrid_plugin: "Ibrida plug-in",
  mild_hybrid: "Mild hybrid",
  elettrico: "Elettrica",
  altro: "Altro",
};

export const transmissionLabels: Record<Transmission, string> = {
  manuale: "Manuale",
  automatico: "Automatico",
  semiautomatico: "Semiautomatico",
};

export const bodyTypeLabels: Record<BodyType, string> = {
  berlina: "Berlina",
  station_wagon: "Station wagon",
  suv: "SUV",
  crossover: "Crossover",
  citycar: "Citycar",
  utilitaria: "Utilitaria",
  monovolume: "Monovolume",
  coupe: "Coupé",
  cabrio: "Cabrio",
  pickup: "Pick-up",
  furgone: "Furgone",
  altro: "Altro",
};

export const drivetrainLabels: Record<Drivetrain, string> = {
  anteriore: "Anteriore",
  posteriore: "Posteriore",
  integrale: "Integrale",
};

export const leadTypeLabels: Record<LeadType, string> = {
  info_veicolo: "Info veicolo",
  test_drive: "Test drive",
  visita: "Visita",
  permuta: "Permuta",
  valutazione_usato: "Valutazione usato",
  contatto_generico: "Contatto generico",
  finanziamento: "Finanziamento",
};

export const leadStatusLabels: Record<LeadStatus, string> = {
  nuovo: "Nuovo",
  da_contattare: "Da contattare",
  contattato: "Contattato",
  appuntamento: "Appuntamento",
  chiuso: "Chiuso",
  non_interessato: "Non interessato",
  spam: "Spam",
};

export function enumOptions<T extends string>(
  labels: Record<T, string>,
): Array<{ value: T; label: string }> {
  return (Object.entries(labels) as Array<[T, string]>).map(
    ([value, label]) => ({ value, label }),
  );
}
