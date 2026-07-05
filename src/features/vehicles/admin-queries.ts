import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AvailabilityStatus,
  Database,
  VehicleCondition,
  VehicleRow,
  VehicleStatusHistoryRow,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export const VEHICLES_PER_PAGE = 20;

export type AdminVehicleFilters = {
  q?: string;
  condition?: VehicleCondition;
  availability?: AvailabilityStatus;
  published?: "true" | "false";
  sort?: "recenti" | "prezzo_asc" | "prezzo_desc" | "anno_desc" | "km_asc";
  page: number;
};

export async function getAdminVehicles(
  supabase: Client,
  filters: AdminVehicleFilters,
): Promise<{ rows: VehicleRow[]; count: number }> {
  let query = supabase.from("vehicles").select("*", { count: "exact" });

  if (filters.q) {
    // Commas and parentheses are PostgREST or() syntax; % is a wildcard.
    const q = filters.q.replaceAll("%", "\\%").replace(/[(),]/g, " ");
    query = query.or(
      `make.ilike.%${q}%,model.ilike.%${q}%,version.ilike.%${q}%,slug.ilike.%${q}%,internal_code.ilike.%${q}%`,
    );
  }
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.availability)
    query = query.eq("availability", filters.availability);
  if (filters.published)
    query = query.eq("published", filters.published === "true");

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
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (filters.page - 1) * VEHICLES_PER_PAGE;
  const { data, count, error } = await query.range(
    from,
    from + VEHICLES_PER_PAGE - 1,
  );
  if (error) throw new Error(error.message);
  return { rows: data ?? [], count: count ?? 0 };
}

export async function getVehicleById(
  supabase: Client,
  id: string,
): Promise<VehicleRow | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getVehicleStatusHistory(
  supabase: Client,
  vehicleId: string,
): Promise<VehicleStatusHistoryRow[]> {
  const { data, error } = await supabase
    .from("vehicle_status_history")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type DashboardStats = {
  total: number;
  published: number;
  drafts: number;
  reserved: number;
  sold: number;
  featured: number;
  demo: number;
  newLeads: number;
  autoscoutStatus: string | null;
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
  }>;
};

export async function getDashboardStats(
  supabase: Client,
  isSuperAdmin: boolean,
): Promise<DashboardStats> {
  const baseCount = () =>
    supabase.from("vehicles").select("id", { count: "exact", head: true });

  const results = await Promise.all([
    baseCount(),
    baseCount().eq("published", true),
    baseCount().eq("published", false),
    baseCount().eq("availability", "riservato"),
    baseCount().eq("availability", "venduto"),
    baseCount().eq("featured", true).eq("published", true),
    baseCount().eq("is_demo", true),
  ]);
  for (const r of results) {
    if (r.error) throw new Error(r.error.message);
  }
  const [total, published, drafts, reserved, sold, featured, demo] =
    results.map((r) => r.count ?? 0);

  const { count: newLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "nuovo");

  let autoscoutStatus: string | null = null;
  if (isSuperAdmin) {
    const { data } = await supabase
      .from("autoscout_settings")
      .select("status")
      .eq("id", 1)
      .maybeSingle();
    autoscoutStatus = data?.status ?? null;
  }

  const { data: recentActivity } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  return {
    total,
    published,
    drafts,
    reserved,
    sold,
    featured,
    demo,
    newLeads: newLeads ?? 0,
    autoscoutStatus,
    recentActivity: recentActivity ?? [],
  };
}
