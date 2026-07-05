import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import {
  getAdminLeads,
  LEADS_PER_PAGE,
  type AdminLeadFilters,
} from "@/features/leads/admin";
import {
  enumOptions,
  leadStatusLabels,
  leadTypeLabels,
} from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import type { LeadStatus, LeadType } from "@/lib/types/database";
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
  title: "Lead",
};

function statusVariant(status: LeadStatus) {
  if (status === "nuovo") return "default" as const;
  if (status === "spam" || status === "non_interessato")
    return "destructive" as const;
  return "secondary" as const;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; stato?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireStaff();

  const filters: AdminLeadFilters = {
    type: Object.keys(leadTypeLabels).includes(params.tipo ?? "")
      ? (params.tipo as LeadType)
      : undefined,
    status: Object.keys(leadStatusLabels).includes(params.stato ?? "")
      ? (params.stato as LeadStatus)
      : undefined,
    page: Math.max(1, Number(params.page) || 1),
  };

  let rows: Awaited<ReturnType<typeof getAdminLeads>>["rows"] = [];
  let count = 0;
  let error: string | null = null;
  try {
    const result = await getAdminLeads(supabase, filters);
    rows = result.rows;
    count = result.count;
  } catch (e) {
    error = e instanceof Error ? e.message : "Errore imprevisto";
  }

  const totalPages = Math.max(1, Math.ceil(count / LEADS_PER_PAGE));

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Lead</h1>
        <p className="text-muted-foreground text-sm">
          {count} richieste ricevute dal sito
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3"
        aria-label="Filtri lead"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <NativeSelect id="tipo" name="tipo" defaultValue={filters.type ?? ""}>
            <NativeSelectOption value="">Tutti</NativeSelectOption>
            {enumOptions(leadTypeLabels).map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stato">Stato</Label>
          <NativeSelect
            id="stato"
            name="stato"
            defaultValue={filters.status ?? ""}
          >
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
          Impossibile caricare i lead: {error}
        </p>
      ) : rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>
              {filters.type || filters.status
                ? "Nessun lead con i filtri attivi"
                : "Nessun lead ricevuto"}
            </EmptyTitle>
            <EmptyDescription>
              Le richieste inviate dai form del sito compariranno qui.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contatto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Veicolo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Ricevuto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link
                        href={`/admin/lead/${lead.id}`}
                        className="focus-visible:ring-ring/50 rounded font-medium hover:underline focus-visible:ring-3 focus-visible:outline-none"
                      >
                        {lead.first_name} {lead.last_name ?? ""}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {lead.email}
                        {lead.phone ? ` · ${lead.phone}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>{leadTypeLabels[lead.lead_type]}</TableCell>
                    <TableCell>
                      {lead.vehicle ? (
                        <Link
                          href={`/admin/veicoli/${lead.vehicle.id}`}
                          className="focus-visible:ring-ring/50 rounded hover:underline focus-visible:ring-3 focus-visible:outline-none"
                        >
                          {lead.vehicle.make} {lead.vehicle.model}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(lead.status)}>
                        {leadStatusLabels[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      {formatDateTime(lead.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 ? (
            <PaginationNav
              ariaLabel="Paginazione lead"
              page={filters.page}
              totalPages={totalPages}
              searchParams={{
                tipo: params.tipo,
                stato: params.stato,
              }}
            />
          ) : null}
        </>
      )}
    </>
  );
}
