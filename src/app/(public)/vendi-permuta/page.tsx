import type { Metadata } from "next";
import { BadgeEuro, Camera, ClipboardList, Handshake, Mail } from "lucide-react";
import {
  getBusinessInformation,
  isPlaceholder,
} from "@/features/site/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Vendi o permuta la tua auto",
  description:
    "Vendi la tua auto ad Autostore (Aprilia, LT) o usala come permuta: valutazione trasparente a partire dai dati e dalle foto della vettura.",
  alternates: { canonical: "/vendi-permuta" },
};

const steps = [
  {
    icon: ClipboardList,
    title: "Raccontaci la tua auto",
    text: "Marca, modello, anno, chilometri e condizioni generali: bastano pochi dati per iniziare.",
  },
  {
    icon: Camera,
    title: "Mandaci qualche foto",
    text: "Esterni, interni e dettagli utili. Le foto ci permettono una prima valutazione più precisa.",
  },
  {
    icon: BadgeEuro,
    title: "Ricevi la valutazione",
    text: "Ti ricontattiamo con una proposta di ritiro diretto o di permuta sul tuo prossimo acquisto.",
  },
  {
    icon: Handshake,
    title: "Concludi in sede",
    text: "Verifica finale della vettura ad Aprilia e definizione dell'accordo, senza vincoli.",
  },
];

export default async function TradeInPage() {
  const business = await getBusinessInformation();
  const hasWhatsApp = !isPlaceholder(business.whatsapp);
  const hasEmail = !isPlaceholder(business.email);
  const mailSubject = "Valutazione usato / permuta";
  const mailBody =
    "Salve,\nvorrei una valutazione della mia auto.\n\nMarca:\nModello:\nAnno:\nChilometri:\nAlimentazione:\nNote (finanziamento in corso, danni, ecc.):";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Vendi o permuta"
        title="La tua auto vale una proposta chiara"
        description="Valutiamo la tua vettura per il ritiro diretto o come permuta. Nessun impegno: prima i numeri, poi decidi tu."
        className="mb-12"
      />

      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="h-full">
            <Reveal
              delay={Math.min(index * 0.06, 0.24)}
              className="h-full"
            >
              <div className="bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
                <step.icon className="text-primary size-5" aria-hidden />
                <h2 className="font-heading text-base font-semibold tracking-tight">
                  {index + 1}. {step.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mt-12 max-w-2xl">
        <Alert>
          <ClipboardList />
          <AlertTitle>Form di valutazione online in arrivo</AlertTitle>
          <AlertDescription>
            Nella Fase 2 potrai inviare dati e foto della tua auto
            direttamente da questa pagina, con caricamento sicuro. Nel
            frattempo puoi scriverci: rispondiamo con la stessa cura.
          </AlertDescription>
        </Alert>

        <div className="mt-6 flex flex-wrap gap-3">
          {hasEmail ? (
            <Button size="lg" asChild>
              <a
                href={`mailto:${business.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`}
              >
                <Mail data-icon="inline-start" />
                Richiedi la valutazione via email
              </a>
            </Button>
          ) : null}
          {hasWhatsApp ? (
            <WhatsAppLink
              number={business.whatsapp ?? ""}
              message="Salve, vorrei una valutazione della mia auto per vendita o permuta."
              label="Scrivici su WhatsApp"
              size="lg"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
