const priceFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("it-IT");

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatPrice(value: number | null, priceOnRequest = false): string {
  if (priceOnRequest || value === null) return "Prezzo su richiesta";
  return priceFormatter.format(value);
}

export function formatMileage(km: number | null): string {
  if (km === null) return "—";
  return `${numberFormatter.format(km)} km`;
}

export function formatNumber(value: number | null): string {
  return value === null ? "—" : numberFormatter.format(value);
}

export function formatDate(iso: string | null): string {
  return iso ? dateFormatter.format(new Date(iso)) : "—";
}

export function formatDateTime(iso: string | null): string {
  return iso ? dateTimeFormatter.format(new Date(iso)) : "—";
}

/** "03/2021" from year + optional registration month. */
export function formatRegistration(
  year: number | null,
  month: number | null,
): string {
  if (!year) return "—";
  return month ? `${String(month).padStart(2, "0")}/${year}` : String(year);
}
