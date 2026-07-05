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

/** GET form: lands on /parco-auto with shareable querystring filters. */
export function QuickSearch({ makes }: { makes: string[] }) {
  return (
    <form
      action="/parco-auto"
      method="get"
      aria-label="Ricerca rapida nel parco auto"
      className="bg-surface-1/80 grid grid-cols-2 items-end gap-3 rounded-xl border p-4 backdrop-blur-sm md:grid-cols-3 md:p-5 lg:grid-cols-6"
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
      <Button type="submit" className="col-span-2 md:col-span-1">
        <Search data-icon="inline-start" />
        Cerca
      </Button>
    </form>
  );
}
