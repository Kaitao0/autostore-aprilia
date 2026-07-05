import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Impostazioni",
};

export default async function AdminSettingsPage() {
  const { supabase, isSuperAdmin } = await requireStaff();
  if (!isSuperAdmin) redirect("/admin");

  const { data: business } = await supabase
    .from("business_information")
    .select("legal_name, vat_number, pec, address, city, zip, province, phone, whatsapp, email")
    .eq("id", 1)
    .maybeSingle();

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Impostazioni
        </h1>
        <p className="text-muted-foreground text-sm">
          Dati aziendali centralizzati in business_information.
        </p>
      </div>

      {business ? (
        <Card>
          <CardHeader>
            <CardTitle>{business.legal_name}</CardTitle>
            <CardDescription>
              P.IVA {business.vat_number} · PEC {business.pec ?? "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">Indirizzo</dt>
                <dd>
                  {business.address}, {business.zip} {business.city} (
                  {business.province})
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">Email</dt>
                <dd>{business.email ?? "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">Telefono</dt>
                <dd>{business.phone ?? "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-xs">WhatsApp</dt>
                <dd>{business.whatsapp ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Settings />
          </EmptyMedia>
          <EmptyTitle>
            Modifica impostazioni in preparazione{" "}
            <Badge variant="secondary">Fase 2</Badge>
          </EmptyTitle>
          <EmptyDescription>
            La modifica di orari, social, contatti e sezioni editabili della
            home arriva nella Fase 2. I dati sopra provengono dal database e
            includono i placeholder [INSERIRE …] da completare.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
