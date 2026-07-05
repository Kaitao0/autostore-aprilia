"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateBusinessInformationAction,
} from "@/features/site/admin-actions";
import type { BusinessInformation } from "@/features/site/queries";
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
import { Spinner } from "@/components/ui/spinner";

const socialPlatforms = ["instagram", "facebook", "tiktok", "youtube"] as const;

type HoursRow = { days: string; hours: string };
type SocialRow = {
  platform: (typeof socialPlatforms)[number];
  url: string;
  enabled: boolean;
};

export function BusinessForm({ business }: { business: BusinessInformation }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [contact, setContact] = useState({
    phone: business.phone ?? "",
    whatsapp: business.whatsapp ?? "",
    email: business.email ?? "",
    address: business.address ?? "",
    city: business.city ?? "",
    zip: business.zip ?? "",
    province: business.province ?? "",
    autoscout_dealer_url: business.autoscout_dealer_url ?? "",
  });

  const [hours, setHours] = useState<HoursRow[]>(
    business.hours.length > 0
      ? business.hours
      : [
          { days: "Lunedì – Venerdì", hours: "[INSERIRE ORARI]" },
          { days: "Sabato", hours: "[INSERIRE ORARI]" },
          { days: "Domenica", hours: "[INSERIRE ORARI]" },
        ],
  );

  const [social, setSocial] = useState<SocialRow[]>(
    socialPlatforms.map((platform) => {
      const existing = business.social.find((s) => s.platform === platform);
      return {
        platform,
        url: existing?.url ?? "",
        enabled: existing?.enabled ?? false,
      };
    }),
  );

  function save() {
    startTransition(async () => {
      const result = await updateBusinessInformationAction({
        ...contact,
        hours,
        social,
      });
      if (result.ok) {
        toast.success("Impostazioni salvate");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const set = (key: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setContact((c) => ({ ...c, [key]: e.target.value }));

  return (
    <FieldGroup className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Contatti pubblici</FieldLegend>
        <FieldDescription>
          I placeholder [INSERIRE …] vengono mostrati come testo ma non
          diventano mai link cliccabili sul sito.
        </FieldDescription>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="b-phone">Telefono</FieldLabel>
            <Input
              id="b-phone"
              value={contact.phone}
              onChange={set("phone")}
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="b-whatsapp">WhatsApp</FieldLabel>
            <Input
              id="b-whatsapp"
              value={contact.whatsapp}
              onChange={set("whatsapp")}
              disabled={isPending}
            />
            <FieldDescription>
              Numero con prefisso internazionale, es. +39 333 1234567.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="b-email">Email</FieldLabel>
            <Input
              id="b-email"
              type="email"
              value={contact.email}
              onChange={set("email")}
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="b-as24">Profilo AutoScout24 (URL)</FieldLabel>
            <Input
              id="b-as24"
              type="url"
              placeholder="https://www.autoscout24.it/concessionari/…"
              value={contact.autoscout_dealer_url}
              onChange={set("autoscout_dealer_url")}
              disabled={isPending}
            />
          </Field>
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Sede</FieldLegend>
        <div className="grid gap-4 md:grid-cols-4">
          <Field className="md:col-span-2">
            <FieldLabel htmlFor="b-address">Indirizzo</FieldLabel>
            <Input
              id="b-address"
              value={contact.address}
              onChange={set("address")}
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="b-city">Città</FieldLabel>
            <Input
              id="b-city"
              value={contact.city}
              onChange={set("city")}
              disabled={isPending}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="b-zip">CAP</FieldLabel>
              <Input
                id="b-zip"
                value={contact.zip}
                onChange={set("zip")}
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="b-province">Prov.</FieldLabel>
              <Input
                id="b-province"
                value={contact.province}
                onChange={set("province")}
                disabled={isPending}
              />
            </Field>
          </div>
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Orari di apertura</FieldLegend>
        <div className="flex flex-col gap-3">
          {hours.map((row, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`h-days-${index}`}>Giorni</FieldLabel>
                <Input
                  id={`h-days-${index}`}
                  value={row.days}
                  onChange={(e) =>
                    setHours((h) =>
                      h.map((r, i) =>
                        i === index ? { ...r, days: e.target.value } : r,
                      ),
                    )
                  }
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`h-hours-${index}`}>Orario</FieldLabel>
                <Input
                  id={`h-hours-${index}`}
                  placeholder="Es. 9:00–13:00 / 15:30–19:30"
                  value={row.hours}
                  onChange={(e) =>
                    setHours((h) =>
                      h.map((r, i) =>
                        i === index ? { ...r, hours: e.target.value } : r,
                      ),
                    )
                  }
                  disabled={isPending}
                />
              </Field>
            </div>
          ))}
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Social</FieldLegend>
        <FieldDescription>
          Solo i profili attivi con URL valido compaiono nel footer del sito.
        </FieldDescription>
        <div className="flex flex-col gap-3">
          {social.map((row, index) => (
            <div key={row.platform} className="flex items-end gap-3">
              <Field orientation="horizontal" className="w-36 shrink-0 pb-2">
                <Checkbox
                  id={`s-enabled-${row.platform}`}
                  checked={row.enabled}
                  onCheckedChange={(checked) =>
                    setSocial((s) =>
                      s.map((r, i) =>
                        i === index ? { ...r, enabled: checked === true } : r,
                      ),
                    )
                  }
                  disabled={isPending}
                />
                <FieldLabel
                  htmlFor={`s-enabled-${row.platform}`}
                  className="capitalize"
                >
                  {row.platform}
                </FieldLabel>
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor={`s-url-${row.platform}`} className="sr-only">
                  URL {row.platform}
                </FieldLabel>
                <Input
                  id={`s-url-${row.platform}`}
                  type="url"
                  placeholder={`https://www.${row.platform}.com/…`}
                  value={row.url}
                  onChange={(e) =>
                    setSocial((s) =>
                      s.map((r, i) =>
                        i === index ? { ...r, url: e.target.value } : r,
                      ),
                    )
                  }
                  disabled={isPending}
                />
              </Field>
            </div>
          ))}
        </div>
      </FieldSet>

      <Field>
        <Button onClick={save} disabled={isPending} size="lg" className="w-fit">
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              Salvataggio…
            </>
          ) : (
            "Salva impostazioni"
          )}
        </Button>
      </Field>
    </FieldGroup>
  );
}
