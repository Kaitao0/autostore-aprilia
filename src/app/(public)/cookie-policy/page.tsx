import type { Metadata } from "next";
import { getBusinessInformation } from "@/features/site/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionHeading } from "@/components/site/section-heading";
import { TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie policy",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cookie-policy" },
};

export default async function CookiePolicyPage() {
  const business = await getBusinessInformation();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Documenti legali"
        title="Cookie policy"
        className="mb-8"
      />

      <Alert className="mb-8" role="status">
        <TriangleAlert />
        <AlertTitle>Testo in attesa di validazione legale</AlertTitle>
        <AlertDescription>
          Questa pagina è predisposta ma il contenuto deve essere fornito e
          validato dal cliente o dal suo consulente privacy prima del go-live.
          Il banner di gestione consensi arriva nella Fase 3.
        </AlertDescription>
      </Alert>

      <div className="text-muted-foreground flex flex-col gap-4 text-sm leading-relaxed">
        <p>
          Sito gestito da {business.legal_name} — P.IVA {business.vat_number}.
          Allo stato attuale il sito utilizza esclusivamente cookie tecnici
          necessari al funzionamento (es. sessione dell&apos;area riservata).
          Mappe, widget AutoScout24, embed social e analytics verranno
          attivati solo previo consenso.
        </p>
        <p>[INSERIRE TESTO LEGALE VALIDATO DAL CLIENTE/CONSULENTE]</p>
      </div>
    </div>
  );
}
