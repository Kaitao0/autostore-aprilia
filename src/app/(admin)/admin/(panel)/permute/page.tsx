import type { Metadata } from "next";
import Link from "next/link";
import { Repeat, Search } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import {
  getAdminTradeIns,
  TRADE_INS_PER_PAGE,
} from "@/features/trade-in/admin";
import { enumOptions, leadStatusLabels } from "@/lib/labels";
import { formatDateTime, formatMileage } from "@/lib/format";
import type { LeadStatus } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { PaginationNav } from "@/components/pagination-nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Permute",
};

export default async function AdminTradeInsPage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireStaff();

  const status = Object.keys(leadStatusLabels).includes(params.stato ?? "")
    ? (params.stato as LeadStatus)
    : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  let rows: Awaited<ReturnType<typeof getAdminTradeIns>>["rows"] = [];
  let count = 0;
  let error: string | null = null;
  try {
    const result = await getAdminTradeIns(supabase, { status, page });
    rows = result.rows;
    count = result.count;
  } catch (e) {
    error = e instanceof Error ? e.message : "Errore imprevisto";
  }

  const totalPages = Math.max(1, Math.ceil(count / TRADE_INS_PER_PAGE));

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Permute
        </h1>
        <p className="text-muted-foreground text-sm">
          {count} richieste di valutazione
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3"
        aria-label="Filtri permute"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stato">Stato</Label>
          <NativeSelect id="stato" name="stato" defaultValue={status ?? ""}>
            <NativeSelectOption value="">Tutti</NativeSelectOption>
            {enumOptions(leadStatusLabels).map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="secondary">
          <Search data-icon="inline-start" />
          Filtra
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          Impossibile caricare le permute: {error}
        </p>
      ) : rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Repeat />
            </EmptyMedia>
            <EmptyTitle>
              {status
                ? "Nessuna richiesta con i filtri attivi"
                : "Nessuna richiesta di valutazione"}
            </EmptyTitle>
            <EmptyDescription>
              Le richieste inviate da /vendi-permuta compariranno qui, con le
              foto caricate dal cliente.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auto proposta</TableHead>
                  <TableHead>Contatto</TableHead>
                  <TableHead>Finanziamento</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Ricevuta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Link
                        href={`/admin/permute/${request.id}`}
                        className="focus-visible:ring-ring/50 rounded font-medium hover:underline focus-visible:ring-3 focus-visible:outline-none"
                      >
                        {request.car_make} {request.car_model}
                      </Link>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {[
                          request.car_year,
                          request.car_mileage !== null
                            ? formatMileage(request.car_mileage)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {request.first_name} {request.last_name ?? ""}
                      <p className="text-muted-foreground text-xs">
                        {request.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      {request.existing_finance ? "In corso" : "No"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.status === "nuovo" ? "default" : "secondary"
                        }
                      >
                        {leadStatusLabels[request.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      {formatDateTime(request.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 ? (
            <PaginationNav
              ariaLabel="Paginazione permute"
              page={page}
              totalPages={totalPages}
              searchParams={{ stato: params.stato }}
            />
          ) : null}
        </>
      )}
    </>
  );
}
