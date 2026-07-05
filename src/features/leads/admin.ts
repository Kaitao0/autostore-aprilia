import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  LeadRow,
  LeadStatus,
  LeadType,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export const LEADS_PER_PAGE = 20;

export type LeadWithVehicle = LeadRow & {
  vehicle: { id: string; slug: string; make: string; model: string; version: string | null } | null;
};

export type AdminLeadFilters = {
  type?: LeadType;
  status?: LeadStatus;
  page: number;
};

export async function getAdminLeads(
  supabase: Client,
  filters: AdminLeadFilters,
): Promise<{ rows: LeadWithVehicle[]; count: number }> {
  let query = supabase
    .from("leads")
    .select("*, vehicle:vehicles(id, slug, make, model, version)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("lead_type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);

  const from = (filters.page - 1) * LEADS_PER_PAGE;
  const { data, count, error } = await query.range(
    from,
    from + LEADS_PER_PAGE - 1,
  );
  if (error) throw new Error(error.message);
  // Hand-written Database types carry no FK metadata: assert the join shape.
  return { rows: (data ?? []) as unknown as LeadWithVehicle[], count: count ?? 0 };
}

export async function getLeadById(
  supabase: Client,
  id: string,
): Promise<LeadWithVehicle | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*, vehicle:vehicles(id, slug, make, model, version)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as LeadWithVehicle | null;
}
