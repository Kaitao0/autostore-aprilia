import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/features/auth/guards";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AutoscoutSnippetForm } from "./autoscout-snippet-form";

export const metadata: Metadata = {
  title: "Integrazioni",
};

export default async function AdminIntegrationsPage() {
  const { supabase, isSuperAdmin } = await requireStaff();
  if (!isSuperAdmin) redirect("/admin");

  const { data: autoscout } = await supabase
    .from("autoscout_settings")
    .select("status, embed_snippet, feed_url, last_import_at")
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              AutoScout24 — widget (gratuito)
              {embedConfigured ? (
                <Badge>Configurato</Badge>
              ) : (
                <Badge variant="secondary">Non configurato</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Snippet Carportal di sola visualizzazione, canale secondario:
              la fonte di verità del catalogo resta Supabase. Con lo snippet
              attivo, la sezione “Anche su AutoScout24” compare in home e in
              /contatti (previo consenso cookie del visitatore).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutoscoutSnippetForm
              currentSnippet={autoscout?.embed_snippet ?? null}
            />
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
              le credenziali del feed. In alternativa è disponibile
              l&apos;import CSV manuale da “Veicoli → Importa CSV”.
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
            {process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL ? (
              <Badge className="w-fit">Configurato</Badge>
            ) : (
              <Badge variant="secondary" className="w-fit">
                Non configurato
              </Badge>
            )}
            <p className="text-muted-foreground text-sm">
              {process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
                ? "RESEND_API_KEY e mittente presenti: le notifiche vengono inviate e registrate."
                : "Servono RESEND_API_KEY e RESEND_FROM_EMAIL (mittente su dominio verificato). I form salvano comunque i dati e lo dichiarano."}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
