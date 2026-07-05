"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { GalleryImage } from "@/features/catalog/queries";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Vehicle gallery: main image + thumbnail strip + fullscreen dialog
 * with keyboard-navigable prev/next.
 */
export function VehicleGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const current = images[Math.min(index, images.length - 1)];
  const many = images.length > 1;

  const go = (delta: number) =>
    setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface-2 group relative aspect-[16/10] overflow-hidden rounded-xl border">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt ?? `${title} — foto ${index + 1} di ${images.length}`}
          fill
          priority={index === 0}
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
        {many ? (
          <>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Foto precedente"
              className="absolute top-1/2 left-3 -translate-y-1/2 opacity-80 hover:opacity-100"
              onClick={() => go(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Foto successiva"
              className="absolute top-1/2 right-3 -translate-y-1/2 opacity-80 hover:opacity-100"
              onClick={() => go(1)}
            >
              <ChevronRight />
            </Button>
            <p className="bg-background/70 text-foreground absolute bottom-3 left-3 rounded-md px-2 py-1 text-xs tabular-nums backdrop-blur-sm">
              {index + 1} / {images.length}
            </p>
          </>
        ) : null}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Apri la foto a schermo intero"
              className="absolute top-3 right-3 opacity-80 hover:opacity-100"
            >
              <Expand />
            </Button>
          </DialogTrigger>
          <DialogContent
            showCloseButton
            className="h-[min(92dvh,900px)] w-[min(96vw,1400px)] max-w-none border-none bg-black/95 p-2 sm:p-4"
          >
            <DialogTitle className="sr-only">
              {title} — galleria a schermo intero
            </DialogTitle>
            <div className="relative h-full w-full">
              <Image
                key={`full-${current.id}`}
                src={current.url}
                alt={
                  current.alt ??
                  `${title} — foto ${index + 1} di ${images.length}`
                }
                fill
                sizes="96vw"
                className="object-contain"
              />
              {many ? (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Foto precedente"
                    className="absolute top-1/2 left-2 -translate-y-1/2"
                    onClick={() => go(-1)}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Foto successiva"
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                    onClick={() => go(1)}
                  >
                    <ChevronRight />
                  </Button>
                  <p className="bg-background/70 text-foreground absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 text-xs tabular-nums backdrop-blur-sm">
                    {index + 1} / {images.length}
                  </p>
                </>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {many ? (
        <ul
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Miniature della galleria"
        >
          {images.map((image, i) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                aria-label={`Mostra foto ${i + 1} di ${images.length}`}
                aria-current={i === index || undefined}
                onClick={() => setIndex(i)}
                className={cn(
                  "focus-visible:ring-ring/50 relative block h-16 w-24 overflow-hidden rounded-md border transition-opacity focus-visible:ring-3 focus-visible:outline-none",
                  i === index
                    ? "border-primary"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
