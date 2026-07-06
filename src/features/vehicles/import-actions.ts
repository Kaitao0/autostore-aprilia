"use server";

import { revalidatePath } from "next/cache";
import { getStaffOrNull } from "@/features/auth/guards";
import { vehicleSlug, slugify } from "@/lib/slug";
import type { ActionResult } from "./actions";
import type { ImportRow } from "./import-utils";

export const MAX_IMPORT_ROWS = 300;

/** Dedup preview: which external_ids already exist in the catalog. */
export async function checkExistingExternalIdsAction(
  externalIds: string[],
): Promise<ActionResult<Record<string, { id: string; label: string }>>> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const ids = [...new Set(externalIds.filter(Boolean))].slice(0, MAX_IMPORT_ROWS);
  if (ids.length === 0) return { ok: true, data: {} };

  const { data, error } = await staff.supabase
    .from("vehicles")
    .select("id, external_id, make, model")
    .in("external_id", ids);
  if (error) return { ok: false, error: error.message };

  const map: Record<string, { id: string; label: string }> = {};
  for (const v of data ?? []) {
    if (v.external_id) {
      map[v.external_id] = { id: v.id, label: `${v.make} ${v.model}` };
    }
  }
  return { ok: true, data: map };
}

export type ImportRowResult = {
  index: number;
  action: "created" | "updated" | "skipped" | "error";
  error?: string;
};

/**
 * Executes the import. Every new vehicle lands as a DRAFT
 * (published=false, source='import'); existing external_ids are
 * updated or skipped according to existingMode.
 */
export async function importVehiclesAction(
  rows: Array<{ index: number; row: ImportRow }>,
  existingMode: "update" | "skip",
): Promise<ActionResult<{ results: ImportRowResult[] }>> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };
  if (rows.length === 0) return { ok: false, error: "Nessuna riga da importare" };
  if (rows.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: `Massimo ${MAX_IMPORT_ROWS} righe per import` };
  }

  // Existing map computed once for the whole batch.
  const externalIds = rows
    .map(({ row }) => row.external_id)
    .filter((v): v is string => Boolean(v));
  const existing = await checkExistingExternalIdsAction(externalIds);
  if (!existing.ok) return existing;
  const existingMap = existing.data ?? {};

  const results: ImportRowResult[] = [];
  const usedSlugs = new Set<string>();

  for (const { index, row } of rows) {
    try {
      if (!row.make || !row.model) {
        results.push({ index, action: "error", error: "marca o modello mancante" });
        continue;
      }

      const columns = {
        make: row.make,
        model: row.model,
        version: row.version,
        price: row.price,
        year: row.year,
        mileage: row.mileage,
        fuel_type: row.fuel_type,
        transmission: row.transmission,
        body_type: row.body_type,
        condition: row.condition ?? ("usato" as const),
        exterior_color: row.exterior_color,
        power_hp: row.power_hp,
        doors: row.doors,
        seats: row.seats,
        description: row.description,
        external_id: row.external_id,
        source: "import",
      };

      const existingVehicle = row.external_id
        ? existingMap[row.external_id]
        : undefined;

      if (existingVehicle) {
        if (existingMode === "skip") {
          results.push({ index, action: "skipped" });
          continue;
        }
        // Update: never touch published/slug/images of the existing card.
        const { error } = await staff.supabase
          .from("vehicles")
          .update(columns)
          .eq("id", existingVehicle.id);
        if (error) throw new Error(error.message);
        results.push({ index, action: "updated" });
        continue;
      }

      // Create as draft with a unique slug (also within this batch).
      const base =
        slugify(
          vehicleSlug({
            make: row.make,
            model: row.model,
            version: row.version,
            year: row.year,
          }),
        ) || "veicolo";
      let candidate = base;
      let n = 2;
      for (;;) {
        if (!usedSlugs.has(candidate)) {
          const { data: clash, error } = await staff.supabase
            .from("vehicles")
            .select("id")
            .eq("slug", candidate)
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (!clash) break;
        }
        candidate = `${base}-${n}`;
        n += 1;
      }
      usedSlugs.add(candidate);

      const { error } = await staff.supabase.from("vehicles").insert({
        ...columns,
        slug: candidate,
        published: false,
      });
      if (error) throw new Error(error.message);
      results.push({ index, action: "created" });
    } catch (e) {
      results.push({
        index,
        action: "error",
        error: e instanceof Error ? e.message : "errore imprevisto",
      });
    }
  }

  revalidatePath("/admin/veicoli");
  revalidatePath("/admin");
  return { ok: true, data: { results } };
}
