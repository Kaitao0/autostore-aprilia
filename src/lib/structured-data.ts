import type { BusinessInformation } from "@/features/site/queries";
import { isPlaceholder } from "@/features/site/queries";
import type { PublicVehicleRow } from "@/lib/types/database";
import { siteUrl } from "@/lib/env";

/** JSON-LD builders. Only real data goes in — placeholders are omitted. */

export function autoDealerJsonLd(business: BusinessInformation) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: business.legal_name,
    url: siteUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address ?? undefined,
      addressLocality: business.city ?? undefined,
      postalCode: business.zip ?? undefined,
      addressRegion: business.province ?? undefined,
      addressCountry: "IT",
    },
    vatID: business.vat_number,
    ...(business.email && !isPlaceholder(business.email)
      ? { email: business.email }
      : {}),
    ...(business.phone && !isPlaceholder(business.phone)
      ? { telephone: business.phone }
      : {}),
  };
}

export function vehicleJsonLd(vehicle: PublicVehicleRow, title: string) {
  const url = `${siteUrl}/auto/${vehicle.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: title,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    url,
    ...(vehicle.cover_image_url
      ? {
          image: vehicle.cover_image_url.startsWith("http")
            ? vehicle.cover_image_url
            : `${siteUrl}${vehicle.cover_image_url}`,
        }
      : {}),
    ...(vehicle.year
      ? { vehicleModelDate: String(vehicle.year), productionDate: String(vehicle.year) }
      : {}),
    ...(vehicle.mileage !== null
      ? {
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: vehicle.mileage,
            unitCode: "KMT",
          },
        }
      : {}),
    ...(vehicle.description ? { description: vehicle.description } : {}),
    ...(vehicle.price !== null && !vehicle.price_on_request
      ? {
          offers: {
            "@type": "Offer",
            price: vehicle.price,
            priceCurrency: vehicle.currency,
            availability:
              vehicle.availability === "disponibile"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition:
              vehicle.condition === "nuovo"
                ? "https://schema.org/NewCondition"
                : "https://schema.org/UsedCondition",
            url,
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}
