import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { ReelItem } from "@/features/site/queries";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/site/social-icons";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";

const icons: Record<string, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TiktokIcon,
  youtube: YoutubeIcon,
};

/**
 * Reel/social cards from content_sections.featured_reels.
 * Plain links in a new tab — no third-party embed scripts by default
 * (native embeds only behind cookie consent, Fase 3).
 */
export function SocialSection({
  title,
  items,
}: {
  title: string;
  items: ReelItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
        <Reveal>
          <SectionHeading eyebrow="Social" title={title} className="mb-10" />
        </Reveal>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = icons[item.platform.toLowerCase()];
            const optimizableThumb =
              item.thumbnail_url &&
              (item.thumbnail_url.startsWith("/") ||
                /^https:\/\/[a-z0-9-]+\.supabase\.co\//.test(
                  item.thumbnail_url,
                ));
            return (
              <li key={item.url}>
                <Reveal delay={Math.min(index * 0.06, 0.24)}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${item.title} — apri su ${item.platform} in una nuova scheda`}
                    className="group bg-card focus-visible:ring-ring/50 block overflow-hidden rounded-xl border transition-transform duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-1 focus-visible:ring-3 focus-visible:outline-none motion-reduce:transform-none"
                  >
                    <div className="bg-surface-2 relative aspect-[4/5]">
                      {optimizableThumb && item.thumbnail_url ? (
                        <Image
                          src={item.thumbnail_url}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover"
                        />
                      ) : Icon ? (
                        <div className="text-muted-foreground flex size-full items-center justify-center">
                          <Icon width={40} height={40} />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 p-3">
                      {Icon ? (
                        <Icon
                          width={16}
                          height={16}
                          className="text-primary shrink-0"
                        />
                      ) : null}
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <ExternalLink
                        className="text-muted-foreground ml-auto size-3.5 shrink-0"
                        aria-hidden
                      />
                    </div>
                  </a>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
