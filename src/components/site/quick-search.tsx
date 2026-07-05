import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { enumOptions, fuelTypeLabels, transmissionLabels } from "@/lib/labels";

const priceOptions = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
const kmOptions = [30000, 50000, 80000, 100000, 130000, 160000, 200000];
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 15 }, (_, i) => currentYear - i);

/** GET form: lands on /parco-auto with shareable querystring filters. */
export function QuickSearch({ makes }: { makes: string[] }) {
  return (
    <form
      action="/parco-auto"
      method="get"
      aria-label="Ricerca rapida nel parco auto"
      className="bg-surface-1/80 grid grid-cols-2 items-end gap-3 rounded-xl border p-4 backdrop-blur-sm md:grid-cols-4 md:p-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qs-make">Marca</Label>
        <NativeSelect id="qs-make" name="marca" defaultValue="">
          <NativeSelectOption value="">Tutte</NativeSelectOption>
          {makes.map((make) => (
            <NativeSelectOption key={make} value={make}>
              {make}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qs-model">Modello</Label>
        <Input id="qs-model" name="modello" placeholder="Es. Golf" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qs-price">Prezzo fino a</Label>
        <NativeSelect id="qs-price" name="prezzo_max" defaultValue="">
          <NativeSelectOption value="">Qualsiasi</NativeSelectOption>
          {priceOptions.map((price) => (
            <NativeSelectOption key={price} value={String(price)}>
              {price.toLocaleString("it-IT")} €
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qs-fuel">Alimentazione</Label>
        <NativeSelect id="qs-fuel" name="alimentazione" defaultValue="">
          <NativeSelectOption value="">Tutte</NativeSelectOption>
          {enumOptions(fuelTypeLabels).map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qs-gearbox">Cambio</Label>
        <NativeSelect id="qs-gearbox" name="cambio" defaultValue="">
          <NativeSelectOption value="">Tutti</NativeSelectOption>
          {enumOptions(transmissionLabels).map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qs-year">Anno da</Label>
        <NativeSelect id="qs-year" name="anno_min" defaultValue="">
          <NativeSelectOption value="">Qualsiasi</NativeSelectOption>
          {yearOptions.map((year) => (
            <NativeSelectOption key={year} value={String(year)}>
              {year}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qs-km">Km fino a</Label>
        <NativeSelect id="qs-km" name="km_max" defaultValue="">
          <NativeSelectOption value="">Qualsiasi</NativeSelectOption>
          {kmOptions.map((km) => (
            <NativeSelectOption key={km} value={String(km)}>
              {km.toLocaleString("it-IT")} km
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" className="col-span-2 md:col-span-1">
        <Search data-icon="inline-start" />
        Cerca
      </Button>
    </form>
  );
}
