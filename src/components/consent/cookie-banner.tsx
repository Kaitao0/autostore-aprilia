"use client";

import Link from "next/link";
import { useConsent } from "./consent-provider";
import { Button } from "@/components/ui/button";

/**
 * Minimal two-choice banner: technical cookies are always on (stated),
 * the choice covers external content only. Reappears via the footer
 * "Preferenze cookie" trigger.
 */
export function CookieBanner() {
  const { external, grantExternal, denyExternal, ready } = useConsent();

  if (!ready || external !== "unknown") return null;

  return (
    <section
      role="region"
      aria-label="Preferenze cookie"
      className="border-border/60 bg-surface-1/95 fixed inset-x-0 bottom-0 z-50 border-t p-4 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Questo sito usa solo cookie tecnici necessari. Contenuti esterni
          come la mappa di Google e il widget AutoScout24 vengono caricati
          soltanto con il tuo consenso.{" "}
          <Link
            href="/cookie-policy"
            className="hover:text-foreground underline"
          >
            Cookie policy
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" onClick={denyExternal}>
            Solo necessari
          </Button>
          <Button onClick={grantExternal}>Accetta contenuti esterni</Button>
        </div>
      </div>
    </section>
  );
}

/** Footer trigger to change the stored choice. */
export function CookiePreferencesButton() {
  const { reset } = useConsent();
  return (
    <button
      type="button"
      onClick={reset}
      className="hover:text-foreground focus-visible:ring-ring/50 rounded transition-colors focus-visible:ring-3 focus-visible:outline-none"
    >
      Preferenze cookie
    </button>
  );
}
