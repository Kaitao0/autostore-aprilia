"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteVehicleImageAction,
  moveVehicleImageAction,
  setCoverImageAction,
  updateImageAltAction,
  uploadVehicleImageAction,
} from "@/features/vehicles/images-actions";
import type { VehicleImageRow } from "@/lib/types/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 20 * 1024 * 1024; // before compression
const MAX_DIMENSION = 1920;
const QUALITY = 0.82;

/** Canvas-based client-side compression → WebP, max 1920px. */
async function compressImage(
  file: File,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas non disponibile in questo browser");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY),
  );
  if (!blob) throw new Error("Compressione immagine non riuscita");
  return { blob, width, height };
}

type UploadProgress = { total: number; done: number; currentName: string };

export function VehicleImagesManager({
  vehicleId,
  images,
}: {
  vehicleId: string;
  images: VehicleImageRow[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<VehicleImageRow | null>(
    null,
  );

  const busy = progress !== null || isPending;

  async function handleFiles(fileList: FileList | File[]) {
    const files = [...fileList].filter((f) => f.size > 0);
    if (files.length === 0) return;

    const invalid = files.find(
      (f) => !ACCEPTED.includes(f.type) || f.size > MAX_SOURCE_BYTES,
    );
    if (invalid) {
      toast.error(
        !ACCEPTED.includes(invalid.type)
          ? `"${invalid.name}": usa JPG, PNG o WEBP`
          : `"${invalid.name}" supera i 20 MB`,
      );
      return;
    }

    setProgress({ total: files.length, done: 0, currentName: files[0].name });
    let failed = 0;
    for (const [index, file] of files.entries()) {
      setProgress({ total: files.length, done: index, currentName: file.name });
      try {
        const { blob, width, height } = await compressImage(file);
        const formData = new FormData();
        formData.set(
          "file",
          new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
          }),
        );
        formData.set("width", String(width));
        formData.set("height", String(height));
        const result = await uploadVehicleImageAction(vehicleId, formData);
        if (!result.ok) {
          failed += 1;
          toast.error(`"${file.name}": ${result.error}`);
        }
      } catch (e) {
        failed += 1;
        toast.error(
          `"${file.name}": ${e instanceof Error ? e.message : "errore imprevisto"}`,
        );
      }
    }
    setProgress(null);
    if (failed < files.length) {
      toast.success(
        `Caricate ${files.length - failed} immagini su ${files.length}`,
      );
    }
    router.refresh();
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error ?? "Operazione non riuscita");
      else if (okMsg) toast.success(okMsg);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Carica immagini: trascina i file qui oppure premi Invio per sceglierli"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!busy) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "focus-visible:ring-ring/50 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors focus-visible:ring-3 focus-visible:outline-none",
          isDragging ? "border-primary bg-primary/5" : "hover:bg-surface-2/50",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <ImagePlus className="text-muted-foreground size-6" aria-hidden />
        <p className="text-sm font-medium">
          Trascina le foto qui o clicca per sceglierle
        </p>
        <p className="text-muted-foreground text-xs">
          JPG, PNG o WEBP fino a 20 MB. Compressione automatica in WebP
          (max {MAX_DIMENSION}px) prima del caricamento.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {progress ? (
        <div aria-live="polite" className="flex flex-col gap-1.5">
          <p className="text-muted-foreground text-xs">
            Caricamento {progress.done + 1}/{progress.total}:{" "}
            {progress.currentName}
          </p>
          <Progress value={(progress.done / progress.total) * 100} />
        </div>
      ) : null}

      {/* Image list */}
      {images.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nessuna immagine caricata. La prima foto caricata diventa
          automaticamente la copertina.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="bg-card flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
            >
              <div className="bg-surface-2 relative h-20 w-32 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={image.public_url}
                  alt={image.alt_text ?? `Immagine ${index + 1}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  {image.is_cover ? (
                    <Badge>
                      <Star className="fill-current" />
                      Copertina
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => setCoverImageAction(image.id),
                          "Copertina aggiornata",
                        )
                      }
                    >
                      <Star data-icon="inline-start" />
                      Usa come copertina
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`alt-${image.id}`} className="sr-only">
                    Testo alternativo immagine {index + 1}
                  </Label>
                  <Input
                    id={`alt-${image.id}`}
                    defaultValue={image.alt_text ?? ""}
                    placeholder="Testo alternativo (descrizione della foto)"
                    disabled={busy}
                    onBlur={(e) => {
                      if (e.target.value !== (image.alt_text ?? "")) {
                        run(() =>
                          updateImageAltAction(image.id, e.target.value),
                        );
                      }
                    }}
                  />
                </div>
              </div>
              <div
                className="flex shrink-0 items-center gap-1"
                role="group"
                aria-label={`Azioni immagine ${index + 1}`}
              >
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Sposta su"
                  disabled={busy || index === 0}
                  onClick={() =>
                    run(() => moveVehicleImageAction(image.id, "up"))
                  }
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Sposta giù"
                  disabled={busy || index === images.length - 1}
                  onClick={() =>
                    run(() => moveVehicleImageAction(image.id, "down"))
                  }
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Elimina immagine ${index + 1}`}
                  disabled={busy}
                  onClick={() => setPendingDelete(image)}
                >
                  {isPending ? <Spinner /> : <Trash2 />}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa immagine?</AlertDialogTitle>
            <AlertDialogDescription>
              Il file viene rimosso anche dallo storage. Se è la copertina,
              la prima immagine rimanente la sostituirà.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  run(
                    () => deleteVehicleImageAction(pendingDelete.id),
                    "Immagine eliminata",
                  );
                }
                setPendingDelete(null);
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
