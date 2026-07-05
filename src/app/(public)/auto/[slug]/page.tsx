import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { Car, Check, ExternalLink, Mail, Phone } from "lucide-react";
import {
  getSimilarVehicles,
  getSlugRedirect,
  getVehicleBySlug,
  vehicleBadges,
  vehicleTitle,
} from "@/features/catalog/queries";
import {
  getBusinessInformation,
  isPlaceholder,
} from "@/features/site/queries";
import {
  availabilityLabels,
  bodyTypeLabels,
  conditionLabels,
  drivetrainLabels,
  fuelTypeLabels,
  transmissionLabels,
} from "@/lib/labels";
import {
  formatDate,
  formatMileage,
  formatNumber,
  formatPrice,
  formatRegistration,
} from "@/lib/format";
import { breadcrumbJsonLd, vehicleJsonLd } from "@/lib/structured-data";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LeadForm } from "@/components/site/lead-form";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleCard } from "@/components/site/vehicle-card";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { siteUrl } from "@/lib/env";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: "Auto non trovata" };

  const title = vehicleTitle(vehicle);
  const conditionLabel = conditionLabels[vehicle.condition].toLowerCase();
  const pageTitle = `${title} ${vehicle.year ?? ""} ${conditionLabel} ad Aprilia`
    .replace(/\s+/g, " ")
    .trim();
  const description = [
    `${title} ${conditionLabel} in vendita da Autostore ad Aprilia (LT).`,
    vehicle.year ? `Anno ${vehicle.year}.` : null,
    vehicle.mileage !== null ? `${formatMileage(vehicle.mileage)}.` : null,
    vehicle.fuel_type ? `${fuelTypeLabels[vehicle.fuel_type]}.` : null,
    vehicle.price !== null && !vehicle.price_on_request
      ? `Prezzo ${formatPrice(vehicle.price)}.`
      : "Prezzo su richiesta.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/auto/${vehicle.slug}` },
    openGraph: {
      title: pageTitle,
      description,
      type: "website",
      url: `${siteUrl}/auto/${vehicle.slug}`,
      images: [{ url: `/api/og/${vehicle.slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [`/api/og/${vehicle.slug}`],
    },
  };
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);

  if (!vehicle) {
    const redirectTarget = await getSlugRedirect(slug);
    if (redirectTarget) permanentRedirect(`/auto/${redirectTarget}`);
    notFound();
  }

  const [similar, business] = await Promise.all([
    getSimilarVehicles(vehicle),
    getBusinessInformation(),
  ]);

  const title = vehicleTitle(vehicle);
  const badges = vehicleBadges(vehicle);
  const hasPhone = !isPlaceholder(business.phone);
  const hasWhatsApp = !isPlaceholder(business.whatsapp);
  const vehicleUrl = `${siteUrl}/auto/${vehicle.slug}`;
  const whatsappMessage = `Salve, vorrei informazioni su ${title} (${vehicleUrl})`;

  const specs: Array<{ label: string; value: string }> = [
    {
      label: "Immatricolazione",
      value: formatRegistration(vehicle.year, vehicle.registration_month),
    },
    { label: "Chilometri", value: formatMileage(vehicle.mileage) },
    {
      label: "Alimentazione",
      value: vehicle.fuel_type ? fuelTypeLabels[vehicle.fuel_type] : "—",
    },
    {
      label: "Cambio",
      value: vehicle.transmission
        ? transmissionLabels[vehicle.transmission]
        : "—",
    },
    {
      label: "Potenza",
      value:
        vehicle.power_hp !== null
          ? `${vehicle.power_hp} CV${vehicle.power_kw !== null ? ` (${vehicle.power_kw} kW)` : ""}`
          : "—",
    },
    {
      label: "Cilindrata",
      value:
        vehicle.engine_displacement !== null
          ? `${formatNumber(vehicle.engine_displacement)} cc`
          : "—",
    },
    {
      label: "Carrozzeria",
      value: vehicle.body_type ? bodyTypeLabels[vehicle.body_type] : "—",
    },
    { label: "Condizione", value: conditionLabels[vehicle.condition] },
    {
      label: "Trazione",
      value: vehicle.drivetrain ? drivetrainLabels[vehicle.drivetrain] : "—",
    },
    { label: "Porte", value: vehicle.doors !== null ? String(vehicle.doors) : "—" },
    { label: "Posti", value: vehicle.seats !== null ? String(vehicle.seats) : "—" },
    { label: "Classe emissioni", value: vehicle.emission_class ?? "—" },
    { label: "Colore esterno", value: vehicle.exterior_color ?? "—" },
    { label: "Interni", value: vehicle.interior_color ?? "—" },
    {
      label: "Proprietari precedenti",
      value:
        vehicle.previous_owners !== null
          ? String(vehicle.previous_owners)
          : "—",
    },
    {
      label: "IVA esposta",
      value:
        vehicle.vat_deductible === null
          ? "—"
          : vehicle.vat_deductible
            ? "Sì"
            : "No",
    },
  ];

  const hasDiscount =
    vehicle.previous_price !== null &&
    vehicle.price !== null &&
    vehicle.previous_price > vehicle.price;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-12">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/parco-auto">Parco auto</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* ── Left column: media + details ─────────────────── */}
        <div className="flex min-w-0 flex-col gap-10">
          <figure className="bg-surface-2 relative aspect-[16/10] overflow-hidden rounded-xl border">
            {vehicle.cover_image_url ? (
              <Image
                src={vehicle.cover_image_url}
                alt={`${title}${vehicle.exterior_color ? `, ${vehicle.exterior_color}` : ""}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2">
                <Car className="size-12" aria-hidden />
                <p className="text-sm">Foto in arrivo</p>
              </div>
            )}
            {badges.length > 0 ? (
              <div className="absolute top-4 left-4 flex gap-2">
                {badges.map((badge) => (
                  <Badge key={badge.label} variant={badge.variant}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </figure>

          <section>
            <SectionHeading
              eyebrow="Scheda tecnica"
              title="Dati del veicolo"
              className="mb-6"
            />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {specs.map((spec) => (
                <div key={spec.label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                    {spec.label}
                  </dt>
                  <dd className="text-sm font-medium tabular-nums">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {vehicle.description ? (
            <section>
              <SectionHeading
                eyebrow="Descrizione"
                title="La vettura"
                className="mb-4"
              />
              <p className="text-muted-foreground max-w-prose text-base leading-relaxed whitespace-pre-line">
                {vehicle.description}
              </p>
            </section>
          ) : null}

          {vehicle.equipment.length > 0 ? (
            <section>
              <SectionHeading
                eyebrow="Dotazioni"
                title="Equipaggiamento"
                className="mb-6"
              />
              <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {vehicle.equipment.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check
                      className="text-primary mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {vehicle.warranty && !isPlaceholder(vehicle.warranty) ? (
            <p className="text-muted-foreground text-sm">
              Garanzia: {vehicle.warranty}
            </p>
          ) : null}
        </div>

        {/* ── Right column: price + CTAs (sticky on desktop) ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card flex flex-col gap-5 rounded-xl border p-6">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-balance">
                {title}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {[
                  vehicle.year,
                  vehicle.mileage !== null
                    ? formatMileage(vehicle.mileage)
                    : null,
                  vehicle.location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div>
              {hasDiscount ? (
                <p className="text-muted-foreground text-sm line-through tabular-nums">
                  {formatPrice(vehicle.previous_price)}
                </p>
              ) : null}
              <p className="font-heading text-4xl font-bold tracking-tight tabular-nums">
                {formatPrice(vehicle.price, vehicle.price_on_request)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {availabilityLabels[vehicle.availability]}
                {vehicle.vat_deductible ? " · IVA esposta" : ""}
              </p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              {hasPhone ? (
                <Button size="lg" asChild>
                  <a href={`tel:${business.phone?.replaceAll(" ", "")}`}>
                    <Phone data-icon="inline-start" />
                    Chiama {business.phone}
                  </a>
                </Button>
              ) : null}
              {hasWhatsApp ? (
                <WhatsAppLink
                  number={business.whatsapp ?? ""}
                  message={whatsappMessage}
                  label="Scrivici su WhatsApp"
                  variant={hasPhone ? "outline" : "default"}
                  size="lg"
                />
              ) : null}
              <Button
                variant={hasPhone || hasWhatsApp ? "outline" : "default"}
                size="lg"
                asChild
              >
                <a href="#richiesta">
                  <Mail data-icon="inline-start" />
                  Richiedi informazioni
                </a>
              </Button>
              {!hasPhone && !hasWhatsApp ? (
                <p className="text-muted-foreground text-xs">
                  Telefono e WhatsApp saranno attivi appena configurati. Nel
                  frattempo scrivici via email o vieni in sede.
                </p>
              ) : null}
              {vehicle.autoscout_url ? (
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={vehicle.autoscout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink data-icon="inline-start" />
                    Vedi su AutoScout24
                  </a>
                </Button>
              ) : null}
            </div>

            <p className="text-muted-foreground text-xs">
              Ultimo aggiornamento: {formatDate(vehicle.updated_at)}
            </p>
          </div>
        </aside>
      </div>

      {/* ── Lead form ────────────────────────────────────────── */}
      <section id="richiesta" className="mt-16 scroll-mt-24">
        <div className="bg-surface-1 rounded-xl border p-6 md:p-10">
          <SectionHeading
            eyebrow="Ti interessa questa auto?"
            title="Richiedi informazioni, una visita o un test drive"
            description={`Compila il modulo: ti ricontattiamo per ${title}. In alternativa chiamaci o scrivici sui canali qui sopra.`}
            className="mb-8"
          />
          <LeadForm
            vehicleId={vehicle.id}
            sourcePage={`/auto/${vehicle.slug}`}
          />
        </div>
      </section>

      {/* ── Similar vehicles ─────────────────────────────────── */}
      {similar.length > 0 ? (
        <section className="mt-16">
          <SectionHeading
            eyebrow="Potrebbero interessarti"
            title="Auto simili nel parco"
            className="mb-8"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Mobile fixed CTA bar (max 3 actions) ─────────────── */}
      <div className="border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {hasPhone ? (
            <Button className="h-12 flex-1" asChild>
              <a href={`tel:${business.phone?.replaceAll(" ", "")}`}>
                <Phone data-icon="inline-start" />
                Chiama
              </a>
            </Button>
          ) : null}
          {hasWhatsApp ? (
            <WhatsAppLink
              number={business.whatsapp ?? ""}
              message={whatsappMessage}
              label="WhatsApp"
              variant={hasPhone ? "outline" : "default"}
              size="default"
              className="h-12 flex-1"
            />
          ) : null}
          <Button
            variant={hasPhone || hasWhatsApp ? "outline" : "default"}
            className="h-12 flex-1"
            asChild
          >
            <a href="#richiesta">
              <Mail data-icon="inline-start" />
              Scrivici
            </a>
          </Button>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(vehicleJsonLd(vehicle, title)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Parco auto", path: "/parco-auto" },
              { name: title, path: `/auto/${vehicle.slug}` },
            ]),
          ),
        }}
      />
    </div>
  );
}
