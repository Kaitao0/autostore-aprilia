import { ExternalLink } from "lucide-react";
import { getAutoscoutPublicSettings } from "@/features/integrations/queries";
import {
  getBusinessInformation,
  isPlaceholder,
} from "@/features/site/queries";
import { Button } from "@/components/ui/button";
import { ConsentGate } from "@/components/consent/consent-gate";
import { AutoscoutEmbed } from "@/components/site/autoscout-embed";
import { SectionHeading } from "@/components/site/section-heading";

/**
 * "Anche su AutoScout24" — secondary channel. Renders nothing when
 * neither the embed snippet nor the dealer profile URL is configured
 * (the explicit not-configured state lives in /admin/integrazioni).
 */
export async function AutoscoutSection() {
  const [settings, business] = await Promise.all([
    getAutoscoutPublicSettings(),
    getBusinessInformation(),
  ]);

  const dealerUrl =
    business.autoscout_dealer_url &&
    !isPlaceholder(business.autoscout_dealer_url)
      ? business.autoscout_dealer_url
      : null;

  if (!settings.configured && !dealerUrl) return null;

  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Canali esterni"
            title="Anche su AutoScout24"
            description="Il nostro parco auto è pubblicato anche su AutoScout24. Il catalogo su questo sito resta sempre quello più aggiornato."
          />
          {dealerUrl ? (
            <Button variant="outline" asChild>
              <a href={dealerUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink data-icon="inline-start" />
                Profilo AutoScout24
              </a>
            </Button>
          ) : null}
        </div>

        {settings.configured && settings.snippet ? (
          <ConsentGate serviceName="AutoScout24" className="min-h-64">
            <AutoscoutEmbed snippet={settings.snippet} />
          </ConsentGate>
        ) : null}
      </div>
    </section>
  );
}
