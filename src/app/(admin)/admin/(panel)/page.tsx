import type { Metadata } from "next";
import Link from "next/link";
import { CircleOff, Plus } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/features/vehicles/admin-queries";
import { formatDateTime } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Dashboard",
};

const actionLabels: Record<string, string> = {
  "vehicle.created": "Veicolo creato",
  "vehicle.updated": "Veicolo aggiornato",
  "vehicle.deleted": "Veicolo eliminato",
  "vehicle.published": "Veicolo pubblicato",
  "vehicle.unpublished": "Veicolo rimosso dal sito",
  "vehicle.price_changed": "Prezzo aggiornato",
  "vehicle.status_changed": "Disponibilità aggiornata",
  "user_role.granted": "Ruolo assegnato",
  "user_role.revoked": "Ruolo revocato",
};

export default async function AdminDashboardPage() {
  const { supabase, isSuperAdmin } = await requireStaff();

  let stats: DashboardStats | null = null;
  let statsError: string | null = null;
  try {
    stats = await getDashboardStats(supabase, isSuperAdmin);
  } catch (e) {
    statsError = e instanceof Error ? e.message : "Errore imprevisto";
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Stato del parco auto e attività recenti.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/veicoli/nuovo">
            <Plus data-icon="inline-start" />
            Nuovo veicolo
          </Link>
        </Button>
      </div>

      {statsError ? (
        <Alert variant="destructive" role="alert">
          <CircleOff />
          <AlertTitle>Impossibile caricare i dati</AlertTitle>
          <AlertDescription>
            {statsError}. Verifica la connessione a Supabase e che le migration
            siano state applicate.
          </AlertDescription>
        </Alert>
      ) : null}

      {stats ? (
        <>
          <section aria-label="Contatori veicoli">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <StatTile label="Veicoli totali" value={stats.total} />
              <StatTile label="Pubblicati" value={stats.published} />
              <StatTile label="Bozze" value={stats.drafts} />
              <StatTile label="Riservati" value={stats.reserved} />
              <StatTile label="Venduti" value={stats.sold} />
              <StatTile label="In evidenza" value={stats.featured} />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Lead da gestire</CardTitle>
                <CardDescription>Richieste con stato “nuovo”</CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-2">
                <p className="font-heading text-4xl font-bold tracking-tight tabular-nums">
                  {stats.newLeads}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/lead">Vai ai lead</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AutoScout24</CardTitle>
                <CardDescription>Canale secondario (widget)</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                {stats.autoscoutStatus === "configured" ? (
                  <Badge>Configurato</Badge>
                ) : (
                  <Badge variant="secondary">Non configurato</Badge>
                )}
                {isSuperAdmin ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/integrazioni">Configura</Link>
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Gestito dal super admin
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dati demo</CardTitle>
                <CardDescription>
                  Veicoli dimostrativi nel catalogo
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-2">
                <p className="font-heading text-4xl font-bold tracking-tight tabular-nums">
                  {stats.demo}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/veicoli?demo=true">Gestisci</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attività recenti</CardTitle>
              <CardDescription>Dal registro audit</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CircleOff />
                    </EmptyMedia>
                    <EmptyTitle>Nessuna attività registrata</EmptyTitle>
                    <EmptyDescription>
                      Le modifiche a veicoli e utenti compariranno qui.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="flex flex-col gap-1">
                  {stats.recentActivity.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-baseline justify-between gap-4 border-b py-2 text-sm last:border-b-0"
                    >
                      <span>
                        {actionLabels[entry.action] ?? entry.action}
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
            </CardContent>
          </Card>
        </>
      ) : null}
    </>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
