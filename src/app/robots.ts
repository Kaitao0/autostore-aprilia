import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api/og must stay fetchable: social crawlers respect robots.txt
        // when retrieving og:image URLs.
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
