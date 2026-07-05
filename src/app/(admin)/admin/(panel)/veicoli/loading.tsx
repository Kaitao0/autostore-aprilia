import { Skeleton } from "@/components/ui/skeleton";

export default function AdminVehiclesLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Caricamento veicoli">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
