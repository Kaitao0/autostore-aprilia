import type { Metadata } from "next";
import { requireStaff } from "@/features/auth/guards";
import { VehicleForm } from "../vehicle-form";

export const metadata: Metadata = {
  title: "Nuovo veicolo",
};

export default async function NewVehiclePage() {
  await requireStaff();
  return <VehicleForm />;
}
