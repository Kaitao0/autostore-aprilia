import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSiteContent } from "@/features/site/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Servizi",
  description:
    "I servizi di Autostore ad Aprilia (LT): vendita di auto usate, km 0 e aziendali, valutazione dell'usato e permuta.",
  alternates: { canonical: "/servizi" },
};

export default async function ServicesPage() {
  const content = await getSiteContent();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Servizi"
        title={content.services.title}
        description="Quello che facciamo, senza promesse vaghe: catalogo aggiornato in tempo reale e valutazione trasparente del tuo usato."
        className="mb-12"
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {content.services.items.map((item, index) => (
          <Reveal key={item.title} delay={Math.min(index * 0.06, 0.24)}>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col gap-3">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  {item.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.text}
                </p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <Link href="/parco-auto">
            Vai al parco auto
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/vendi-permuta">Vendi o permuta la tua auto</Link>
        </Button>
      </div>
    </div>
  );
}
