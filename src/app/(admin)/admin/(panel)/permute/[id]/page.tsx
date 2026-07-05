import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import {
  getTradeInById,
  getTradeInImageUrls,
} from "@/features/trade-in/admin";
import {
  fuelTypeLabels,
  transmissionLabels,
} from "@/lib/labels";
import { formatDateTime, formatMileage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TradeInStatusForm } from "./trade-in-status-form";

export const metadata: Metadata = {
  title: "Dettaglio permuta",
};

export default async function TradeInDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const request = await getTradeInById(supabase, id);
  if (!request) notFound();

  const images = await getTradeInImageUrls(supabase, id);

  const carRows = [
    {
      label: "Auto",
      value: `${request.car_make} ${request.car_model} ${request.car_version ?? ""}`.trim(),
    },
    { label: "Anno", value: request.car_year ? String(request.car_year) : "—" },
    {
      label: "Chilometri",
      value:
        request.car_mileage !== null
          ? formatMileage(request.car_mileage)
          : "—",
    },
    {
      label: "Alimentazione",
      value: request.car_fuel_type
        ? fuelTypeLabels[request.car_fuel_type]
        : "—",
    },
    {
      label: "Cambio",
      value: request.car_transmission
        ? transmissionLabels[request.car_transmission]
        : "—",
    },
    { label: "Targa", value: request.plate ?? "—" },
    {
      label: "Finanziamento in corso",
      value: request.existing_finance ? "Sì" : "No",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
            <Link href="/admin/permute">
              <ArrowLeft data-icon="inline-start" />
              Tutte le permute
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {request.car_make} {request.car_model}
          </h1>
          <p className="text-muted-foreground text-sm">
            Proposta da {request.first_name} {request.last_name ?? ""} ·{" "}
            {formatDateTime(request.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {request.phone ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${request.phone.replaceAll(" ", "")}`}>
                  <Phone data-icon="inline-start" />
                  Chiama
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://wa.me/${request.phone.replace(/[^0-9]/g, "")}`}
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
            <a href={`mailto:${request.email}`}>
              <Mail data-icon="inline-start" />
              Email
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dati della vettura</CardTitle>
            <CardDescription>
              Contatto: {request.email}
              {request.phone ? ` · ${request.phone}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {carRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs uppercase">
                    {row.label}
                  </dt>
                  <dd className="font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            {request.message ? (
              <div className="mt-4">
                <p className="text-muted-foreground text-xs uppercase">Note</p>
                <p className="text-sm whitespace-pre-line">{request.message}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestione</CardTitle>
            <CardDescription>Stato della richiesta.</CardDescription>
          </CardHeader>
          <CardContent>
            <TradeInStatusForm requestId={request.id} status={request.status} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto del cliente ({images.length})</CardTitle>
          <CardDescription>
            Bucket privato: i link scadono dopo un&apos;ora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nessuna foto allegata alla richiesta.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => (
                <li key={image.path}>
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-visible:ring-ring/50 block overflow-hidden rounded-lg border focus-visible:ring-3 focus-visible:outline-none"
                  >
                    {/* Signed, short-lived URL: plain img avoids the
                        next/image cache treating it as a stable asset */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`Foto caricata dal cliente (${image.path.split("/").pop()})`}
                      className="bg-surface-2 aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
