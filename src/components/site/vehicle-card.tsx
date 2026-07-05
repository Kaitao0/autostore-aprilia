import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Car } from "lucide-react";
import {
  vehicleBadges,
  vehicleTitle,
} from "@/features/catalog/queries";
import { formatMileage, formatPrice } from "@/lib/format";
import { fuelTypeLabels, transmissionLabels } from "@/lib/labels";
import type { PublicVehicleRow } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";

/**
 * Catalog card. The whole card is one link; specs use tabular figures.
 * Badges derive exclusively from DB data (vehicleBadges).
 */
export function VehicleCard({
  vehicle,
  priority = false,
}: {
  vehicle: PublicVehicleRow;
  priority?: boolean;
}) {
  const title = vehicleTitle(vehicle);
  const badges = vehicleBadges(vehicle);
  const sold = vehicle.availability === "venduto";

  const specs = [
    vehicle.year,
    vehicle.mileage !== null ? formatMileage(vehicle.mileage) : null,
    vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type] : null,
    vehicle.transmission ? transmissionLabels[vehicle.transmission] : null,
  ].filter(Boolean);

  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/auto/${vehicle.slug}`}
        className="bg-card focus-visible:ring-ring/50 flex h-full flex-col overflow-hidden rounded-xl border transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out-expo)] group-hover:-translate-y-1 group-hover:border-white/20 group-hover:shadow-lg focus-visible:ring-3 focus-visible:outline-none active:scale-[0.99] motion-reduce:transform-none"
        aria-label={`${title} — scopri l'auto`}
      >
        <div className="bg-surface-2 relative aspect-[16/10] overflow-hidden">
          {vehicle.cover_image_url ? (
            <Image
              src={vehicle.cover_image_url}
              alt={`${title}, ${vehicle.exterior_color ?? "foto della vettura"}`}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:transform-none ${sold ? "opacity-60" : ""}`}
            />
          ) : (
            <div className="text-muted-foreground flex size-full items-center justify-center">
              <Car className="size-10" aria-hidden />
              <span className="sr-only">Foto non ancora disponibile</span>
            </div>
          )}
          {badges.length > 0 ? (
            <div className="absolute top-3 left-3 flex gap-1.5">
              {badges.map((badge) => (
                <Badge key={badge.label} variant={badge.variant}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-heading text-lg leading-snug font-semibold tracking-tight">
              {vehicle.make} {vehicle.model}
            </h3>
            {vehicle.version ? (
              <p className="text-muted-foreground truncate text-sm">
                {vehicle.version}
              </p>
            ) : null}
          </div>

          {specs.length > 0 ? (
            <p className="text-muted-foreground text-xs tracking-wide tabular-nums">
              {specs.join(" · ")}
            </p>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <div>
              {vehicle.previous_price !== null &&
              vehicle.price !== null &&
              vehicle.previous_price > vehicle.price ? (
                <p className="text-muted-foreground text-xs line-through tabular-nums">
                  {formatPrice(vehicle.previous_price)}
                </p>
              ) : null}
              <p className="font-heading text-xl font-bold tracking-tight tabular-nums">
                {formatPrice(vehicle.price, vehicle.price_on_request)}
              </p>
            </div>
            <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
              Scopri l&apos;auto
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
