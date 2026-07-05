"use server";

import { revalidatePath } from "next/cache";
import { getStaffOrNull } from "@/features/auth/guards";
import { vehicleSlug, slugify } from "@/lib/slug";
import type {
  AvailabilityStatus,
  Database,
  VehicleRow,
} from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  vehicleFormSchema,
  getPublishBlockers,
  type VehicleFormInput,
} from "./schema";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

type Client = SupabaseClient<Database>;

function revalidateVehiclePaths(slug?: string | null) {
  revalidatePath("/admin/veicoli");
  revalidatePath("/admin");
  revalidatePath("/parco-auto");
  revalidatePath("/");
  if (slug) revalidatePath(`/auto/${slug}`);
}

async function uniqueSlug(
  supabase: Client,
  base: string,
  excludeId?: string,
): Promise<string> {
  const clean = slugify(base) || "veicolo";
  let candidate = clean;
  for (let i = 2; i <= 50; i++) {
    let query = supabase.from("vehicles").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
    candidate = `${clean}-${i}`;
  }
  return `${clean}-${Date.now()}`;
}

function toVehicleColumns(values: VehicleFormInput) {
  const parsed = vehicleFormSchema.safeParse(values);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      error: `${first?.message ?? "Dati non validi"}`,
      data: null,
    } as const;
  }
  const { slug: _slug, ...columns } = parsed.data;
  return { error: null, data: { columns, slug: parsed.data.slug } } as const;
}

