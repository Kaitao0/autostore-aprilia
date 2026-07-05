import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/features/auth/guards";
import {
  getVehicleById,
  getVehicleStatusHistory,
} from "@/features/vehicles/admin-queries";
import { VehicleForm } from "../vehicle-form";

export const metadata: Metadata = {
  title: "Modifica veicolo",
};

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireStaff();

  const vehicle = await getVehicleById(supabase, id);
  if (!vehicle) notFound();

  const history = await getVehicleStatusHistory(supabase, id);
  const { data: images } = await supabase
    .from("vehicle_images")
    .select("*")
    .eq("vehicle_id", id)
    .order("sort_order");

  return (
    <VehicleForm vehicle={vehicle} history={history} images={images ?? []} />
  );
}
