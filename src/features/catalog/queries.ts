import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  AvailabilityStatus,
  BodyType,
  FuelType,
  PublicVehicleRow,
  Transmission,
  VehicleCondition,
} from "@/lib/types/database";

export const CATALOG_PER_PAGE = 12;

export type CatalogSort =
  | "recenti"
  | "prezzo_asc"
  | "prezzo_desc"
  | "anno_desc"
  | "km_asc"
  | "featured";

export type CatalogFilters = {
  make?: string;
  model?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  kmMax?: number;
  fuel?: FuelType;
  gearbox?: Transmission;
  body?: BodyType;
  condition?: VehicleCondition;
  availability?: AvailabilityStatus;
  sort: CatalogSort;
  page: number;
};

export type CatalogResult = {
  vehicles: PublicVehicleRow[];
  count: number;
  error: boolean;
};

/** Public catalog query — ALWAYS through the public_vehicles view. */
export async function getCatalogVehicles(
  filters: CatalogFilters,
): Promise<CatalogResult> {
  if (!isSupabaseConfigured()) return { vehicles: [], count: 0, error: false };

  try {
    const supabase = await createClient();
    let query = supabase
      .from("public_vehicles")
      .select("*", { count: "exact" });

    if (filters.make) query = query.ilike("make", filters.make);
    if (filters.model) query = query.ilike("model", `%${filters.model}%`);
    if (filters.priceMin !== undefined)
      query = query.gte("price", filters.priceMin);
    if (filters.priceMax !== undefined)
      query = query.lte("price", filters.priceMax);
    if (filters.yearMin !== undefined)
      query = query.gte("year", filters.yearMin);
    if (filters.yearMax !== undefined)
      query = query.lte("year", filters.yearMax);
    if (filters.kmMax !== undefined)
      query = query.lte("mileage", filters.kmMax);
    if (filters.fuel) query = query.eq("fuel_type", filters.fuel);
    if (filters.gearbox) query = query.eq("transmission", filters.gearbox);
    if (filters.body) query = query.eq("body_type", filters.body);
    if (filters.condition) query = query.eq("condition", filters.condition);
    if (filters.availability)
      query = query.eq("availability", filters.availability);

    switch (filters.sort) {
      case "prezzo_asc":
        query = query.order("price", { ascending: true, nullsFirst: false });
        break;
      case "prezzo_desc":
        query = query.order("price", { ascending: false, nullsFirst: false });
        break;
      case "anno_desc":
        query = query.order("year", { ascending: false, nullsFirst: false });
        break;
      case "km_asc":
        query = query.order("mileage", { ascending: true, nullsFirst: false });
        break;
      case "featured":
        query = query
          .order("featured", { ascending: false })
          .order("sort_order", { ascending: false })
          .order("published_at", { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order("published_at", {
          ascending: false,
          nullsFirst: false,
        });
    }

    const from = (filters.page - 1) * CATALOG_PER_PAGE;
    const { data, count, error } = await query.range(
      from,
      from + CATALOG_PER_PAGE - 1,
    );
    if (error) throw new Error(error.message);
    return { vehicles: data ?? [], count: count ?? 0, error: false };
  } catch {
    return { vehicles: [], count: 0, error: true };
  }
}

export async function getFeaturedVehicles(
  limit = 6,
): Promise<PublicVehicleRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_vehicles")
      .select("*")
      .eq("featured", true)
      .order("sort_order", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export const getVehicleBySlug = cache(
  async (slug: string): Promise<PublicVehicleRow | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("public_vehicles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return data;
    } catch {
      return null;
    }
  },
);

/** Slug changed? Find where it points now (301 target). */
export async function getSlugRedirect(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data: redirect } = await supabase
      .from("slug_redirects")
      .select("vehicle_id")
      .eq("old_slug", slug)
      .maybeSingle();
    if (!redirect) return null;
    const { data: vehicle } = await supabase
      .from("public_vehicles")
      .select("slug")
      .eq("id", redirect.vehicle_id)
      .maybeSingle();
    return vehicle?.slug ?? null;
  } catch {
    return null;
  }
}

export async function getSimilarVehicles(
  vehicle: PublicVehicleRow,
  limit = 3,
): Promise<PublicVehicleRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    // Same body type first; fall back to same make.
    let query = supabase
      .from("public_vehicles")
      .select("*")
      .neq("id", vehicle.id)
      .eq("availability", "disponibile")
      .limit(limit);
    if (vehicle.body_type) {
      query = query.eq("body_type", vehicle.body_type);
    } else {
      query = query.ilike("make", vehicle.make);
    }
    const { data } = await query;
    if (data && data.length >= limit) return data;

    const found = data ?? [];
    const excludeIds = [vehicle.id, ...found.map((v) => v.id)];
    const { data: more } = await supabase
      .from("public_vehicles")
      .select("*")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .eq("availability", "disponibile")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit - found.length);
    return [...found, ...(more ?? [])];
  } catch {
    return [];
  }
}

export async function getPublishedMakes(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_vehicles")
      .select("make")
      .order("make");
    return [...new Set((data ?? []).map((row) => row.make))];
  } catch {
    return [];
  }
}

export async function getAllPublishedForSitemap(): Promise<
  Array<{ slug: string; updated_at: string }>
> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_vehicles")
      .select("slug, updated_at");
    return data ?? [];
  } catch {
    return [];
  }
}

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
