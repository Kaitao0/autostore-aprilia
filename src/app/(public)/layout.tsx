import { SiteHeader } from "@/components/site/header";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SiteFooter } from "@/components/site/footer";
import { getBusinessInformation } from "@/features/site/queries";
import { autoDealerJsonLd } from "@/lib/structured-data";

// Public pages read live catalog data on every request.
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const business = await getBusinessInformation();

  return (
    <ConsentProvider>
      <a
        href="#contenuto"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Salta al contenuto
      </a>
      <SiteHeader />
      <main id="contenuto" className="min-h-[60dvh]">
        {children}
      </main>
      <SiteFooter />
      <CookieBanner />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(autoDealerJsonLd(business)),
        }}
      />
    </ConsentProvider>
  );
}
