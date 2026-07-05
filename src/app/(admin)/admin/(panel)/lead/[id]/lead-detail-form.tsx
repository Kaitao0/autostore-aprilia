"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateLeadAction } from "@/features/leads/admin-actions";
import { enumOptions, leadStatusLabels } from "@/lib/labels";
import type { LeadStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export function LeadDetailForm({
  leadId,
  status,
  internalNotes,
}: {
  leadId: string;
  status: LeadStatus;
  internalNotes: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<string>(status);
  const [notes, setNotes] = useState(internalNotes);

  function save() {
    startTransition(async () => {
      const result = await updateLeadAction(leadId, {
        status: currentStatus,
        internal_notes: notes,
      });
      if (result.ok) {
        toast.success("Lead aggiornato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <FieldGroup className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="lead-status">Stato</FieldLabel>
        <NativeSelect
          id="lead-status"
          value={currentStatus}
          onChange={(e) => setCurrentStatus(e.target.value)}
          disabled={isPending}
        >
          {enumOptions(leadStatusLabels).map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field>
        <FieldLabel htmlFor="lead-notes">Note interne</FieldLabel>
        <Textarea
          id="lead-notes"
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isPending}
        />
      </Field>
      <Field>
        <Button onClick={save} disabled={isPending}>
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              Salvataggio…
            </>
          ) : (
            "Salva"
          )}
        </Button>
      </Field>
    </FieldGroup>
  );
}
