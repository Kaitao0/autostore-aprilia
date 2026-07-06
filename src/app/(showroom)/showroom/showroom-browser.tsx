"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Car, RotateCcw, X } from "lucide-react";
import { formatMileage, formatPrice, formatRegistration } from "@/lib/format";
import {
  availabilityLabels,
  fuelTypeLabels,
  transmissionLabels,
} from "@/lib/labels";
import { vehicleBadges, vehicleTitle } from "@/features/catalog/shared";
import type { PublicVehicleRow } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const IDLE_RESET_MS = 90_000;

export function ShowroomBrowser({
  vehicles,
  siteUrl,
  phone,
}: {
  vehicles: PublicVehicleRow[];
  siteUrl: string;
  phone: string | null;
}) {
  const [makeFilter, setMakeFilter] = useState<string | null>(null);
  const [fuelFilter, setFuelFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicVehicleRow | null>(null);

  const makes = useMemo(
    () => [...new Set(vehicles.map((v) => v.make))].sort(),
    [vehicles],
  );
  const fuels = useMemo(
    () =>
      [...new Set(vehicles.map((v) => v.fuel_type).filter(Boolean))] as string[],
    [vehicles],
  );

  const filtered = vehicles.filter(
    (v) =>
      (!makeFilter || v.make === makeFilter) &&
      (!fuelFilter || v.fuel_type === fuelFilter),
  );

  // Inactivity reset: back to the full grid after 90s without touches.
  const reset = useCallback(() => {
    setMakeFilter(null);
    setFuelFilter(null);
    setSelected(null);
  }, []);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const arm = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(reset, IDLE_RESET_MS);
    };
    arm();
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [reset]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Autostore<span className="text-primary">.</span>
          <span className="text-muted-foreground ml-3 text-lg font-normal">
            showroom
          </span>
        </h1>
        {(makeFilter || fuelFilter) && (
          <Button variant="outline" size="lg" onClick={reset}>
            <RotateCcw data-icon="inline-start" />
            Azzera filtri
          </Button>
        )}
      </header>

      {/* Big touch filters */}
      <div className="flex flex-col gap-3">
        <FilterRow
          label="Marca"
          options={makes}
          active={makeFilter}
          onSelect={setMakeFilter}
        />
        <FilterRow
          label="Alimentazione"
          options={fuels}
          format={(f) => fuelTypeLabels[f as keyof typeof fuelTypeLabels] ?? f}
          active={fuelFilter}
          onSelect={setFuelFilter}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <Car className="text-muted-foreground size-12" aria-hidden />
          <p className="font-heading text-2xl font-semibold">
            Nessuna auto con questi filtri
          </p>
          <Button size="lg" onClick={reset}>
            Mostra tutte le auto
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vehicle) => {
            const title = vehicleTitle(vehicle);
            return (
              <li key={vehicle.id}>
                <button
                  type="button"
                  onClick={() => setSelected(vehicle)}
                  className="bg-card focus-visible:ring-ring/50 block w-full overflow-hidden rounded-2xl border text-left transition-transform active:scale-[0.99] focus-visible:ring-3 focus-visible:outline-none"
                  aria-label={`${title}: apri dettaglio`}
                >
                  <div className="bg-surface-2 relative aspect-[16/10]">
                    {vehicle.cover_image_url ? (
                      <Image
                        src={vehicle.cover_image_url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex size-full items-center justify-center">
                        <Car className="size-12" aria-hidden />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {vehicleBadges(vehicle).map((b) => (
                        <Badge key={b.label} variant={b.variant}>
                          {b.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <h2 className="font-heading truncate text-xl font-semibold tracking-tight">
                        {vehicle.make} {vehicle.model}
                      </h2>
                      <p className="text-muted-foreground truncate text-sm">
                        {[
                          vehicle.year,
                          vehicle.mileage !== null
                            ? formatMileage(vehicle.mileage)
                            : null,
                          vehicle.fuel_type
                            ? fuelTypeLabels[vehicle.fuel_type]
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <p className="font-heading shrink-0 text-2xl font-bold tracking-tight tabular-nums">
                      {formatPrice(vehicle.price, vehicle.price_on_request)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Simplified detail */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="h-[min(94dvh,860px)] w-[min(96vw,1100px)] max-w-none overflow-y-auto p-0"
        >
          {selected ? (
            <ShowroomDetail
              vehicle={selected}
              siteUrl={siteUrl}
              phone={phone}
              onClose={() => setSelected(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function FilterRow({
  label,
  options,
  active,
  onSelect,
  format = (v) => v,
}: {
  label: string;
  options: string[];
  active: string | null;
  onSelect: (value: string | null) => void;
  format?: (value: string) => string;
}) {
  if (options.length < 2) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={`Filtro ${label}`}
    >
      <span className="text-muted-foreground w-32 shrink-0 text-sm font-semibold tracking-wide uppercase">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={active === null}
        className={chipClass(active === null)}
      >
        Tutte
      </button>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(active === option ? null : option)}
          aria-pressed={active === option}
          className={chipClass(active === option)}
        >
          {format(option)}
        </button>
      ))}
    </div>
  );
}

function chipClass(active: boolean): string {
  return cn(
    "focus-visible:ring-ring/50 min-h-12 rounded-full border px-5 text-base font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none",
    active
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-card hover:bg-accent",
  );
}

function ShowroomDetail({
  vehicle,
  siteUrl,
  phone,
  onClose,
}: {
  vehicle: PublicVehicleRow;
  siteUrl: string;
  phone: string | null;
  onClose: () => void;
}) {
  const title = vehicleTitle(vehicle);
  const url = `${siteUrl}/auto/${vehicle.slug}`;
  const specs = [
    {
      label: "Immatricolazione",
      value: formatRegistration(vehicle.year, vehicle.registration_month),
    },
    { label: "Km", value: formatMileage(vehicle.mileage) },
    {
      label: "Alimentazione",
      value: vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type] : "—",
    },
    {
      label: "Cambio",
      value: vehicle.transmission
        ? transmissionLabels[vehicle.transmission]
        : "—",
    },
    {
      label: "Potenza",
      value: vehicle.power_hp !== null ? `${vehicle.power_hp} CV` : "—",
    },
    {
      label: "Disponibilità",
      value: availabilityLabels[vehicle.availability],
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <div className="bg-surface-2 relative aspect-[16/9] w-full shrink-0">
        {vehicle.cover_image_url ? (
          <Image
            src={vehicle.cover_image_url}
            alt={title}
            fill
            sizes="96vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <Car className="size-16" aria-hidden />
          </div>
        )}
        <Button
          variant="secondary"
          size="icon-lg"
          aria-label="Chiudi dettaglio"
          onClick={onClose}
          className="absolute top-4 right-4 size-14"
        >
          <X />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:p-8">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance">
            {title}
          </h2>
          <p className="font-heading text-primary mt-2 text-4xl font-bold tracking-tight tabular-nums">
            {formatPrice(vehicle.price, vehicle.price_on_request)}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                  {spec.label}
                </dt>
                <dd className="text-lg font-medium tabular-nums">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
          {phone ? (
            <p className="text-muted-foreground mt-6 text-sm">
              Chiedi al nostro staff oppure chiama {phone}
            </p>
          ) : (
            <p className="text-muted-foreground mt-6 text-sm">
              Chiedi al nostro staff per un preventivo o un test drive
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={url} size={148} aria-hidden />
          </div>
          <p className="text-muted-foreground max-w-40 text-center text-xs">
            Inquadra per aprire la scheda completa sul tuo telefono
          </p>
        </div>
      </div>
    </div>
  );
}