"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAutoscoutSnippetAction } from "@/features/integrations/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export function AutoscoutSnippetForm({
  currentSnippet,
}: {
  currentSnippet: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [snippet, setSnippet] = useState(currentSnippet ?? "");

  function save(value: string) {
    startTransition(async () => {
      const result = await updateAutoscoutSnippetAction(value);
      if (result.ok) {
        toast.success(
          value.trim() === ""
            ? "Snippet rimosso: widget disattivato"
            : "Snippet salvato: widget attivo (previo consenso cookie)",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <FieldGroup className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="as24-snippet">Snippet embed Carportal</FieldLabel>
        <Textarea
          id="as24-snippet"
          rows={6}
          value={snippet}
          onChange={(e) => setSnippet(e.target.value)}
          placeholder='Incolla qui lo snippet fornito da AutoScout24 (es. <iframe src="…"></iframe>)'
          disabled={isPending}
          className="font-mono text-xs"
        />
        <FieldDescription>
          Fornito da AutoScout24 su richiesta (widget gratuito di sola
          visualizzazione). Sul sito viene caricato solo previo consenso ai
          contenuti esterni.
        </FieldDescription>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save(snippet)} disabled={isPending}>
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              Salvataggio…
            </>
          ) : (
            "Salva snippet"
          )}
        </Button>
        {currentSnippet ? (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setSnippet("");
              save("");
            }}
          >
            Disattiva widget
          </Button>
        ) : null}
      </div>
    </FieldGroup>
  );
}
