"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDemoDataAction } from "@/features/vehicles/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function DeleteDemoButton({ demoCount }: { demoCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          {isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Trash2 data-icon="inline-start" />
          )}
          Elimina dati demo ({demoCount})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Eliminare i {demoCount} veicoli demo?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Rimuove definitivamente tutti i veicoli dimostrativi
            (is_demo=true) e le relative immagini. Il sito resterà funzionante
            con gli stati vuoti corretti.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              startTransition(async () => {
                const result = await deleteDemoDataAction();
                if (result.ok) {
                  toast.success(
                    `Eliminati ${result.data?.done ?? 0} veicoli demo`,
                  );
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              });
            }}
          >
            Elimina dati demo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
