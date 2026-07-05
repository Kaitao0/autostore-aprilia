import type { Metadata } from "next";
import { getBusinessInformation } from "@/features/site/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionHeading } from "@/components/site/section-heading";
import { TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy policy",
  robots: { index: false, follow: true },
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPolicyPage() {
  const business = await getBusinessInformation();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Documenti legali"
        title="Privacy policy"
        className="mb-8"
      />

      <Alert className="mb-8" role="status">
        <TriangleAlert />
        <AlertTitle>Testo in attesa di validazione legale</AlertTitle>
        <AlertDescription>
          Questa pagina è predisposta ma il contenuto deve essere fornito e
          validato dal cliente o dal suo consulente privacy prima del go-live.
        </AlertDescription>
      </Alert>

      <div className="text-muted-foreground flex flex-col gap-4 text-sm leading-relaxed">
        <p>
          Titolare del trattamento: {business.legal_name}, {business.address},{" "}
          {business.zip} {business.city} ({business.province}) — P.IVA{" "}
          {business.vat_number} — PEC {business.pec}.
        </p>
        <p>[INSERIRE TESTO LEGALE VALIDATO DAL CLIENTE/CONSULENTE]</p>
      </div>
    </div>
  );
}
