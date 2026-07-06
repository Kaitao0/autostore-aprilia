"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Car, Maximize, WifiOff } from "lucide-react";
import { formatMileage, formatPrice } from "@/lib/format";
import {
  availabilityLabels,
  fuelTypeLabels,
  transmissionLabels,
} from "@/lib/labels";
import { vehicleTitle } from "@/features/catalog/shared";
import type { PublicVehicleRow } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SLIDE_MS = 9_000;
const REFRESH_MS = 60_000;

export function DisplayRotator({
  initialVehicles,
  siteUrl,
  phone,
  whatsapp,
}: {
  initialVehicles: PublicVehicleRow[];
  siteUrl: string;
  phone: string | null;
  whatsapp: string | null;
}) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [index, setIndex] = useState(0);
  const [offline, setOffline] = useState(false);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Slideshow
  useEffect(() => {
    if (vehicles.length <= 1) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % vehicles.length),
      SLIDE_MS,
    );
    return () => clearInterval(t);
  }, [vehicles.length]);

  // Polling refresh; on failure keep the last state and show offline.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/showroom", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const body: { vehicles: PublicVehicleRow[] } = await res.json();
        if (Array.isArray(body.vehicles) && body.vehicles.length > 0) {
          setVehicles(body.vehicles);
          setIndex((i) => i % body.vehicles.length);
        }
        setOffline(false);
      } catch {
        setOffline(true);
      }
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  // Fullscreen support (user gesture required by browsers)
  useEffect(() => {
    setFullscreenAvailable(Boolean(document.documentElement.requestFullscreen));
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  }, []);

  const vehicle = vehicles[index % Math.max(vehicles.length, 1)];

  if (!vehicle) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <Car className="text-muted-foreground size-16" aria-hidden />
        <p className="font-heading text-3xl font-bold">
          Autostore<span className="text-primary">.</span>
        </p>
        <p className="text-muted-foreground max-w-md text-lg">
          Nessun veicolo abilitato per lo showroom. Attiva “Visibile in
          showroom” sui veicoli pubblicati dall&apos;area riservata.
        </p>
      </div>
    );
  }

  const title = vehicleTitle(vehicle);
  const url = `${siteUrl}/auto/${vehicle.slug}`;
  const specLine = [
    vehicle.year,
    vehicle.mileage !== null ? formatMileage(vehicle.mileage) : null,
    vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type] : null,
    vehicle.transmission ? transmissionLabels[vehicle.transmission] : null,
    vehicle.power_hp !== null ? `${vehicle.power_hp} CV` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden landscape:flex-row">
      {/* Photo */}
      <div className="bg-surface-2 relative min-h-[44dvh] flex-1 landscape:min-h-dvh">
        {vehicle.cover_image_url ? (
          <Image
            key={vehicle.id}
            src={vehicle.cover_image_url}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <Car className="size-24" aria-hidden />
          </div>
        )}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <p className="font-heading bg-background/80 rounded-lg px-4 py-2 text-2xl font-bold tracking-tight backdrop-blur-sm">
            Autostore<span className="text-primary">.</span>
          </p>
          {offline ? (
            <Badge variant="secondary" className="gap-1.5">
              <WifiOff className="size-3.5" />
              Offline — ultimo stato salvato
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Info panel */}
      <div className="flex w-full flex-col justify-between gap-6 p-8 landscape:max-w-[42%] landscape:p-12">
        <div>
          <Badge
            variant={
              vehicle.availability === "disponibile" ? "default" : "secondary"
            }
            className="mb-4 text-sm"
          >
            {availabilityLabels[vehicle.availability]}
          </Badge>
          <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-balance xl:text-5xl">
            {title}
          </h1>
          {specLine ? (
            <p className="text-muted-foreground mt-4 text-lg tabular-nums xl:text-xl">
              {specLine}
            </p>
          ) : null}
          <p className="font-heading text-primary mt-6 text-6xl font-bold tracking-tight tabular-nums xl:text-7xl">
            {formatPrice(vehicle.price, vehicle.price_on_request)}
          </p>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="text-muted-foreground text-lg">
            {phone ? <p>Tel: {phone}</p> : null}
            {whatsapp ? <p>WhatsApp: {whatsapp}</p> : null}
            <p className="mt-1 text-sm">Via delle Palme angolo Via Ottaviano 8 — Aprilia (LT)</p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="rounded-xl bg-white p-2.5">
              <QRCodeSVG value={url} size={120} aria-hidden />
            </div>
            <p className="text-muted-foreground text-xs">Scheda completa</p>
          </div>
        </div>

        {/* Progress dots */}
        {vehicles.length > 1 ? (
          <div
            className="flex flex-wrap gap-1.5"
            aria-label={`Veicolo ${index + 1} di ${vehicles.length}`}
          >
            {vehicles.map((v, i) => (
              <span
                key={v.id}
                aria-hidden
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "bg-primary w-6" : "bg-border w-1.5"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {fullscreenAvailable && !isFullscreen ? (
        <Button
          variant="secondary"
          size="lg"
          onClick={toggleFullscreen}
          className="absolute right-6 bottom-6"
        >
          <Maximize data-icon="inline-start" />
          Schermo intero
        </Button>
      ) : null}
    </div>
  );
}
