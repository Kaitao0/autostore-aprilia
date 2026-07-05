import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  getBusinessInformation,
  isPlaceholder,
} from "@/features/site/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/site/section-heading";
import { WhatsAppLink } from "@/components/site/whatsapp-link";

export const metadata: Metadata = {
  title: "Contatti",
  description:
    "Contatta Autostore ad Aprilia (LT): telefono, WhatsApp, email e indirizzo della sede in Via delle Palme angolo Via Ottaviano 8.",
  alternates: { canonical: "/contatti" },
};

export default async function ContactsPage() {
  const business = await getBusinessInformation();
  const hasPhone = !isPlaceholder(business.phone);
  const hasWhatsApp = !isPlaceholder(business.whatsapp);
  const hasEmail = !isPlaceholder(business.email);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Contatti"
        title="Parliamo della tua prossima auto"
        description="Chiamaci, scrivici o vieni direttamente in sede: siamo ad Aprilia, in provincia di Latina."
        className="mb-12"
      />

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardContent className="flex h-full flex-col gap-3">
            <Phone className="text-primary size-5" aria-hidden />
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Telefono e WhatsApp
            </h2>
            <p className="text-muted-foreground text-sm">
              Tel: {business.phone}
              <br />
              WhatsApp: {business.whatsapp}
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              {hasPhone ? (
                <Button size="sm" asChild>
                  <a href={`tel:${business.phone?.replaceAll(" ", "")}`}>
                    Chiama ora
                  </a>
                </Button>
              ) : null}
              {hasWhatsApp ? (
                <WhatsAppLink number={business.whatsapp ?? ""} size="sm" />
              ) : null}
              {!hasPhone && !hasWhatsApp ? (
                <p className="text-muted-foreground text-xs">
                  Numeri in attivazione: usa l&apos;email o vieni in sede.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col gap-3">
            <Mail className="text-primary size-5" aria-hidden />
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Email
            </h2>
            <p className="text-muted-foreground text-sm">
              {business.email}
              <br />
              PEC: {business.pec}
            </p>
            {hasEmail ? (
              <div className="mt-auto">
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${business.email}`}>Scrivici</a>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col gap-3">
            <MapPin className="text-primary size-5" aria-hidden />
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Sede
            </h2>
            <address className="text-muted-foreground text-sm not-italic">
              {business.address}
              <br />
              {business.zip} {business.city} ({business.province})
            </address>
            <div className="mt-auto">
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${business.legal_name} ${business.address} ${business.zip} ${business.city}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apri in Google Maps
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-heading mb-4 text-lg font-semibold tracking-tight">
            Orari di apertura
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            {business.hours.map((entry) => (
              <div
                key={entry.days}
                className="border-border/60 flex items-baseline justify-between gap-4 border-b pb-2 last:border-b-0"
              >
                <dt className="text-muted-foreground">{entry.days}</dt>
                <dd className="text-right font-medium">{entry.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-heading mb-4 text-lg font-semibold tracking-tight">
            Mappa
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            La mappa interattiva verrà mostrata qui previo consenso ai cookie
            (banner in arrivo nella Fase 3). Nel frattempo puoi aprire la
            posizione direttamente su Google Maps con il pulsante qui sopra.
          </p>
        </div>
      </div>
    </div>
  );
}
