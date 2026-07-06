"use client";

import { useConsent } from "./consent-provider";
import { Button } from "@/components/ui/button";

/**
 * Renders external content only after consent. Until then: an explicit
 * placeholder with a one-click enable (persisted for the whole site).
 */
export function ConsentGate({
  children,
  serviceName,
  className,
}: {
  children: React.ReactNode;
  serviceName: string;
  className?: string;
}) {
  const { external, grantExternal, ready } = useConsent();

  if (!ready) return <div className={className} aria-hidden />;

  if (external !== "granted") {
    return (
      <div
        className={`bg-surface-1 flex flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center ${className ?? ""}`}
      >
        <p className="text-sm font-medium">
          Contenuto di {serviceName} disattivato
        </p>
        <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
          Caricando questo contenuto accetti che {serviceName} possa
          impostare cookie e ricevere dati sulla tua visita.
        </p>
        <Button size="sm" onClick={grantExternal}>
          Abilita i contenuti di {serviceName}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
