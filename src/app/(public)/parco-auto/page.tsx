import type { Metadata } from "next";
import { CircleOff, Search, SearchX } from "lucide-react";
import {
  CATALOG_PER_PAGE,
  getCatalogVehicles,
  getPublishedMakes,
  type CatalogFilters,
  type CatalogSort,
} from "@/features/catalog/queries";
import {
  availabilityLabels,
  bodyTypeLabels,
  conditionLabels,
  enumOptions,
  fuelTypeLabels,
  transmissionLabels,
} from "@/lib/labels";
import type {
  AvailabilityStatus,
  BodyType,
  FuelType,
  Transmission,
  VehicleCondition,
} from "@/lib/types/database";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { PaginationNav } from "@/components/pagination-nav";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleCard } from "@/components/site/vehicle-card";

export const metadata: Metadata = {
  title: "Parco auto — usato selezionato ad Aprilia",
  description:
    "Sfoglia il parco auto di Autostore ad Aprilia (LT): auto usate, km 0 e aziendali con schede complete, foto e prezzi chiari. Filtra per marca, prezzo, alimentazione e altro.",
  alternates: { canonical: "/parco-auto" },
};

const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "recenti", label: "Più recenti" },
  { value: "featured", label: "In evidenza" },
  { value: "prezzo_asc", label: "Prezzo crescente" },
  { value: "prezzo_desc", label: "Prezzo decrescente" },
  { value: "anno_desc", label: "Anno più recente" },
  { value: "km_asc", label: "Km crescenti" },
];

type SearchParams = Record<string, string | string[] | undefined>;

