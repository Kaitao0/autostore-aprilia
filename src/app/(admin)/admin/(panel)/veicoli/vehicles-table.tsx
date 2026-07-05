"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Car,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  bulkVehicleAction,
  deleteVehicleAction,
  duplicateVehicleAction,
  setAvailabilityAction,
  setFeaturedAction,
  setPublishedAction,
} from "@/features/vehicles/actions";
import { availabilityLabels, conditionLabels, enumOptions } from "@/lib/labels";
import { formatMileage, formatPrice } from "@/lib/format";
import type { AvailabilityStatus, VehicleRow } from "@/lib/types/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PendingDelete =
  | { kind: "single"; vehicle: VehicleRow }
  | { kind: "bulk"; ids: string[] }
  | null;

export function VehiclesTable({
  vehicles,
  hasActiveFilters,
}: {
  vehicles: VehicleRow[];
  hasActiveFilters: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const allSelected =
    vehicles.length > 0 && vehicles.every((v) => selected.has(v.id));

  const selectedIds = useMemo(() => [...selected], [selected]);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMessage);
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error ?? "Operazione non riuscita");
      }
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(vehicles.map((v) => v.id)) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (vehicles.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Car />
          </EmptyMedia>
          <EmptyTitle>
            {hasActiveFilters ? "Nessun risultato" : "Nessun veicolo in archivio"}
          </EmptyTitle>
          <EmptyDescription>
            {hasActiveFilters
              ? "Nessun veicolo corrisponde ai filtri selezionati. Prova ad allargare la ricerca."
              : "Aggiungi il primo veicolo per iniziare a costruire il catalogo."}
          </EmptyDescription>
        </EmptyHeader>
        {!hasActiveFilters ? (
          <EmptyContent>
            <Button asChild>
              <Link href="/admin/veicoli/nuovo">Nuovo veicolo</Link>
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  }

  return (
    <>
      {selectedIds.length > 0 ? (
        <div
          className="bg-surface-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          role="toolbar"
          aria-label="Azioni sui veicoli selezionati"
        >
          <p className="text-sm">
            {selectedIds.length} selezionat{selectedIds.length === 1 ? "o" : "i"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  const r = await bulkVehicleAction(selectedIds, "publish");
                  if (r.ok && r.data && r.data.skipped.length > 0) {
                    toast.warning(
                      `Non pubblicati (dati incompleti): ${r.data.skipped.join(", ")}`,
                    );
                  }
                  return r;
                }, "Veicoli pubblicati")
              }
            >
              Pubblica
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(
                  () => bulkVehicleAction(selectedIds, "unpublish"),
                  "Veicoli rimossi dal sito",
                )
              }
            >
              Rimuovi dal sito
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => setPendingDelete({ kind: "bulk", ids: selectedIds })}
            >
              <Trash2 data-icon="inline-start" />
              Elimina
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) => toggleAll(c === true)}
                  aria-label="Seleziona tutti i veicoli"
                />
              </TableHead>
              <TableHead>Veicolo</TableHead>
              <TableHead>Anno</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Prezzo</TableHead>
              <TableHead>Disponibilità</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Azioni</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id} data-state={selected.has(vehicle.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(vehicle.id)}
                    onCheckedChange={(c) => toggleOne(vehicle.id, c === true)}
                    aria-label={`Seleziona ${vehicle.make} ${vehicle.model}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-surface-2 relative hidden h-10 w-16 shrink-0 overflow-hidden rounded-md sm:block">
                      {vehicle.cover_image_url ? (
                        <Image
                          src={vehicle.cover_image_url}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground flex size-full items-center justify-center">
                          <Car className="size-4" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/veicoli/${vehicle.id}`}
                        className="focus-visible:ring-ring/50 rounded font-medium hover:underline focus-visible:ring-3 focus-visible:outline-none"
                      >
                        {vehicle.make} {vehicle.model}
                        {vehicle.featured ? (
                          <Star
                            className="text-primary ml-1.5 inline size-3.5 fill-current"
                            aria-label="In evidenza"
                          />
                        ) : null}
                      </Link>
                      <p className="text-muted-foreground truncate text-xs">
                        {vehicle.version ?? "—"} ·{" "}
                        {conditionLabels[vehicle.condition]}
                        {vehicle.is_demo ? " · DEMO" : ""}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {vehicle.year ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatMileage(vehicle.mileage)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatPrice(vehicle.price, vehicle.price_on_request)}
                </TableCell>
                <TableCell>
                  <AvailabilityBadge availability={vehicle.availability} />
                </TableCell>
                <TableCell>
                  {vehicle.published ? (
                    <Badge>Pubblicato</Badge>
                  ) : (
                    <Badge variant="secondary">Bozza</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Azioni per ${vehicle.make} ${vehicle.model}`}
                        disabled={isPending}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>
                          {vehicle.make} {vehicle.model}
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/veicoli/${vehicle.id}`}>
                            <Pencil />
                            Modifica
                          </Link>
                        </DropdownMenuItem>
                        {vehicle.published ? (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/auto/${vehicle.slug}`}
                              target="_blank"
                              rel="noopener"
                            >
                              <ExternalLink />
                              Anteprima sul sito
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onSelect={() =>
                            run(async () => {
                              const r = await duplicateVehicleAction(vehicle.id);
                              return r;
                            }, "Veicolo duplicato come bozza")
                          }
                        >
                          <Copy />
                          Duplica
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onSelect={() =>
                            run(
                              () =>
                                setPublishedAction(
                                  vehicle.id,
                                  !vehicle.published,
                                ),
                              vehicle.published
                                ? "Veicolo rimosso dal sito"
                                : "Veicolo pubblicato",
                            )
                          }
                        >
                          {vehicle.published
                            ? "Rimuovi dal sito"
                            : "Pubblica"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            run(
                              () =>
                                setFeaturedAction(vehicle.id, !vehicle.featured),
                              vehicle.featured
                                ? "Rimosso dalle auto in evidenza"
                                : "Aggiunto alle auto in evidenza",
                            )
                          }
                        >
                          {vehicle.featured ? <StarOff /> : <Star />}
                          {vehicle.featured
                            ? "Togli da in evidenza"
                            : "Metti in evidenza"}
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Cambia disponibilità
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={vehicle.availability}
                              onValueChange={(value) =>
                                run(
                                  () =>
                                    setAvailabilityAction(
                                      vehicle.id,
                                      value as AvailabilityStatus,
                                    ),
                                  "Disponibilità aggiornata",
                                )
                              }
                            >
                              {enumOptions(availabilityLabels).map((o) => (
                                <DropdownMenuRadioItem
                                  key={o.value}
                                  value={o.value}
                                >
                                  {o.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() =>
                            setPendingDelete({ kind: "single", vehicle })
                          }
                        >
                          <Trash2 />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.kind === "bulk"
                ? `Eliminare ${pendingDelete.ids.length} veicoli?`
                : pendingDelete
                  ? `Eliminare ${pendingDelete.vehicle.make} ${pendingDelete.vehicle.model}?`
                  : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;eliminazione è definitiva e rimuove anche le immagini
              associate. I veicoli eliminati spariscono subito dal sito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!pendingDelete) return;
                if (pendingDelete.kind === "single") {
                  run(
                    () => deleteVehicleAction(pendingDelete.vehicle.id),
                    "Veicolo eliminato",
                  );
                } else {
                  run(
                    () => bulkVehicleAction(pendingDelete.ids, "delete"),
                    "Veicoli eliminati",
                  );
                }
                setPendingDelete(null);
              }}
            >
              Elimina definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AvailabilityBadge({
  availability,
}: {
  availability: AvailabilityStatus;
}) {
  const variant =
    availability === "disponibile"
      ? ("default" as const)
      : availability === "venduto"
        ? ("destructive" as const)
        : ("secondary" as const);
  return <Badge variant={variant}>{availabilityLabels[availability]}</Badge>;
}
