import { cn } from "@/lib/utils";

/**
 * Signature element: short orange dash + letterspaced eyebrow above a
 * tight Space Grotesk heading. Recurs identically across all pages.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <p className="text-muted-foreground flex items-center gap-3 text-xs font-semibold tracking-[0.18em] uppercase">
        <span aria-hidden className="bg-primary h-0.5 w-8" />
        {eyebrow}
      </p>
      <Heading className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
        {title}
      </Heading>
      {description ? (
        <p className="text-muted-foreground text-base leading-relaxed text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}
