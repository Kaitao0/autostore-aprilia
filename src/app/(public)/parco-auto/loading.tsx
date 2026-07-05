import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16"
      aria-busy="true"
      aria-label="Caricamento parco auto"
    >
      <div className="mb-10 flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="mb-8 h-48 w-full rounded-xl" />
      <Skeleton className="mb-6 h-4 w-24" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-0">
            <Skeleton className="aspect-[16/10] w-full rounded-t-xl rounded-b-none" />
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
