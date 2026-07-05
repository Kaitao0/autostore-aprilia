import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBusinessInformation } from "@/features/site/queries";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "Autostore S.r.l. è un concessionario di auto usate, km 0 e aziendali con sede ad Aprilia, in provincia di Latina.",
  alternates: { canonical: "/chi-siamo" },
};

export default async function AboutPage() {
  const business = await getBusinessInformation();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Chi siamo"
        title="Un concessionario di Aprilia, con le carte in regola"
        description="[INSERIRE STORIA E PRESENTAZIONE DELL'AZIENDA — questo testo è un segnaposto e va sostituito con la presentazione reale fornita dal cliente.]"
        className="mb-12"
      />

      <div className="grid gap-10 md:grid-cols-2">
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-heading mb-4 text-lg font-semibold tracking-tight">
            Dati societari
          </h2>
          <dl className="flex flex-col gap-3 text-sm">
            {[
              { label: "Ragione sociale", value: business.legal_name },
              { label: "P.IVA / CF", value: business.vat_number },
              { label: "REA", value: business.rea ?? "—" },
              { label: "Codice SDI", value: business.sdi ?? "—" },
              { label: "PEC", value: business.pec ?? "—" },
              {
                label: "Sede",
                value: `${business.address}, ${business.zip} ${business.city} (${business.province})`,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="border-border/60 flex flex-col gap-0.5 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                  {row.label}
                </dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Come lavoriamo
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ogni auto del parco è pubblicata con scheda completa: dati tecnici,
            dotazioni, foto e prezzo. Se un&apos;informazione non c&apos;è, non
            la inventiamo: puoi sempre chiedercela direttamente.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            [INSERIRE ULTERIORI INFORMAZIONI SUL TEAM, LA SEDE E I SERVIZI —
            segnaposto da sostituire con contenuto reale.]
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/parco-auto">
                Guarda il parco auto
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contatti">Contattaci</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
