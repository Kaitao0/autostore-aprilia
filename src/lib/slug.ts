/** URL-safe slug from vehicle data, e.g. "volkswagen-golf-1-5-tsi-2021". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function vehicleSlug(parts: {
  make: string;
  model: string;
  version?: string | null;
  year?: number | null;
}): string {
  return slugify(
    [parts.make, parts.model, parts.version ?? "", parts.year ?? ""]
      .filter(Boolean)
      .join(" "),
  );
}
