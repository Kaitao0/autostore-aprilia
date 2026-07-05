import type { MetadataRoute } from "next";
import { getAllPublishedForSitemap } from "@/features/catalog/queries";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/parco-auto`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${siteUrl}/vendi-permuta`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${siteUrl}/servizi`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/chi-siamo`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/contatti`, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${siteUrl}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/cookie-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Only published vehicles end up in the sitemap (public_vehicles view).
  const vehicles = await getAllPublishedForSitemap();

  return [
    ...staticRoutes,
    ...vehicles.map((vehicle) => ({
      url: `${siteUrl}/auto/${vehicle.slug}`,
      lastModified: new Date(vehicle.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
