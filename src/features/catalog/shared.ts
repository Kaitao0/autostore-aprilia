import type { PublicVehicleRow } from "@/lib/types/database";

/** Pure helpers usable from both server and client components. */

export function vehicleTitle(vehicle: PublicVehicleRow): string {
  return (
    vehicle.display_title ??
    [vehicle.make, vehicle.model, vehicle.version].filter(Boolean).join(" ")
  );
}

/** Badge logic derives from DB data only — never hardcoded. */
export function vehicleBadges(vehicle: PublicVehicleRow): Array<{
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}> {
  const badges: Array<{
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }> = [];

  if (vehicle.availability === "venduto")
    badges.push({ label: "Venduta", variant: "destructive" });
  if (vehicle.availability === "riservato")
    badges.push({ label: "Riservata", variant: "secondary" });
  if (vehicle.availability === "in_arrivo")
    badges.push({ label: "In arrivo", variant: "secondary" });

  if (vehicle.condition === "km0")
    badges.push({ label: "Km 0", variant: "outline" });
  if (vehicle.condition === "nuovo")
    badges.push({ label: "Nuova", variant: "outline" });

  if (
    vehicle.previous_price !== null &&
    vehicle.price !== null &&
    vehicle.previous_price > vehicle.price
  )
    badges.push({ label: "Prezzo ribassato", variant: "default" });

  if (vehicle.published_at) {
    const days =
      (Date.now() - new Date(vehicle.published_at).getTime()) / 86_400_000;
    if (days <= 14 && vehicle.availability === "disponibile")
      badges.push({ label: "Nuovo arrivo", variant: "default" });
  }

  return badges.slice(0, 2);
}
