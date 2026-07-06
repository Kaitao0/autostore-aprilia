import { NextResponse } from "next/server";
import { getShowroomVehicles } from "@/features/catalog/queries";

export const dynamic = "force-dynamic";

/** Polled by the kiosk display for near-real-time catalog refresh. */
export async function GET() {
  const vehicles = await getShowroomVehicles();
  return NextResponse.json(
    { vehicles, updated_at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
