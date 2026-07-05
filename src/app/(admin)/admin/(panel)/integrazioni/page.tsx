import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleOff, Plug } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import { Badge } from "@/components/ui/badge";
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
  title: "Integrazioni",
};

export default async function AdminIntegrationsPage() {
  const { supabase, isSuperAdmin } = await requireStaff();
  if (!isSuperAdmin) redirect("/admin");

  const { data: autoscout } = await supabase
    .from("autoscout_settings")
    .select("status, embed_snippet, dealer_url, feed_url, last_import_at")
    .eq("id", 1)
    .maybeSingle();

  const embedConfigured = Boolean(autoscout?.embed_snippet);

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Integrazioni
        </h1>
        <p className="text-muted-foreground text-sm">
          Stato dei servizi esterni. Nessuna funzione viene simulata: ciò che
          non è configurato è dichiarato tale.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AutoScout24 — widget (gratuito)</CardTitle>
            <CardDescription>
              Snippet Carportal di sola visualizzazione, canale secondario
              rispetto al catalogo su Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {embedConfigured ? (
              <Badge className="w-fit">Configurato</Badge>
            ) : (
              <Badge variant="secondary" className="w-fit">
                Non configurato
              </Badge>
            )}
            <p className="text-muted-foreground text-sm">
              {embedConfigured
                ? "Lo snippet è attivo e viene caricato sul sito solo previo consenso cookie."
                : "Per attivarlo serve lo snippet embed fornito da AutoScout24. Il campo per incollarlo arriva nella Fase 3; fino ad allora il sito mostra lo stato “non configurato”."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AutoScout24 — feed (a pagamento)</CardTitle>
            <CardDescription>
              Import/export automatico del listino.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              Non attivo
            </Badge>
            <p className="text-muted-foreground text-sm">
              Servizio su richiesta ad AutoScout24 (Fase 4, bloccata). La
              sincronizzazione non verrà costruita finché non saranno fornite
              le credenziali del feed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email transazionali (Resend)</CardTitle>
            <CardDescription>
              Notifiche per lead e richieste di permuta.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {process.env.RESEND_API_KEY ? (
              <Badge className="w-fit">Configurato</Badge>
            ) : (
              <Badge variant="secondary" className="w-fit">
                Non configurato
              </Badge>
            )}
            <p className="text-muted-foreground text-sm">
              {process.env.RESEND_API_KEY
                ? "RESEND_API_KEY presente: le notifiche verranno inviate (Fase 2)."
                : "RESEND_API_KEY assente: i form salvano comunque i dati e mostrano “notifica email non configurata”."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {embedConfigured ? <Plug /> : <CircleOff />}
          </EmptyMedia>
          <EmptyTitle>
            Configurazione integrazioni{" "}
            <Badge variant="secondary">Fase 3</Badge>
          </EmptyTitle>
          <EmptyDescription>
            Il form per incollare lo snippet AS24 e la gestione completa delle
            integrazioni arrivano nella Fase 3.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
