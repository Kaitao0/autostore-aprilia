import Link from "next/link";
import { Phone } from "lucide-react";
import { getBusinessInformation, isPlaceholder } from "@/features/site/queries";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { WhatsAppLink } from "./whatsapp-link";

export const navItems = [
  { href: "/parco-auto", label: "Parco auto" },
  { href: "/vendi-permuta", label: "Vendi o permuta" },
  { href: "/servizi", label: "Servizi" },
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/contatti", label: "Contatti" },
];

export async function SiteHeader() {
  const business = await getBusinessInformation();
  const hasPhone = !isPlaceholder(business.phone);
  const hasWhatsApp = !isPlaceholder(business.whatsapp);

  return (
    <header className="border-border/60 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="focus-visible:ring-ring/50 rounded font-heading text-xl font-bold tracking-tight focus-visible:ring-3 focus-visible:outline-none"
          aria-label="Autostore — vai alla home"
        >
          {/* [INSERIRE LOGO]: wordmark used until the real logo is provided */}
          Autostore<span className="text-primary">.</span>
        </Link>

        <nav aria-label="Principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {hasWhatsApp ? (
            <WhatsAppLink
              number={business.whatsapp ?? ""}
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
            />
          ) : null}
          {hasPhone ? (
            <Button size="sm" className="hidden md:inline-flex" asChild>
              <a href={`tel:${business.phone?.replaceAll(" ", "")}`}>
                <Phone data-icon="inline-start" />
                {business.phone}
              </a>
            </Button>
          ) : (
            <Button size="sm" className="hidden md:inline-flex" asChild>
              <Link href="/contatti">Contattaci</Link>
            </Button>
          )}
          <MobileNav
            items={navItems}
            phone={hasPhone ? business.phone : null}
            whatsapp={hasWhatsApp ? business.whatsapp : null}
          />
        </div>
      </div>
    </header>
  );
}
