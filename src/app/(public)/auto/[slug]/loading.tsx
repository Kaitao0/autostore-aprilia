import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12"
      aria-busy="true"
      aria-label="Caricamento scheda veicolo"
    >
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-8">
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border p-6">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
