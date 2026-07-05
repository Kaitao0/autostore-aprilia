import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import { getLeadById } from "@/features/leads/admin";
import { leadTypeLabels } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeadDetailForm } from "./lead-detail-form";

export const metadata: Metadata = {
  title: "Dettaglio lead",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const lead = await getLeadById(supabase, id);
  if (!lead) notFound();

  const tradeInNote =
    lead.trade_in_info &&
    typeof lead.trade_in_info === "object" &&
    !Array.isArray(lead.trade_in_info) &&
    typeof lead.trade_in_info.note === "string"
      ? lead.trade_in_info.note
      : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
            <Link href="/admin/lead">
              <ArrowLeft data-icon="inline-start" />
              Tutti i lead
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {lead.first_name} {lead.last_name ?? ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            {leadTypeLabels[lead.lead_type]} · ricevuto il{" "}
            {formatDateTime(lead.created_at)}
            {lead.source_page ? ` · da ${lead.source_page}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lead.phone ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${lead.phone.replaceAll(" ", "")}`}>
                  <Phone data-icon="inline-start" />
                  Chiama
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle data-icon="inline-start" />
                  WhatsApp
                </a>
              </Button>
            </>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${lead.email}`}>
              <Mail data-icon="inline-start" />
              Email
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Richiesta</CardTitle>
            <CardDescription>
              {lead.preferred_channel
                ? `Preferisce essere ricontattato via ${lead.preferred_channel}`
                : "Nessuna preferenza di ricontatto indicata"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase">
                Contatti
              </p>
              <p>
                {lead.email}
                {lead.phone ? ` · ${lead.phone}` : ""}
              </p>
            </div>
            {lead.vehicle ? (
              <div>
                <p className="text-muted-foreground text-xs uppercase">
                  Veicolo di interesse
                </p>
                <p className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/veicoli/${lead.vehicle.id}`}
                    className="focus-visible:ring-ring/50 rounded font-medium hover:underline focus-visible:ring-3 focus-visible:outline-none"
                  >
                    {lead.vehicle.make} {lead.vehicle.model}{" "}
                    {lead.vehicle.version ?? ""}
                  </Link>
                  <Link
                    href={`/auto/${lead.vehicle.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded underline focus-visible:ring-3 focus-visible:outline-none"
                  >
                    scheda pubblica
                  </Link>
                </p>
              </div>
            ) : null}
            {tradeInNote ? (
              <div>
                <p className="text-muted-foreground text-xs uppercase">
                  Auto in permuta
                </p>
                <p>{tradeInNote}</p>
              </div>
            ) : null}
            <div>
              <p className="text-muted-foreground text-xs uppercase">
                Messaggio
              </p>
              <p className="whitespace-pre-line">
                {lead.message ?? "(nessun messaggio)"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestione</CardTitle>
            <CardDescription>
              Stato della richiesta e note interne (mai visibili al cliente).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadDetailForm
              leadId={lead.id}
              status={lead.status}
              internalNotes={lead.internal_notes ?? ""}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
