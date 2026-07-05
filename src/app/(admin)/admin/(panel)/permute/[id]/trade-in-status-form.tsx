"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTradeInAction } from "@/features/leads/admin-actions";
import { enumOptions, leadStatusLabels } from "@/lib/labels";
import type { LeadStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";

export function TradeInStatusForm({
  requestId,
  status,
}: {
  requestId: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<string>(status);

  return (
    <FieldGroup className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="trade-in-status">Stato</FieldLabel>
        <NativeSelect
          id="trade-in-status"
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
        <Button
          onClick={() =>
            startTransition(async () => {
              const result = await updateTradeInAction(requestId, {
                status: currentStatus,
              });
              if (result.ok) {
                toast.success("Richiesta aggiornata");
                router.refresh();
              } else {
                toast.error(result.error);
              }
            })
          }
          disabled={isPending}
        >
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
