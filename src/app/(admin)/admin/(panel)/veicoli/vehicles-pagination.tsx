import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function pageHref(
  searchParams: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

/** Compact page list: 1 … around current … last. */
function visiblePages(page: number, totalPages: number): Array<number | "…"> {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export function VehiclesPagination({
  page,
  totalPages,
  searchParams,
  ariaLabel = "Paginazione veicoli",
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  ariaLabel?: string;
}) {
  return (
    <Pagination aria-label={ariaLabel}>
      <PaginationContent>
        {page > 1 ? (
          <PaginationItem>
            <PaginationPrevious href={pageHref(searchParams, page - 1)} />
          </PaginationItem>
        ) : null}
        {visiblePages(page, totalPages).map((p, i) =>
          p === "…" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href={pageHref(searchParams, p)}
                isActive={p === page}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        {page < totalPages ? (
          <PaginationItem>
            <PaginationNext href={pageHref(searchParams, page + 1)} />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}
