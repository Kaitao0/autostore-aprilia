"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getStaffOrNull, type StaffContext } from "@/features/auth/guards";
import type { ActionResult } from "./actions";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // after client-side compression
const ALLOWED_TYPES = ["image/webp", "image/jpeg", "image/png"];

function revalidateVehicle(vehicleId: string, slug?: string | null) {
  revalidatePath(`/admin/veicoli/${vehicleId}`);
  revalidatePath("/admin/veicoli");
  revalidatePath("/parco-auto");
  revalidatePath("/");
  if (slug) revalidatePath(`/auto/${slug}`);
}

async function vehicleSlugOf(
  staff: StaffContext,
  vehicleId: string,
): Promise<string | null> {
  const { data } = await staff.supabase
    .from("vehicles")
    .select("slug")
    .eq("id", vehicleId)
    .maybeSingle();
  return data?.slug ?? null;
}

/** Keeps vehicles.cover_image_url in sync with the is_cover image. */
async function syncCover(
  staff: StaffContext,
  vehicleId: string,
): Promise<void> {
  const { data: cover } = await staff.supabase
    .from("vehicle_images")
    .select("public_url")
    .eq("vehicle_id", vehicleId)
    .eq("is_cover", true)
    .maybeSingle();
  await staff.supabase
    .from("vehicles")
    .update({ cover_image_url: cover?.public_url ?? null })
    .eq("id", vehicleId);
}

export async function uploadVehicleImageAction(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Nessun file ricevuto" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `"${file.name}" supera i 6 MB dopo la compressione` };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: `Formato non supportato (${file.type})` };
  }
  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;

  try {
    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const path = `vehicles/${vehicleId}/optimized/${randomUUID()}.${ext}`;
    const { error: uploadError } = await staff.supabase.storage
      .from("vehicle-images")
      .upload(path, file, { contentType: file.type });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = staff.supabase.storage
      .from("vehicle-images")
      .getPublicUrl(path);

    // Append at the end; first image becomes the cover automatically.
    const { data: existing } = await staff.supabase
      .from("vehicle_images")
      .select("id, sort_order")
      .eq("vehicle_id", vehicleId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = existing && existing[0] ? existing[0].sort_order + 1 : 0;
    const isFirst = !existing || existing.length === 0;

    const { data: inserted, error: insertError } = await staff.supabase
      .from("vehicle_images")
      .insert({
        vehicle_id: vehicleId,
        storage_path: path,
        public_url: urlData.publicUrl,
        sort_order: nextOrder,
        is_cover: isFirst,
        width,
        height,
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    if (isFirst) await syncCover(staff, vehicleId);
    revalidateVehicle(vehicleId, await vehicleSlugOf(staff, vehicleId));
    return { ok: true, data: { id: inserted.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

export async function deleteVehicleImageAction(
  imageId: string,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  try {
    const { data: image, error } = await staff.supabase
      .from("vehicle_images")
      .select("id, vehicle_id, storage_path, is_cover")
      .eq("id", imageId)
      .single();
    if (error) throw new Error(error.message);

    await staff.supabase.storage
      .from("vehicle-images")
      .remove([image.storage_path]);
    const { error: deleteError } = await staff.supabase
      .from("vehicle_images")
      .delete()
      .eq("id", imageId);
    if (deleteError) throw new Error(deleteError.message);

    if (image.is_cover) {
      // Promote the first remaining image to cover, if any.
      const { data: next } = await staff.supabase
        .from("vehicle_images")
        .select("id")
        .eq("vehicle_id", image.vehicle_id)
        .order("sort_order")
        .limit(1);
      if (next && next[0]) {
        await staff.supabase
          .from("vehicle_images")
          .update({ is_cover: true })
          .eq("id", next[0].id);
      }
      await syncCover(staff, image.vehicle_id);
    }

    revalidateVehicle(image.vehicle_id, await vehicleSlugOf(staff, image.vehicle_id));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

export async function setCoverImageAction(
  imageId: string,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  try {
    const { data: image, error } = await staff.supabase
      .from("vehicle_images")
      .select("id, vehicle_id")
      .eq("id", imageId)
      .single();
    if (error) throw new Error(error.message);

    await staff.supabase
      .from("vehicle_images")
      .update({ is_cover: false })
      .eq("vehicle_id", image.vehicle_id);
    await staff.supabase
      .from("vehicle_images")
      .update({ is_cover: true })
      .eq("id", imageId);
    await syncCover(staff, image.vehicle_id);

    revalidateVehicle(image.vehicle_id, await vehicleSlugOf(staff, image.vehicle_id));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

export async function moveVehicleImageAction(
  imageId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  try {
    const { data: image, error } = await staff.supabase
      .from("vehicle_images")
      .select("id, vehicle_id, sort_order")
      .eq("id", imageId)
      .single();
    if (error) throw new Error(error.message);

    const neighborQuery = staff.supabase
      .from("vehicle_images")
      .select("id, sort_order")
      .eq("vehicle_id", image.vehicle_id)
      .limit(1);
    const { data: neighbors } =
      direction === "up"
        ? await neighborQuery
            .lt("sort_order", image.sort_order)
            .order("sort_order", { ascending: false })
        : await neighborQuery
            .gt("sort_order", image.sort_order)
            .order("sort_order", { ascending: true });

    const neighbor = neighbors?.[0];
    if (!neighbor) return { ok: true }; // already at the edge

    await staff.supabase
      .from("vehicle_images")
      .update({ sort_order: neighbor.sort_order })
      .eq("id", image.id);
    await staff.supabase
      .from("vehicle_images")
      .update({ sort_order: image.sort_order })
      .eq("id", neighbor.id);

    revalidateVehicle(image.vehicle_id, await vehicleSlugOf(staff, image.vehicle_id));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Errore imprevisto" };
  }
}

export async function updateImageAltAction(
  imageId: string,
  alt: string,
): Promise<ActionResult> {
  const staff = await getStaffOrNull();
  if (!staff) return { ok: false, error: "Sessione non valida o permessi insufficienti" };

  const { data, error } = await staff.supabase
    .from("vehicle_images")
    .update({ alt_text: alt.trim() === "" ? null : alt.trim().slice(0, 200) })
    .eq("id", imageId)
    .select("vehicle_id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateVehicle(data.vehicle_id);
  return { ok: true };
}
