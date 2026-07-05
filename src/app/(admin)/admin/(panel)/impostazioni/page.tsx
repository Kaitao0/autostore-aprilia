import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/features/auth/guards";
import { getBusinessInformation } from "@/features/site/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = {
  title: "Impostazioni",
};

export default async function AdminSettingsPage() {
  const { isSuperAdmin } = await requireStaff();
  if (!isSuperAdmin) redirect("/admin");

  const business = await getBusinessInformation();

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Impostazioni
        </h1>
        <p className="text-muted-foreground text-sm">
          Dati aziendali pubblici, centralizzati in business_information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{business.legal_name}</CardTitle>
          <CardDescription>
            P.IVA/CF {business.vat_number} · REA {business.rea} · SDI{" "}
            {business.sdi} · PEC {business.pec} — i dati societari sono fissi;
            per modificarli serve un intervento tecnico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessForm business={business} />
        </CardContent>
      </Card>
    </>
  );
}
