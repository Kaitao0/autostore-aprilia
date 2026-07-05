import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import {
  getFeaturedVehicles,
  getPublishedMakes,
} from "@/features/catalog/queries";
import {
  getBusinessInformation,
  getSiteContent,
} from "@/features/site/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleCard } from "@/components/site/vehicle-card";
import { QuickSearch } from "@/components/site/quick-search";

export default async function HomePage() {
  const [featured, makes, content, business] = await Promise.all([
    getFeaturedVehicles(6),
    getPublishedMakes(),
    getSiteContent(),
    getBusinessInformation(),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(249,115,22,0.08),transparent_60%)]"
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-20 pb-16 md:px-6 md:pt-28 md:pb-24">
          <div className="max-w-3xl">
            <p className="text-muted-foreground mb-5 flex items-center gap-3 text-xs font-semibold tracking-[0.18em] uppercase">
              <span aria-hidden className="bg-primary h-0.5 w-8" />
              Concessionario · Aprilia (LT)
            </p>
            <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tighter text-balance sm:text-5xl md:text-6xl">
              {content.hero.headline}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed text-pretty md:text-lg">
              {content.hero.subheadline}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/parco-auto">
                  {content.hero.cta_primary}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contatti">{content.hero.cta_secondary}</Link>
              </Button>
            </div>
          </div>

          {/* Quick search */}
          <Reveal>
            <QuickSearch makes={makes} />
          </Reveal>
        </div>
      </section>

      {/* ── Featured vehicles ────────────────────────────────── */}
      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="In evidenza"
                title="Le auto da vedere questa settimana"
              />
              <Button variant="ghost" asChild>
                <Link href="/parco-auto">
                  Tutto il parco auto
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((vehicle, index) => (
              <Reveal key={vehicle.id} delay={Math.min(index * 0.06, 0.24)}>
                <VehicleCard vehicle={vehicle} priority={index < 3} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Why us ───────────────────────────────────────────── */}
      {content.whyUs.items.length > 0 ? (
        <section className="border-border/60 border-y">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
            <Reveal>
              <SectionHeading
                eyebrow="Il metodo"
                title={content.whyUs.title}
                className="mb-10"
              />
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {content.whyUs.items.map((item, index) => (
                <Reveal key={item.title} delay={Math.min(index * 0.06, 0.24)}>
                  <Card className="h-full">
                    <CardContent className="flex h-full flex-col gap-2">
                      <h3 className="font-heading text-lg font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.text}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Services ─────────────────────────────────────────── */}
      {content.services.items.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Servizi"
              title={content.services.title}
              className="mb-10"
            />
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {content.services.items.map((item, index) => (
              <Reveal key={item.title} delay={Math.min(index * 0.06, 0.24)}>
                <div className="border-border/60 flex h-full flex-col gap-2 border-l pl-5">
                  <h3 className="font-heading text-lg font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Trade-in CTA ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6">
        <Reveal>
          <div className="bg-surface-1 relative overflow-hidden rounded-xl border px-6 py-12 md:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_100%_0%,rgba(249,115,22,0.1),transparent_55%)]"
            />
            <div className="relative max-w-2xl">
              <SectionHeading
                eyebrow="Permuta e ritiro"
                title="Vendi la tua auto ad Autostore"
                description="Raccontaci che auto hai: la valutiamo per un ritiro diretto o come permuta sul tuo prossimo acquisto."
              />
              <Button size="lg" className="mt-6" asChild>
                <Link href="/vendi-permuta">
                  Richiedi una valutazione
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Reviews (DEMO placeholders until real Google reviews) ── */}
      {content.reviews.items.length > 0 ? (
        <section className="border-border/60 border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
            <Reveal>
              <SectionHeading
                eyebrow="Recensioni"
                title={content.reviews.title}
                description="Sezione predisposta per le recensioni Google reali: le voci qui sotto sono segnaposto dimostrativi."
                className="mb-10"
              />
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2">
              {content.reviews.items.map((review, index) => (
                <Reveal key={review.author} delay={Math.min(index * 0.06, 0.24)}>
                  <figure className="bg-card flex h-full flex-col gap-3 rounded-xl border p-6">
                    <div
                      className="flex items-center gap-1"
                      role="img"
                      aria-label={`Valutazione ${review.rating} su 5`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          aria-hidden
                          className={`size-4 ${
                            i < review.rating
                              ? "text-primary fill-current"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                    <blockquote className="text-muted-foreground text-sm leading-relaxed">
                      {review.text}
                    </blockquote>
                    <figcaption className="mt-auto text-sm font-medium">
                      {review.author}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Where we are ─────────────────────────────────────── */}
      <section className="border-border/60 border-t">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Dove siamo"
              title="Vieni a trovarci ad Aprilia"
              description={`${business.address}, ${business.zip} ${business.city} (${business.province})`}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${business.legal_name} ${business.address} ${business.zip} ${business.city}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin data-icon="inline-start" />
                  Apri in Google Maps
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/contatti">Tutti i contatti</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-4 text-xs">
              La mappa interattiva verrà mostrata qui previo consenso ai cookie
              (in arrivo con il banner cookie).
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="bg-card h-full rounded-xl border p-6">
              <h3 className="font-heading mb-4 text-lg font-semibold tracking-tight">
                Orari di apertura
              </h3>
              <dl className="flex flex-col gap-2 text-sm">
                {business.hours.map((entry) => (
                  <div
                    key={entry.days}
                    className="border-border/60 flex items-baseline justify-between gap-4 border-b pb-2 last:border-b-0"
                  >
                    <dt className="text-muted-foreground">{entry.days}</dt>
                    <dd className="text-right font-medium">{entry.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
