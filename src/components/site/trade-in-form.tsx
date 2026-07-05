"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, ImagePlus, Send, X } from "lucide-react";
import {
  submitTradeInAction,
  type TradeInFormState,
} from "@/features/trade-in/actions";
import {
  TRADE_IN_MAX_PHOTOS,
  TRADE_IN_MAX_PHOTO_BYTES,
} from "@/features/trade-in/schema";
import { enumOptions, fuelTypeLabels, transmissionLabels } from "@/lib/labels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const initialState: TradeInFormState = { status: "idle", message: null };

export function TradeInForm() {
  const [state, formAction, isPending] = useActionState(
    submitTradeInAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setFileNames([]);
    }
    if (state.status !== "idle") feedbackRef.current?.focus();
  }, [state]);

  function onFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    setFileError(null);
    if (files.length > TRADE_IN_MAX_PHOTOS) {
      setFileError(`Puoi allegare al massimo ${TRADE_IN_MAX_PHOTOS} foto.`);
      event.target.value = "";
      setFileNames([]);
      return;
    }
    const tooBig = files.find((f) => f.size > TRADE_IN_MAX_PHOTO_BYTES);
    if (tooBig) {
      setFileError(`"${tooBig.name}" supera gli 8 MB consentiti.`);
      event.target.value = "";
      setFileNames([]);
      return;
    }
    setFileNames(files.map((f) => f.name));
  }

  return (
    <form ref={formRef} action={formAction} noValidate>
      <FieldGroup className="flex flex-col gap-8">
        {/* Honeypot */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="ti-website">Sito web</label>
          <input
            id="ti-website"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <FieldSet>
          <FieldLegend>I tuoi contatti</FieldLegend>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="ti-first_name">Nome *</FieldLabel>
              <Input
                id="ti-first_name"
                name="first_name"
                autoComplete="given-name"
                required
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-last_name">Cognome</FieldLabel>
              <Input
                id="ti-last_name"
                name="last_name"
                autoComplete="family-name"
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-email">Email *</FieldLabel>
              <Input
                id="ti-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-phone">Telefono</FieldLabel>
              <Input
                id="ti-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                disabled={isPending}
              />
            </Field>
          </div>
        </FieldSet>

        <FieldSet>
          <FieldLegend>La tua auto</FieldLegend>
          <div className="grid gap-4 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="ti-car_make">Marca *</FieldLabel>
              <Input
                id="ti-car_make"
                name="car_make"
                required
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-car_model">Modello *</FieldLabel>
              <Input
                id="ti-car_model"
                name="car_model"
                required
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-car_version">Versione</FieldLabel>
              <Input
                id="ti-car_version"
                name="car_version"
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-car_year">Anno</FieldLabel>
              <Input
                id="ti-car_year"
                name="car_year"
                type="number"
                inputMode="numeric"
                min={1950}
                max={2100}
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-car_mileage">Chilometri</FieldLabel>
              <Input
                id="ti-car_mileage"
                name="car_mileage"
                type="number"
                inputMode="numeric"
                min={0}
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-plate">Targa (facoltativa)</FieldLabel>
              <Input id="ti-plate" name="plate" disabled={isPending} />
              <FieldDescription>
                Aiuta a identificare l&apos;allestimento esatto.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-car_fuel_type">Alimentazione</FieldLabel>
              <NativeSelect
                id="ti-car_fuel_type"
                name="car_fuel_type"
                defaultValue=""
                disabled={isPending}
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                {enumOptions(fuelTypeLabels).map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="ti-car_transmission">Cambio</FieldLabel>
              <NativeSelect
                id="ti-car_transmission"
                name="car_transmission"
                defaultValue=""
                disabled={isPending}
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                {enumOptions(transmissionLabels).map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field orientation="horizontal" className="md:col-span-3">
              <Switch
                id="ti-existing_finance"
                name="existing_finance"
                disabled={isPending}
              />
              <div>
                <FieldLabel htmlFor="ti-existing_finance">
                  C&apos;è un finanziamento in corso sull&apos;auto
                </FieldLabel>
              </div>
            </Field>
          </div>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Foto (facoltative, max {TRADE_IN_MAX_PHOTOS})</FieldLegend>
          <Field>
            <FieldLabel htmlFor="ti-photos">
              <span className="sr-only">Carica le foto dell&apos;auto</span>
            </FieldLabel>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus data-icon="inline-start" />
                Scegli le foto
              </Button>
              <input
                ref={fileInputRef}
                id="ti-photos"
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                className="sr-only"
                onChange={onFilesChange}
                disabled={isPending}
              />
              {fileNames.length > 0 ? (
                <ul className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                  {fileNames.map((name) => (
                    <li
                      key={name}
                      className="bg-surface-2 rounded-md border px-2 py-1"
                    >
                      {name}
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      className="hover:text-foreground inline-flex min-h-6 items-center gap-1 underline"
                      onClick={() => {
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        setFileNames([]);
                      }}
                    >
                      <X className="size-3" aria-hidden />
                      Rimuovi tutte
                    </button>
                  </li>
                </ul>
              ) : null}
              {fileError ? (
                <p role="alert" className="text-destructive text-sm">
                  {fileError}
                </p>
              ) : null}
            </div>
            <FieldDescription>
              Esterni, interni e dettagli utili. JPG, PNG, WEBP o HEIC fino a
              8 MB l&apos;una. Le foto finiscono in uno spazio privato,
              visibile solo al nostro staff.
            </FieldDescription>
          </Field>
        </FieldSet>

        <Field>
          <FieldLabel htmlFor="ti-message">Note</FieldLabel>
          <Textarea
            id="ti-message"
            name="message"
            rows={4}
            placeholder="Condizioni, optional, eventuali danni…"
            disabled={isPending}
          />
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="ti-privacy"
            name="privacy_consent"
            required
            disabled={isPending}
            aria-describedby="ti-privacy-desc"
          />
          <div>
            <FieldLabel htmlFor="ti-privacy">
              Ho letto la privacy policy e acconsento al trattamento dei dati *
            </FieldLabel>
            <FieldDescription id="ti-privacy-desc">
              I dati servono solo per la valutazione.{" "}
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
          className="focus:outline-none"
        >
          {state.status === "success" ? (
            <Alert role="status">
              <CircleCheck />
              <AlertTitle>Richiesta inviata</AlertTitle>
              <AlertDescription>
                {state.message}
                {typeof state.photosSubmitted === "number" &&
                state.photosSubmitted > 0
                  ? ` Foto ricevute: ${state.photosSaved}/${state.photosSubmitted}.`
                  : null}
                {state.emailNotConfigured
                  ? " (Nota interna: notifica email non configurata — la richiesta è comunque salvata in area riservata.)"
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

        <Field>
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Invio in corso…
              </>
            ) : (
              <>
                <Send data-icon="inline-start" />
                Richiedi la valutazione
              </>
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
