"use client";

import { useActionState, useEffect, useRef } from "react";
import { CircleAlert, CircleCheck, Send } from "lucide-react";
import {
  submitLeadAction,
  type LeadFormState,
} from "@/features/leads/actions";
import type { LeadType } from "@/lib/types/database";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

const initialState: LeadFormState = { status: "idle", message: null };

const leadTypeOptions: Array<{ value: LeadType; label: string }> = [
  { value: "info_veicolo", label: "Informazioni sull'auto" },
  { value: "visita", label: "Prenota una visita" },
  { value: "test_drive", label: "Richiedi un test drive" },
  { value: "permuta", label: "Proposta di permuta" },
  { value: "finanziamento", label: "Informazioni sul finanziamento" },
];

export function LeadForm({
  vehicleId,
  sourcePage,
  defaultLeadType = "info_veicolo",
  genericOnly = false,
  idPrefix = "lead",
}: {
  vehicleId?: string;
  sourcePage: string;
  defaultLeadType?: LeadType;
  /** Contact page mode: single generic lead type, no vehicle context. */
  genericOnly?: boolean;
  idPrefix?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    submitLeadAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
    if (state.status !== "idle") feedbackRef.current?.focus();
  }, [state]);

  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <form ref={formRef} action={formAction} noValidate>
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        {vehicleId ? (
          <input type="hidden" name="vehicle_id" value={vehicleId} />
        ) : null}
        <input type="hidden" name="source_page" value={sourcePage} />
        {genericOnly ? (
          <input type="hidden" name="lead_type" value="contatto_generico" />
        ) : null}
        {/* Honeypot: visually hidden, tab-skipped; bots fill it */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor={id("website")}>Sito web</label>
          <input
            id={id("website")}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Field>
          <FieldLabel htmlFor={id("first_name")}>Nome *</FieldLabel>
          <Input
            id={id("first_name")}
            name="first_name"
            autoComplete="given-name"
            required
            disabled={isPending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={id("last_name")}>Cognome</FieldLabel>
          <Input
            id={id("last_name")}
            name="last_name"
            autoComplete="family-name"
            disabled={isPending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={id("email")}>Email *</FieldLabel>
          <Input
            id={id("email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={id("phone")}>Telefono</FieldLabel>
          <Input
            id={id("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            disabled={isPending}
          />
        </Field>
        {!genericOnly ? (
          <>
            <Field>
              <FieldLabel htmlFor={id("lead_type")}>
                Tipo di richiesta
              </FieldLabel>
              <NativeSelect
                id={id("lead_type")}
                name="lead_type"
                defaultValue={defaultLeadType}
                disabled={isPending}
              >
                {leadTypeOptions.map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor={id("preferred_channel")}>
                Come preferisci essere ricontattato?
              </FieldLabel>
              <NativeSelect
                id={id("preferred_channel")}
                name="preferred_channel"
                defaultValue=""
                disabled={isPending}
              >
                <NativeSelectOption value="">Indifferente</NativeSelectOption>
                <NativeSelectOption value="telefono">
                  Telefono
                </NativeSelectOption>
                <NativeSelectOption value="whatsapp">
                  WhatsApp
                </NativeSelectOption>
                <NativeSelectOption value="email">Email</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor={id("trade_in")}>
                Hai un&apos;auto da dare in permuta?
              </FieldLabel>
              <Input
                id={id("trade_in")}
                name="trade_in"
                placeholder="Es. Fiat Panda 1.2, 2017, 95.000 km"
                disabled={isPending}
              />
              <FieldDescription>
                Facoltativo: marca, modello, anno e chilometri bastano.
              </FieldDescription>
            </Field>
          </>
        ) : null}
        <Field className="md:col-span-2">
          <FieldLabel htmlFor={id("message")}>Messaggio</FieldLabel>
          <Textarea
            id={id("message")}
            name="message"
            rows={4}
            disabled={isPending}
          />
        </Field>

        <Field orientation="horizontal" className="md:col-span-2">
          <Checkbox
            id={id("privacy_consent")}
            name="privacy_consent"
            required
            disabled={isPending}
            aria-describedby={id("privacy-desc")}
          />
          <div>
            <FieldLabel htmlFor={id("privacy_consent")}>
              Ho letto la privacy policy e acconsento al trattamento dei dati *
            </FieldLabel>
            <FieldDescription id={id("privacy-desc")}>
              I dati servono solo per rispondere alla richiesta.{" "}
              <Link
                href="/privacy-policy"
                className="hover:text-foreground underline"
              >
                Leggi l&apos;informativa
              </Link>
              .
            </FieldDescription>
          </div>
        </Field>

        <div
          ref={feedbackRef}
          tabIndex={-1}
          aria-live="polite"
          className="md:col-span-2 focus:outline-none"
        >
          {state.status === "success" ? (
            <Alert role="status">
              <CircleCheck />
              <AlertTitle>Richiesta inviata</AlertTitle>
              <AlertDescription>
                {state.message}
                {state.emailNotConfigured
                  ? " (Nota interna: notifica email non configurata — la richiesta è comunque salvata e visibile in area riservata.)"
                  : null}
              </AlertDescription>
            </Alert>
          ) : null}
          {state.status === "error" ? (
            <Alert variant="destructive" role="alert">
              <CircleAlert />
              <AlertTitle>Invio non riuscito</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <Field className="md:col-span-2">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Invio in corso…
              </>
            ) : (
              <>
                <Send data-icon="inline-start" />
                Invia la richiesta
              </>
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
