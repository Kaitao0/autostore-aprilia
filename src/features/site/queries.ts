import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  BusinessHoursEntry,
  BusinessInformationRow,
  Json,
  SocialProfileEntry,
} from "@/lib/types/database";

/** "[INSERIRE ...]" placeholders are real content to display, but must
 *  never become interactive links (tel:, wa.me, mailto:). */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || value.trim().startsWith("[INSERIRE");
}

export type BusinessInformation = Omit<
  BusinessInformationRow,
  "hours" | "social"
> & {
  hours: BusinessHoursEntry[];
  social: SocialProfileEntry[];
};

/** Used when Supabase is not configured or unreachable: the site keeps
 *  working with the real registry data + explicit placeholders. */
const fallbackBusinessInformation: BusinessInformation = {
  id: 1,
  name: "Autostore",
  legal_name: "AUTOSTORE S.R.L.",
  vat_number: "03129320598",
  tax_code: "03129320598",
  rea: "LT-302800",
  sdi: "AGX0ABB",
  pec: "autostoresrlaprilia@pec.it",
  address: "Via delle Palme angolo Via Ottaviano 8",
  city: "Aprilia",
  zip: "04011",
  province: "LT",
  phone: "[INSERIRE TELEFONO]",
  whatsapp: "[INSERIRE NUMERO WHATSAPP]",
  email: "info@autostoreaprilia.com",
  hours: [
    { days: "Lunedì – Venerdì", hours: "[INSERIRE ORARI]" },
    { days: "Sabato", hours: "[INSERIRE ORARI]" },
    { days: "Domenica", hours: "[INSERIRE ORARI]" },
  ],
  social: [],
  map_lat: null,
  map_lng: null,
  logo_url: null,
  autoscout_dealer_url: null,
  created_at: "",
  updated_at: "",
};

function parseHours(value: Json): BusinessHoursEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      typeof entry.days === "string" &&
      typeof entry.hours === "string"
    ) {
      return [{ days: entry.days, hours: entry.hours }];
    }
    return [];
  });
}

function parseSocial(value: Json): SocialProfileEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      typeof entry.platform === "string" &&
      typeof entry.url === "string"
    ) {
      return [
        {
          platform: entry.platform,
          url: entry.url,
          enabled: entry.enabled === true,
        },
      ];
    }
    return [];
  });
}

export const getBusinessInformation = cache(
  async (): Promise<BusinessInformation> => {
    if (!isSupabaseConfigured()) return fallbackBusinessInformation;
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("business_information")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (!data) return fallbackBusinessInformation;
      return {
        ...data,
        hours: parseHours(data.hours),
        social: parseSocial(data.social),
      };
    } catch {
      return fallbackBusinessInformation;
    }
  },
);

export type HeroContent = {
  headline: string;
  subheadline: string;
  cta_primary: string;
  cta_secondary: string;
};

export type ContentItem = { title: string; text: string };

export type ReviewItem = { author: string; rating: number; text: string };

export type ReelItem = {
  platform: string;
  url: string;
  title: string;
  thumbnail_url: string | null;
};

const fallbackHero: HeroContent = {
  headline: "Auto usate selezionate, ad Aprilia.",
  subheadline:
    "Schede complete, foto reali e prezzi chiari per ogni vettura del parco. Vienile a vedere in sede o scrivici.",
  cta_primary: "Scopri il parco auto",
  cta_secondary: "Contattaci",
};

function parseItems(value: Json | undefined): ContentItem[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const items = (value as { items?: Json }).items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.title === "string" &&
      typeof item.text === "string"
    ) {
      return [{ title: item.title, text: item.text }];
    }
    return [];
  });
}

export type SiteContent = {
  hero: HeroContent;
  whyUs: { title: string; items: ContentItem[] };
  services: { title: string; items: ContentItem[] };
  reviews: { title: string; items: ReviewItem[] };
  reels: { title: string; items: ReelItem[] };
};

const fallbackContent: SiteContent = {
  hero: fallbackHero,
  whyUs: { title: "Perché Autostore", items: [] },
  services: { title: "I nostri servizi", items: [] },
  reviews: { title: "Dicono di noi", items: [] },
  reels: { title: "Dai nostri social", items: [] },
};

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!isSupabaseConfigured()) return fallbackContent;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("content_sections")
      .select("key, value")
      .eq("locale", "it")
      .in("key", ["hero", "why_us", "services", "reviews", "featured_reels"]);

    const byKey = new Map((data ?? []).map((row) => [row.key, row.value]));

    const heroValue = byKey.get("hero");
    const hero: HeroContent =
      heroValue && typeof heroValue === "object" && !Array.isArray(heroValue)
        ? {
            headline:
              typeof heroValue.headline === "string"
                ? heroValue.headline
                : fallbackHero.headline,
            subheadline:
              typeof heroValue.subheadline === "string"
                ? heroValue.subheadline
                : fallbackHero.subheadline,
            cta_primary:
              typeof heroValue.cta_primary === "string"
                ? heroValue.cta_primary
                : fallbackHero.cta_primary,
            cta_secondary:
              typeof heroValue.cta_secondary === "string"
                ? heroValue.cta_secondary
                : fallbackHero.cta_secondary,
          }
        : fallbackHero;

    const sectionTitle = (key: string, fallback: string): string => {
      const value = byKey.get(key);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const title = (value as { title?: Json }).title;
        if (typeof title === "string") return title;
      }
      return fallback;
    };

    const reviewsValue = byKey.get("reviews");
    const reviewItems: ReviewItem[] =
      reviewsValue &&
      typeof reviewsValue === "object" &&
      !Array.isArray(reviewsValue) &&
      Array.isArray((reviewsValue as { items?: Json }).items)
        ? ((reviewsValue as { items: Json[] }).items.flatMap((item) => {
            if (
              item &&
              typeof item === "object" &&
              !Array.isArray(item) &&
              typeof item.author === "string" &&
              typeof item.text === "string"
            ) {
              return [
                {
                  author: item.author,
                  text: item.text,
                  rating: typeof item.rating === "number" ? item.rating : 5,
                },
              ];
            }
            return [];
          }) as ReviewItem[])
        : [];

    const reelsValue = byKey.get("featured_reels");
    const reelItems: ReelItem[] =
      reelsValue &&
      typeof reelsValue === "object" &&
      !Array.isArray(reelsValue) &&
      Array.isArray((reelsValue as { items?: Json }).items)
        ? ((reelsValue as { items: Json[] }).items.flatMap((item) => {
            if (
              item &&
              typeof item === "object" &&
              !Array.isArray(item) &&
              typeof item.platform === "string" &&
              typeof item.url === "string" &&
              typeof item.title === "string"
            ) {
              return [
                {
                  platform: item.platform,
                  url: item.url,
                  title: item.title,
                  thumbnail_url:
                    typeof item.thumbnail_url === "string"
                      ? item.thumbnail_url
                      : null,
                },
              ];
            }
            return [];
          }) as ReelItem[])
        : [];

    return {
      hero,
      whyUs: {
        title: sectionTitle("why_us", fallbackContent.whyUs.title),
        items: parseItems(byKey.get("why_us")),
      },
      services: {
        title: sectionTitle("services", fallbackContent.services.title),
        items: parseItems(byKey.get("services")),
      },
      reviews: {
        title: sectionTitle("reviews", fallbackContent.reviews.title),
        items: reviewItems,
      },
      reels: {
        title: sectionTitle("featured_reels", fallbackContent.reels.title),
        items: reelItems,
      },
    };
  } catch {
    return fallbackContent;
  }
});
