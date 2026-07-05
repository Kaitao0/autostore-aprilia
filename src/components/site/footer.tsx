import Link from "next/link";
import {
  getBusinessInformation,
  isPlaceholder,
} from "@/features/site/queries";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/site/social-icons";

const socialIcons: Record<string, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
};

export async function SiteFooter() {
  const business = await getBusinessInformation();
  const enabledSocial = business.social.filter(
    (s) => s.enabled && s.url && !isPlaceholder(s.url),
  );
  const year = new Date().getFullYear();

  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <p className="font-heading text-xl font-bold tracking-tight">
              Autostore<span className="text-primary">.</span>
            </p>
            <address className="text-muted-foreground text-sm leading-relaxed not-italic">
              {business.legal_name}
              <br />
              {business.address}
              <br />
              {business.zip} {business.city} ({business.province})
            </address>
            {enabledSocial.length > 0 ? (
              <ul className="flex items-center gap-2" aria-label="Social">
                {enabledSocial.map((social) => {
                  const Icon = socialIcons[social.platform];
                  if (!Icon) return null;
                  return (
                    <li key={social.platform}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Autostore su ${social.platform}`}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex size-11 items-center justify-center rounded-md transition-colors focus-visible:ring-3 focus-visible:outline-none"
                      >
                        <Icon className="size-5" aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <nav aria-label="Footer" className="text-sm">
            <p className="text-foreground mb-3 font-medium">Esplora</p>
            <ul className="flex flex-col gap-2">
              {[
                { href: "/parco-auto", label: "Parco auto" },
                { href: "/vendi-permuta", label: "Vendi o permuta" },
                { href: "/servizi", label: "Servizi" },
                { href: "/chi-siamo", label: "Chi siamo" },
                { href: "/contatti", label: "Contatti" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded transition-colors focus-visible:ring-3 focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-sm">
            <p className="text-foreground mb-3 font-medium">Contatti</p>
            <ul className="text-muted-foreground flex flex-col gap-2">
              <li>Tel: {business.phone}</li>
              <li>WhatsApp: {business.whatsapp}</li>
              <li>
                {business.email && !isPlaceholder(business.email) ? (
                  <a
                    href={`mailto:${business.email}`}
                    className="hover:text-foreground focus-visible:ring-ring/50 rounded transition-colors focus-visible:ring-3 focus-visible:outline-none"
                  >
                    {business.email}
                  </a>
                ) : (
                  business.email
                )}
              </li>
              <li>PEC: {business.pec}</li>
            </ul>
          </div>
        </div>

        <div className="border-border/60 text-muted-foreground mt-10 flex flex-col gap-3 border-t pt-6 text-xs leading-relaxed md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {business.legal_name} — P.IVA/CF {business.vat_number} ·
            REA {business.rea} · SDI {business.sdi}
          </p>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <li>
              <Link
                href="/privacy-policy"
                className="hover:text-foreground focus-visible:ring-ring/50 rounded transition-colors focus-visible:ring-3 focus-visible:outline-none"
              >
                Privacy policy
              </Link>
            </li>
            <li>
              <Link
                href="/cookie-policy"
                className="hover:text-foreground focus-visible:ring-ring/50 rounded transition-colors focus-visible:ring-3 focus-visible:outline-none"
              >
                Cookie policy
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="hover:text-foreground focus-visible:ring-ring/50 rounded transition-colors focus-visible:ring-3 focus-visible:outline-none"
              >
                Area riservata
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