export async function createVehicleAction(
  values: VehicleFormInput,
): Promise<ActionResult<{ id: string }>> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const parsed = toVehicleColumns(values);
  if (parsed.error !== null) return { ok: false, error: parsed.error };

  const { columns, slug } = parsed.data;
  try {
    const finalSlug = await uniqueSlug(
      staff.supabase,
      slug ??
        vehicleSlug({
          make: columns.make,
          model: columns.model,
          version: columns.version,
          year: columns.year,
        }),
    );
    const { data, error } = await staff.supabase
      .from("vehicles")
      .insert({ ...columns, slug: finalSlug })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    revalidateVehiclePaths(data.slug);
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

export async function updateVehicleAction(
  id: string,
  values: VehicleFormInput,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const parsed = toVehicleColumns(values);
  if (parsed.error !== null) return { ok: false, error: parsed.error };

  const { columns, slug } = parsed.data;
  try {
    const finalSlug = slug
      ? await uniqueSlug(staff.supabase, slug, id)
      : undefined;
    const { data, error } = await staff.supabase
      .from("vehicles")
      .update({ ...columns, ...(finalSlug ? { slug: finalSlug } : {}) })
      .eq("id", id)
      .select("slug")
      .single();
    if (error) throw new Error(error.message);
    revalidateVehiclePaths(data.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

export async function deleteVehicleAction(id: string): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  try {
    // Remove storage files first so no orphans are left behind.
    await deleteVehicleStorage(id);
    const { error } = await staff.supabase
      .from("vehicles")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    revalidateVehiclePaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

async function deleteVehicleStorage(vehicleId: string): Promise<void> {
  // Storage cleanup needs the service role (folder listing + delete).
  // In Fase 1 no images are uploaded yet; skip silently if not configured.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const prefixes = ["originals", "optimized", "thumbnails"];
  for (const prefix of prefixes) {
    const path = `vehicles/${vehicleId}/${prefix}`;
    const { data: files } = await admin.storage
      .from("vehicle-images")
      .list(path, { limit: 1000 });
    if (files && files.length > 0) {
      await admin.storage
        .from("vehicle-images")
        .remove(files.map((f) => `${path}/${f.name}`));
    }
  }
}

export async function duplicateVehicleAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  try {
    const { data: original, error } = await staff.supabase
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);

    const {
      id: _id,
      created_at: _c,
      updated_at: _u,
      published_at: _p,
      sold_at: _s,
      external_id: _e,
      ...copy
    } = original as VehicleRow;

    const slug = await uniqueSlug(staff.supabase, `${copy.slug}-copia`);
    const { data: inserted, error: insertError } = await staff.supabase
      .from("vehicles")
      .insert({
        ...copy,
        slug,
        published: false,
        featured: false,
        internal_code: copy.internal_code ? `${copy.internal_code}-copia` : null,
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);
    revalidateVehiclePaths();
    return { ok: true, data: { id: inserted.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

export async function setPublishedAction(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  try {
    if (published) {
      const { data: vehicle, error } = await staff.supabase
        .from("vehicles")
        .select(
          "make, model, price, price_on_request, year, mileage, fuel_type, cover_image_url, description",
        )
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      const blockers = getPublishBlockers(vehicle);
      if (blockers.length > 0) {
        return {
          ok: false,
          error: `Impossibile pubblicare: ${blockers.join(", ")}.`,
        };
      }
    }
    const { data, error } = await staff.supabase
      .from("vehicles")
      .update({ published })
      .eq("id", id)
      .select("slug")
      .single();
    if (error) throw new Error(error.message);
    revalidateVehiclePaths(data.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

export async function setFeaturedAction(
  id: string,
  featured: boolean,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const { data, error } = await staff.supabase
    .from("vehicles")
    .update({ featured })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateVehiclePaths(data.slug);
  return { ok: true };
}

export async function setAvailabilityAction(
  id: string,
  availability: AvailabilityStatus,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const { data, error } = await staff.supabase
    .from("vehicles")
    .update({ availability })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateVehiclePaths(data.slug);
  return { ok: true };
}

export async function bulkVehicleAction(
  ids: string[],
  action: "publish" | "unpublish" | "delete",
): Promise<ActionResult<{ done: number; skipped: string[] }>> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };
  if (ids.length === 0) return { ok: false, error: "Nessun veicolo selezionato" };

  try {
    if (action === "delete") {
      for (const id of ids) {
        await deleteVehicleStorage(id);
      }
      const { error } = await staff.supabase
        .from("vehicles")
        .delete()
        .in("id", ids);
      if (error) throw new Error(error.message);
      revalidateVehiclePaths();
      return { ok: true, data: { done: ids.length, skipped: [] } };
    }

    if (action === "unpublish") {
      const { error } = await staff.supabase
        .from("vehicles")
        .update({ published: false })
        .in("id", ids);
      if (error) throw new Error(error.message);
      revalidateVehiclePaths();
      return { ok: true, data: { done: ids.length, skipped: [] } };
    }

    // publish: enforce blocking validation per vehicle
    const { data: rows, error } = await staff.supabase
      .from("vehicles")
      .select(
        "id, make, model, price, price_on_request, year, mileage, fuel_type, cover_image_url, description",
      )
      .in("id", ids);
    if (error) throw new Error(error.message);

    const publishable = (rows ?? []).filter(
      (v) => getPublishBlockers(v).length === 0,
    );
    const skipped = (rows ?? [])
      .filter((v) => getPublishBlockers(v).length > 0)
      .map((v) => `${v.make} ${v.model}`);

    if (publishable.length > 0) {
      const { error: updateError } = await staff.supabase
        .from("vehicles")
        .update({ published: true })
        .in(
          "id",
          publishable.map((v) => v.id),
        );
      if (updateError) throw new Error(updateError.message);
    }
    revalidateVehiclePaths();
    return { ok: true, data: { done: publishable.length, skipped } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

/** One-click removal of every demo vehicle (is_demo=true). */
export async function deleteDemoDataAction(): Promise<
  ActionResult<{ done: number }>
> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  try {
    const { data: demoRows, error } = await staff.supabase
      .from("vehicles")
      .select("id")
      .eq("is_demo", true);
    if (error) throw new Error(error.message);
    const ids = (demoRows ?? []).map((r) => r.id);
    if (ids.length === 0) return { ok: true, data: { done: 0 } };

    for (const id of ids) {
      await deleteVehicleStorage(id);
    }
    const { error: deleteError } = await staff.supabase
      .from("vehicles")
      .delete()
      .in("id", ids);
    if (deleteError) throw new Error(deleteError.message);
    revalidateVehiclePaths();
    return { ok: true, data: { done: ids.length } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}
