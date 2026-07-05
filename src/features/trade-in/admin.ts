import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  LeadStatus,
  TradeInRequestRow,
} from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export const TRADE_INS_PER_PAGE = 20;

export async function getAdminTradeIns(
  supabase: Client,
  filters: { status?: LeadStatus; page: number },
): Promise<{ rows: TradeInRequestRow[]; count: number }> {
  let query = supabase
    .from("trade_in_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);

  const from = (filters.page - 1) * TRADE_INS_PER_PAGE;
  const { data, count, error } = await query.range(
    from,
    from + TRADE_INS_PER_PAGE - 1,
  );
  if (error) throw new Error(error.message);
  return { rows: data ?? [], count: count ?? 0 };
}

export async function getTradeInById(
  supabase: Client,
  id: string,
): Promise<TradeInRequestRow | null> {
  const { data, error } = await supabase
    .from("trade_in_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Signed URLs for the PRIVATE bucket (1 hour). */
export async function getTradeInImageUrls(
  supabase: Client,
  tradeInId: string,
): Promise<Array<{ path: string; url: string }>> {
  const { data: rows, error } = await supabase
    .from("trade_in_images")
    .select("storage_path")
    .eq("trade_in_id", tradeInId)
    .order("created_at");
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  const { data: signed, error: signError } = await supabase.storage
    .from("trade-in-images")
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      3600,
    );
  if (signError || !signed) return [];
  return signed.flatMap((entry, i) =>
    entry.signedUrl
      ? [{ path: rows[i].storage_path, url: entry.signedUrl }]
      : [],
  );
}
