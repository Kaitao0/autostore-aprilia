import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import {
  getAdminVehicles,
  VEHICLES_PER_PAGE,
  type AdminVehicleFilters,
} from "@/features/vehicles/admin-queries";
import {
  availabilityLabels,
  conditionLabels,
  enumOptions,
} from "@/lib/labels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { CircleOff } from "lucide-react";
import { VehiclesTable } from "./vehicles-table";
import { PaginationNav } from "@/components/pagination-nav";
import { DeleteDemoButton } from "./delete-demo-button";

export const metadata: Metadata = {
  title: "Veicoli",
};

const sortOptions = [
  { value: "recenti", label: "Più recenti" },
  { value: "prezzo_asc", label: "Prezzo crescente" },
  { value: "prezzo_desc", label: "Prezzo decrescente" },
  { value: "anno_desc", label: "Anno (più recente)" },
  { value: "km_asc", label: "Km crescenti" },
] as const;

type SearchParams = {
  q?: string;
  condition?: string;
  availability?: string;
  published?: string;
  demo?: string;
  sort?: string;
  page?: string;
};

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { supabase } = await requireStaff();

  const filters: AdminVehicleFilters = {
    q: params.q?.trim() || undefined,
    condition: (Object.keys(conditionLabels) as Array<string>).includes(
      params.condition ?? "",
    )
      ? (params.condition as AdminVehicleFilters["condition"])
      : undefined,
    availability: (Object.keys(availabilityLabels) as Array<string>).includes(
      params.availability ?? "",
    )
      ? (params.availability as AdminVehicleFilters["availability"])
      : undefined,
    published:
      params.published === "true" || params.published === "false"
        ? params.published
        : undefined,
    sort: sortOptions.some((o) => o.value === params.sort)
      ? (params.sort as AdminVehicleFilters["sort"])
      : "recenti",
    page: Math.max(1, Number(params.page) || 1),
  };

  let rows: Awaited<ReturnType<typeof getAdminVehicles>>["rows"] = [];
  let count = 0;
  let queryError: string | null = null;
  let demoCount = 0;

  try {
    const result = await getAdminVehicles(supabase, filters);
    rows = result.rows;
    count = result.count;
    const { count: demo } = await supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("is_demo", true);
    demoCount = demo ?? 0;
  } catch (e) {
    queryError = e instanceof Error ? e.message : "Errore imprevisto";
  }

  const totalPages = Math.max(1, Math.ceil(count / VEHICLES_PER_PAGE));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Veicoli
          </h1>
          <p className="text-muted-foreground text-sm">
            {count} veicol{count === 1 ? "o" : "i"} in archivio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {demoCount > 0 ? <DeleteDemoButton demoCount={demoCount} /> : null}
          <Button asChild>
            <Link href="/admin/veicoli/nuovo">
              <Plus data-icon="inline-start" />
              Nuovo veicolo
            </Link>
          </Button>
        </div>
      </div>

      <form
        method="get"
        className="grid grid-cols-2 items-end gap-3 md:grid-cols-[1fr_auto_auto_auto_auto_auto]"
        aria-label="Filtri veicoli"
      >
        <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
          <Label htmlFor="q">Cerca</Label>
          <Input
            id="q"
            name="q"
            type="search"
            placeholder="Marca, modello, versione, codice…"
            defaultValue={params.q ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="condition">Condizione</Label>
          <NativeSelect
            id="condition"
            name="condition"
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
          <Label htmlFor="availability">Disponibilità</Label>
          <NativeSelect
            id="availability"
            name="availability"
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
          <Label htmlFor="published">Stato</Label>
          <NativeSelect
            id="published"
            name="published"
            defaultValue={filters.published ?? ""}
          >
            <NativeSelectOption value="">Tutti</NativeSelectOption>
            <NativeSelectOption value="true">Pubblicati</NativeSelectOption>
            <NativeSelectOption value="false">Bozze</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sort">Ordina</Label>
          <NativeSelect id="sort" name="sort" defaultValue={filters.sort}>
            {sortOptions.map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="secondary">
          <Search data-icon="inline-start" />
          Filtra
        </Button>
      </form>

      {queryError ? (
        <Alert variant="destructive" role="alert">
          <CircleOff />
          <AlertTitle>Impossibile caricare i veicoli</AlertTitle>
          <AlertDescription>{queryError}</AlertDescription>
        </Alert>
      ) : (
        <>
          <VehiclesTable
            vehicles={rows}
            hasActiveFilters={Boolean(
              filters.q ||
                filters.condition ||
                filters.availability ||
                filters.published,
            )}
          />
          {totalPages > 1 ? (
            <PaginationNav
              ariaLabel="Paginazione veicoli"
              page={filters.page}
              totalPages={totalPages}
              searchParams={params}
            />
          ) : null}
        </>
      )}
    </>
  );
}