function str(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function num(params: SearchParams, key: string): number | undefined {
  const value = str(params, key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function enumParam<T extends string>(
  params: SearchParams,
  key: string,
  labels: Record<T, string>,
): T | undefined {
  const value = str(params, key);
  return value && Object.keys(labels).includes(value)
    ? (value as T)
    : undefined;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const sortParam = str(params, "ordina");
  const filters: CatalogFilters = {
    make: str(params, "marca"),
    model: str(params, "modello"),
    priceMin: num(params, "prezzo_min"),
    priceMax: num(params, "prezzo_max"),
    yearMin: num(params, "anno_min"),
    yearMax: num(params, "anno_max"),
    kmMax: num(params, "km_max"),
    fuel: enumParam<FuelType>(params, "alimentazione", fuelTypeLabels),
    gearbox: enumParam<Transmission>(params, "cambio", transmissionLabels),
    body: enumParam<BodyType>(params, "carrozzeria", bodyTypeLabels),
    condition: enumParam<VehicleCondition>(
      params,
      "condizione",
      conditionLabels,
    ),
    availability: enumParam<AvailabilityStatus>(
      params,
      "disponibilita",
      availabilityLabels,
    ),
    sort: sortOptions.some((o) => o.value === sortParam)
      ? (sortParam as CatalogSort)
      : "recenti",
    page: Math.max(1, num(params, "pagina") ?? 1),
  };

  const hasActiveFilters = Boolean(
    filters.make ||
      filters.model ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined ||
      filters.yearMin !== undefined ||
      filters.yearMax !== undefined ||
      filters.kmMax !== undefined ||
      filters.fuel ||
      filters.gearbox ||
      filters.body ||
      filters.condition ||
      filters.availability,
  );

  const [result, makes] = await Promise.all([
    getCatalogVehicles(filters),
    getPublishedMakes(),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.count / CATALOG_PER_PAGE));

  const flatParams: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [
      k,
      typeof v === "string" ? v : undefined,
    ]),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Parco auto"
        title="Auto usate, km 0 e aziendali ad Aprilia"
        description="Ogni vettura ha una scheda completa con dati tecnici, dotazioni e foto. I filtri si riflettono nell'indirizzo della pagina: puoi condividere la ricerca con un link."
        className="mb-10"
      />

      <form
        method="get"
        aria-label="Filtri di ricerca"
        className="bg-surface-1/60 mb-8 grid grid-cols-2 items-end gap-3 rounded-xl border p-4 md:grid-cols-4 lg:grid-cols-6"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-make">Marca</Label>
          <NativeSelect
            id="f-make"
            name="marca"
            defaultValue={filters.make ?? ""}
          >
            <NativeSelectOption value="">Tutte</NativeSelectOption>
            {makes.map((make) => (
              <NativeSelectOption key={make} value={make}>
                {make}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-model">Modello</Label>
          <Input
            id="f-model"
            name="modello"
            placeholder="Es. Golf"
            defaultValue={filters.model ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-price-min">Prezzo da (€)</Label>
          <Input
            id="f-price-min"
            name="prezzo_min"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            defaultValue={filters.priceMin ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-price-max">Prezzo fino a (€)</Label>
          <Input
            id="f-price-max"
            name="prezzo_max"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            defaultValue={filters.priceMax ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-year-min">Anno da</Label>
          <Input
            id="f-year-min"
            name="anno_min"
            type="number"
            inputMode="numeric"
            min={1990}
            max={2100}
            defaultValue={filters.yearMin ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-km-max">Km fino a</Label>
          <Input
            id="f-km-max"
            name="km_max"
            type="number"
            inputMode="numeric"
            min={0}
            step={10000}
            defaultValue={filters.kmMax ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-fuel">Alimentazione</Label>
          <NativeSelect
            id="f-fuel"
            name="alimentazione"
            defaultValue={filters.fuel ?? ""}
          >
            <NativeSelectOption value="">Tutte</NativeSelectOption>
            {enumOptions(fuelTypeLabels).map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-gearbox">Cambio</Label>
          <NativeSelect
            id="f-gearbox"
            name="cambio"
            defaultValue={filters.gearbox ?? ""}
          >
            <NativeSelectOption value="">Tutti</NativeSelectOption>
            {enumOptions(transmissionLabels).map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-body">Carrozzeria</Label>
          <NativeSelect
            id="f-body"
            name="carrozzeria"
            defaultValue={filters.body ?? ""}
          >
            <NativeSelectOption value="">Tutte</NativeSelectOption>
            {enumOptions(bodyTypeLabels).map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-condition">Condizione</Label>
          <NativeSelect
            id="f-condition"
            name="condizione"
            defaultValue={filters.condition ?? ""}
          >
            <NativeSelectOption value="">Tutte</NativeSelectOption>
            {enumOptions(conditionLabels).map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-availability">Disponibilità</Label>
          <NativeSelect
            id="f-availability"
            name="disponibilita"
            defaultValue={filters.availability ?? ""}
          >
            <NativeSelectOption value="">Tutte</NativeSelectOption>
            {enumOptions(availabilityLabels).map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-sort">Ordina per</Label>
          <NativeSelect id="f-sort" name="ordina" defaultValue={filters.sort}>
            {sortOptions.map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="col-span-2 flex gap-2 md:col-span-4 lg:col-span-6">
          <Button type="submit">
            <Search data-icon="inline-start" />
            Applica filtri
          </Button>
          {hasActiveFilters ? (
            <Button variant="ghost" asChild>
              <a href="/parco-auto">Azzera filtri</a>
            </Button>
          ) : null}
        </div>
      </form>

      <p className="text-muted-foreground mb-6 text-sm" aria-live="polite">
        {result.count} risultat{result.count === 1 ? "o" : "i"}
        {hasActiveFilters ? " con i filtri attivi" : ""}
      </p>

      {result.error ? (
        <Alert variant="destructive" role="alert">
          <CircleOff />
          <AlertTitle>Catalogo momentaneamente non disponibile</AlertTitle>
          <AlertDescription>
            Si è verificato un problema nel caricamento del parco auto.
            Riprova tra qualche istante oppure contattaci direttamente.
          </AlertDescription>
        </Alert>
      ) : result.vehicles.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>
              {hasActiveFilters
                ? "Nessuna auto corrisponde alla ricerca"
                : "Il catalogo si sta riempiendo"}
            </EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? "Prova ad allargare i filtri: ad esempio aumenta il budget o togli un criterio."
                : "Stiamo caricando le prime vetture. Torna a trovarci a breve oppure raccontaci che auto cerchi."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {hasActiveFilters ? (
              <Button variant="outline" asChild>
                <a href="/parco-auto">Azzera i filtri</a>
              </Button>
            ) : (
              <Button asChild>
                <a href="/contatti">Contattaci</a>
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.vehicles.map((vehicle, index) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                priority={index < 3}
              />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="mt-10">
              <PaginationNav
                ariaLabel="Paginazione parco auto"
                page={filters.page}
                totalPages={totalPages}
                pageParam="pagina"
                searchParams={flatParams}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
