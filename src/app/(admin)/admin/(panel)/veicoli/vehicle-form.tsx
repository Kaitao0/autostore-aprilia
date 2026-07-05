"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Info } from "lucide-react";
import { toast } from "sonner";
import {
  createVehicleAction,
  updateVehicleAction,
} from "@/features/vehicles/actions";
import {
  vehicleFormSchema,
  type VehicleFormInput,
  type VehicleFormValues,
} from "@/features/vehicles/schema";
import {
  availabilityLabels,
  bodyTypeLabels,
  conditionLabels,
  drivetrainLabels,
  fuelTypeLabels,
  transmissionLabels,
  enumOptions,
} from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import type {
  VehicleImageRow,
  VehicleRow,
  VehicleStatusHistoryRow,
} from "@/lib/types/database";
import { VehicleImagesManager } from "@/components/admin/vehicle-images-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

type TabId =
  | "main"
  | "price"
  | "tech"
  | "description"
  | "equipment"
  | "media"
  | "status"
  | "seo"
  | "autoscout"
  | "history";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "main", label: "Informazioni" },
  { id: "price", label: "Prezzo" },
  { id: "tech", label: "Dati tecnici" },
  { id: "description", label: "Descrizione" },
  { id: "equipment", label: "Dotazioni" },
  { id: "media", label: "Immagini e video" },
  { id: "status", label: "Stato" },
  { id: "seo", label: "SEO" },
  { id: "autoscout", label: "AutoScout24" },
  { id: "history", label: "Cronologia" },
];

const fieldTabMap: Record<string, TabId> = {
  make: "main",
  model: "main",
  version: "main",
  display_title: "main",
  condition: "main",
  body_type: "main",
  internal_code: "main",
  location: "main",
  price: "price",
  previous_price: "price",
  price_on_request: "price",
  vat_deductible: "price",
  year: "tech",
  registration_month: "tech",
  mileage: "tech",
  fuel_type: "tech",
  transmission: "tech",
  power_hp: "tech",
  power_kw: "tech",
  engine_displacement: "tech",
  exterior_color: "tech",
  interior_color: "tech",
  doors: "tech",
  seats: "tech",
  emission_class: "tech",
  drivetrain: "tech",
  previous_owners: "tech",
  plate: "tech",
  vin: "tech",
  description: "description",
  warranty: "description",
  internal_notes: "description",
  equipment: "equipment",
  cover_image_url: "media",
  video_url: "media",
  published: "status",
  featured: "status",
  showroom_enabled: "status",
  availability: "status",
  sort_order: "status",
  slug: "seo",
  autoscout_url: "autoscout",
};

function vehicleToFormValues(vehicle?: VehicleRow): VehicleFormInput {
  return {
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    version: vehicle?.version ?? "",
    display_title: vehicle?.display_title ?? "",
    slug: vehicle?.slug ?? "",
    internal_code: vehicle?.internal_code ?? "",
    condition: vehicle?.condition ?? "usato",
    body_type: vehicle?.body_type ?? "",
    availability: vehicle?.availability ?? "disponibile",
    price: vehicle?.price ?? "",
    previous_price: vehicle?.previous_price ?? "",
    price_on_request: vehicle?.price_on_request ?? false,
    vat_deductible: vehicle?.vat_deductible ?? false,
    year: vehicle?.year ?? "",
    registration_month: vehicle?.registration_month ?? "",
    mileage: vehicle?.mileage ?? "",
    fuel_type: vehicle?.fuel_type ?? "",
    transmission: vehicle?.transmission ?? "",
    power_hp: vehicle?.power_hp ?? "",
    power_kw: vehicle?.power_kw ?? "",
    engine_displacement: vehicle?.engine_displacement ?? "",
    exterior_color: vehicle?.exterior_color ?? "",
    interior_color: vehicle?.interior_color ?? "",
    doors: vehicle?.doors ?? "",
    seats: vehicle?.seats ?? "",
    emission_class: vehicle?.emission_class ?? "",
    drivetrain: vehicle?.drivetrain ?? "",
    previous_owners: vehicle?.previous_owners ?? "",
    plate: vehicle?.plate ?? "",
    vin: vehicle?.vin ?? "",
    description: vehicle?.description ?? "",
    warranty: vehicle?.warranty ?? "",
    internal_notes: vehicle?.internal_notes ?? "",
    location: vehicle?.location ?? "",
    cover_image_url: vehicle?.cover_image_url ?? "",
    video_url: vehicle?.video_url ?? "",
    autoscout_url: vehicle?.autoscout_url ?? "",
    equipment: vehicle?.equipment ?? [],
    featured: vehicle?.featured ?? false,
    published: vehicle?.published ?? false,
    showroom_enabled: vehicle?.showroom_enabled ?? true,
    sort_order: vehicle?.sort_order ?? 0,
  };
}

export function VehicleForm({
  vehicle,
  history = [],
  images = [],
}: {
  vehicle?: VehicleRow;
  history?: VehicleStatusHistoryRow[];
  images?: VehicleImageRow[];
}) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);

  const form = useForm<VehicleFormInput, unknown, VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: vehicleToFormValues(vehicle),
    mode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = form;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const tabErrors = useMemo(() => {
    const counts = new Map<TabId, number>();
    for (const key of Object.keys(errors)) {
      const tab = fieldTabMap[key];
      if (tab) counts.set(tab, (counts.get(tab) ?? 0) + 1);
    }
    return counts;
  }, [errors]);

  const errorMessages = useMemo(
    () =>
      Object.entries(errors as FieldErrors<VehicleFormInput>)
        .map(([, err]) => err?.message)
        .filter((m): m is string => typeof m === "string"),
    [errors],
  );

  const onSubmit = handleSubmit(async (values) => {
    if (isEdit && vehicle) {
      const result = await updateVehicleAction(vehicle.id, values);
      if (result.ok) {
        toast.success("Veicolo salvato");
        reset(values as VehicleFormInput);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createVehicleAction(values);
      if (result.ok && result.data) {
        toast.success("Veicolo creato");
        router.push(`/admin/veicoli/${result.data.id}`);
      } else if (!result.ok) {
        toast.error(result.error);
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {isEdit
              ? `${vehicle?.make} ${vehicle?.model}`
              : "Nuovo veicolo"}
          </h1>
          {vehicle?.is_demo ? <Badge variant="secondary">DEMO</Badge> : null}
          {isDirty ? (
            <Badge variant="outline" aria-live="polite">
              Modifiche non salvate
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/veicoli")}
          >
            Torna all&apos;elenco
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Salvataggio…
              </>
            ) : isEdit ? (
              "Salva modifiche"
            ) : (
              "Crea veicolo"
            )}
          </Button>
        </div>
      </div>

      {errorMessages.length > 0 ? (
        <Alert variant="destructive" role="alert" className="mb-4">
          <CircleAlert />
          <AlertTitle>Controlla i campi segnalati</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errorMessages.slice(0, 6).map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="main">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
              {tabErrors.get(tab.id) ? (
                <span
                  className="bg-destructive ml-1 inline-block size-1.5 rounded-full"
                  aria-label={`${tabErrors.get(tab.id)} errori`}
                />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Informazioni principali ─────────────────────────── */}
        <TabsContent value="main">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={Boolean(errors.make) || undefined}>
              <FieldLabel htmlFor="make">Marca *</FieldLabel>
              <Input
                id="make"
                {...register("make")}
                aria-invalid={Boolean(errors.make) || undefined}
              />
              <FieldError errors={[errors.make]} />
            </Field>
            <Field data-invalid={Boolean(errors.model) || undefined}>
              <FieldLabel htmlFor="model">Modello *</FieldLabel>
              <Input
                id="model"
                {...register("model")}
                aria-invalid={Boolean(errors.model) || undefined}
              />
              <FieldError errors={[errors.model]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="version">Versione</FieldLabel>
              <Input id="version" {...register("version")} />
              <FieldDescription>
                Es. “1.5 TSI Life”, “30 TDI S tronic”.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="display_title">Titolo personalizzato</FieldLabel>
              <Input id="display_title" {...register("display_title")} />
              <FieldDescription>
                Se vuoto viene usato “Marca Modello Versione”.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="condition">Condizione</FieldLabel>
              <NativeSelect id="condition" {...register("condition")}>
                {enumOptions(conditionLabels).map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="body_type">Carrozzeria</FieldLabel>
              <NativeSelect id="body_type" {...register("body_type")}>
                <NativeSelectOption value="">—</NativeSelectOption>
                {enumOptions(bodyTypeLabels).map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="internal_code">Codice interno</FieldLabel>
              <Input id="internal_code" {...register("internal_code")} />
              <FieldDescription>Non visibile sul sito.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Sede</FieldLabel>
              <Input
                id="location"
                placeholder="Aprilia (LT)"
                {...register("location")}
              />
            </Field>
          </FieldGroup>
        </TabsContent>

        {/* ── Prezzo ──────────────────────────────────────────── */}
        <TabsContent value="price">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={Boolean(errors.price) || undefined}>
              <FieldLabel htmlFor="price">Prezzo (€)</FieldLabel>
              <Input
                id="price"
                type="number"
                inputMode="numeric"
                min={0}
                step={50}
                {...register("price")}
                aria-invalid={Boolean(errors.price) || undefined}
              />
              <FieldError errors={[errors.price]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="previous_price">
                Prezzo precedente (€)
              </FieldLabel>
              <Input
                id="previous_price"
                type="number"
                inputMode="numeric"
                min={0}
                step={50}
                {...register("previous_price")}
              />
              <FieldDescription>
                Se maggiore del prezzo attuale, in scheda compare il prezzo
                barrato.
              </FieldDescription>
            </Field>
            <Controller
              control={control}
              name="price_on_request"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="price_on_request"
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    aria-describedby="price_on_request_desc"
                  />
                  <div>
                    <FieldLabel htmlFor="price_on_request">
                      Prezzo su richiesta
                    </FieldLabel>
                    <FieldDescription id="price_on_request_desc">
                      Nasconde il prezzo e mostra “Prezzo su richiesta”.
                    </FieldDescription>
                  </div>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="vat_deductible"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="vat_deductible"
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                  <div>
                    <FieldLabel htmlFor="vat_deductible">
                      IVA esposta / deducibile
                    </FieldLabel>
                  </div>
                </Field>
              )}
            />
          </FieldGroup>
        </TabsContent>

        {/* ── Dati tecnici ────────────────────────────────────── */}
        <TabsContent value="tech">
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <Field data-invalid={Boolean(errors.year) || undefined}>
              <FieldLabel htmlFor="year">Anno</FieldLabel>
              <Input
                id="year"
                type="number"
                inputMode="numeric"
                min={1950}
                max={2100}
                {...register("year")}
                aria-invalid={Boolean(errors.year) || undefined}
              />
              <FieldError errors={[errors.year]} />
            </Field>
            <Field data-invalid={Boolean(errors.registration_month) || undefined}>
              <FieldLabel htmlFor="registration_month">
                Mese immatricolazione
              </FieldLabel>
              <Input
                id="registration_month"
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                {...register("registration_month")}
                aria-invalid={Boolean(errors.registration_month) || undefined}
              />
              <FieldError errors={[errors.registration_month]} />
            </Field>
            <Field data-invalid={Boolean(errors.mileage) || undefined}>
              <FieldLabel htmlFor="mileage">Chilometri</FieldLabel>
              <Input
                id="mileage"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("mileage")}
                aria-invalid={Boolean(errors.mileage) || undefined}
              />
              <FieldError errors={[errors.mileage]} />
            </Field>
            <Field data-invalid={Boolean(errors.fuel_type) || undefined}>
              <FieldLabel htmlFor="fuel_type">Alimentazione</FieldLabel>
              <NativeSelect
                id="fuel_type"
                {...register("fuel_type")}
                aria-invalid={Boolean(errors.fuel_type) || undefined}
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                {enumOptions(fuelTypeLabels).map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.fuel_type]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="transmission">Cambio</FieldLabel>
              <NativeSelect id="transmission" {...register("transmission")}>
                <NativeSelectOption value="">—</NativeSelectOption>
                {enumOptions(transmissionLabels).map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="drivetrain">Trazione</FieldLabel>
              <NativeSelect id="drivetrain" {...register("drivetrain")}>
                <NativeSelectOption value="">—</NativeSelectOption>
                {enumOptions(drivetrainLabels).map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="power_hp">Potenza (CV)</FieldLabel>
              <Input
                id="power_hp"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("power_hp")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="power_kw">Potenza (kW)</FieldLabel>
              <Input
                id="power_kw"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("power_kw")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="engine_displacement">
                Cilindrata (cc)
              </FieldLabel>
              <Input
                id="engine_displacement"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("engine_displacement")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="exterior_color">Colore esterno</FieldLabel>
              <Input id="exterior_color" {...register("exterior_color")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="interior_color">Interni</FieldLabel>
              <Input id="interior_color" {...register("interior_color")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="emission_class">Classe emissioni</FieldLabel>
              <Input
                id="emission_class"
                placeholder="Euro 6d"
                {...register("emission_class")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="doors">Porte</FieldLabel>
              <Input
                id="doors"
                type="number"
                inputMode="numeric"
                min={1}
                max={9}
                {...register("doors")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="seats">Posti</FieldLabel>
              <Input
                id="seats"
                type="number"
                inputMode="numeric"
                min={1}
                max={9}
                {...register("seats")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="previous_owners">Proprietari precedenti</FieldLabel>
              <Input
                id="previous_owners"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("previous_owners")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="plate">Targa</FieldLabel>
              <Input id="plate" {...register("plate")} />
              <FieldDescription>
                Mai visibile sul sito pubblico.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="vin">Telaio (VIN)</FieldLabel>
              <Input id="vin" {...register("vin")} />
              <FieldDescription>
                Mai visibile sul sito pubblico.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </TabsContent>

        {/* ── Descrizione ─────────────────────────────────────── */}
        <TabsContent value="description">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.description) || undefined}>
              <FieldLabel htmlFor="description">Descrizione</FieldLabel>
              <Textarea
                id="description"
                rows={8}
                {...register("description")}
                aria-invalid={Boolean(errors.description) || undefined}
              />
              <FieldDescription>
                Minimo 60 caratteri per la pubblicazione.
              </FieldDescription>
              <FieldError errors={[errors.description]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="warranty">Garanzia</FieldLabel>
              <Input
                id="warranty"
                placeholder="[INSERIRE GARANZIA]"
                {...register("warranty")}
              />
              <FieldDescription>
                Non inventare condizioni: lasciare vuoto o usare un placeholder
                finché il dato reale non è disponibile.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="internal_notes">Note interne</FieldLabel>
              <Textarea
                id="internal_notes"
                rows={3}
                {...register("internal_notes")}
              />
              <FieldDescription>
                Mai visibili sul sito pubblico.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </TabsContent>

        {/* ── Dotazioni ───────────────────────────────────────── */}
        <TabsContent value="equipment">
          <Controller
            control={control}
            name="equipment"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="equipment">Dotazioni</FieldLabel>
                <Textarea
                  id="equipment"
                  rows={10}
                  value={(field.value ?? []).join("\n")}
                  onChange={(e) => field.onChange(e.target.value.split("\n"))}
                  placeholder={"Una dotazione per riga\nEs. Apple CarPlay"}
                />
                <FieldDescription>
                  Una voce per riga. Le righe vuote vengono ignorate.
                </FieldDescription>
              </Field>
            )}
          />
        </TabsContent>

        {/* ── Immagini e video ────────────────────────────────── */}
        <TabsContent value="media">
          <FieldGroup>
            {isEdit && vehicle ? (
              <VehicleImagesManager vehicleId={vehicle.id} images={images} />
            ) : (
              <Alert>
                <Info />
                <AlertTitle>Prima crea il veicolo</AlertTitle>
                <AlertDescription>
                  L&apos;upload delle immagini si attiva dopo il primo
                  salvataggio (serve l&apos;ID del veicolo per lo storage).
                </AlertDescription>
              </Alert>
            )}
            <Field data-invalid={Boolean(errors.cover_image_url) || undefined}>
              <FieldLabel htmlFor="cover_image_url">
                URL copertina (avanzato)
              </FieldLabel>
              <Input
                id="cover_image_url"
                type="url"
                placeholder="/demo/…webp oppure URL Supabase Storage"
                {...register("cover_image_url")}
                aria-invalid={Boolean(errors.cover_image_url) || undefined}
              />
              <FieldDescription>
                Gestita automaticamente dall&apos;image manager: modificala a
                mano solo per URL esterni (es. cover demo).
              </FieldDescription>
              <FieldError errors={[errors.cover_image_url]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="video_url">URL video</FieldLabel>
              <Input
                id="video_url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                {...register("video_url")}
              />
            </Field>
          </FieldGroup>
        </TabsContent>

        {/* ── Stato e pubblicazione ───────────────────────────── */}
        <TabsContent value="status">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="published"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="published"
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    aria-describedby="published_desc"
                  />
                  <div>
                    <FieldLabel htmlFor="published">Pubblicato</FieldLabel>
                    <FieldDescription id="published_desc">
                      Visibile nel catalogo e nella sitemap. La pubblicazione
                      richiede dati completi.
                    </FieldDescription>
                  </div>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="featured"
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                  <div>
                    <FieldLabel htmlFor="featured">In evidenza</FieldLabel>
                    <FieldDescription>
                      Mostrato nella sezione “Auto in evidenza” della home.
                    </FieldDescription>
                  </div>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="showroom_enabled"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="showroom_enabled"
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                  <div>
                    <FieldLabel htmlFor="showroom_enabled">
                      Visibile in showroom
                    </FieldLabel>
                    <FieldDescription>
                      Incluso nella modalità showroom/display (Fase 3).
                    </FieldDescription>
                  </div>
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor="availability">Disponibilità</FieldLabel>
              <NativeSelect id="availability" {...register("availability")}>
                {enumOptions(availabilityLabels).map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="sort_order">Priorità ordinamento</FieldLabel>
              <Input
                id="sort_order"
                type="number"
                inputMode="numeric"
                {...register("sort_order")}
              />
              <FieldDescription>
                Numeri più alti compaiono prima a parità di criterio.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </TabsContent>

        {/* ── SEO ─────────────────────────────────────────────── */}
        <TabsContent value="seo">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.slug) || undefined}>
              <FieldLabel htmlFor="slug">Slug URL</FieldLabel>
              <Input
                id="slug"
                placeholder="generato automaticamente se vuoto"
                {...register("slug")}
              />
              <FieldDescription>
                La scheda sarà su /auto/[slug]. Cambiando lo slug di un veicolo
                pubblicato viene creato automaticamente un redirect 301.
              </FieldDescription>
              <FieldError errors={[errors.slug]} />
            </Field>
            <Alert>
              <Info />
              <AlertTitle>Metadati generati automaticamente</AlertTitle>
              <AlertDescription>
                Title e description della scheda vengono composti da marca,
                modello, versione, anno e condizione; l&apos;immagine OG usa la
                copertina.
              </AlertDescription>
            </Alert>
          </FieldGroup>
        </TabsContent>

        {/* ── AutoScout24 ─────────────────────────────────────── */}
        <TabsContent value="autoscout">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="autoscout_url">
                URL annuncio AutoScout24
              </FieldLabel>
              <Input
                id="autoscout_url"
                type="url"
                placeholder="https://www.autoscout24.it/annunci/…"
                {...register("autoscout_url")}
              />
              <FieldDescription>
                Se presente, in scheda compare il bottone “Vedi su
                AutoScout24”. Il catalogo su Supabase resta la fonte di verità.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </TabsContent>

        {/* ── Cronologia ──────────────────────────────────────── */}
        <TabsContent value="history">
          {history.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>Nessun cambio di stato registrato</EmptyTitle>
                <EmptyDescription>
                  {isEdit
                    ? "I cambi di disponibilità compariranno qui."
                    : "La cronologia sarà disponibile dopo la creazione del veicolo."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-baseline justify-between gap-4 border-b py-2.5 text-sm last:border-b-0"
                >
                  <span>
                    {entry.from_status
                      ? `${availabilityLabels[entry.from_status]} → `
                      : ""}
                    <span className="font-medium">
                      {availabilityLabels[entry.to_status]}
                    </span>
                    {entry.note ? (
                      <span className="text-muted-foreground"> — {entry.note}</span>
                    ) : null}
                  </span>
                  <time
                    dateTime={entry.created_at}
                    className="text-muted-foreground shrink-0 text-xs tabular-nums"
                  >
                    {formatDateTime(entry.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </form>
  );
}
