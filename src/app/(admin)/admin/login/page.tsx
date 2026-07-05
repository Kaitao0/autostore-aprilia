import type { Metadata } from "next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert, Info } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Accesso area riservata",
};

const reasonMessages: Record<
  string,
  { title: string; description: string; tone: "info" | "warning" }
> = {
  session_expired: {
    title: "Sessione scaduta",
    description: "Accedi di nuovo per continuare.",
    tone: "info",
  },
  unauthenticated: {
    title: "Accesso richiesto",
    description: "Quest'area è riservata al personale di Autostore.",
    tone: "info",
  },
  unauthorized: {
    title: "Permessi insufficienti",
    description:
      "L'account non è abilitato all'area amministrativa. Contatta un amministratore.",
    tone: "warning",
  },
  not_configured: {
    title: "Supabase non configurato",
    description:
      "Le variabili d'ambiente del database non sono impostate. Configura .env.local per abilitare l'accesso.",
    tone: "warning",
  },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const { reason, next } = await searchParams;
  const message = reason ? reasonMessages[reason] : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-heading text-2xl font-bold tracking-tight">
            Autostore
          </p>
          <h1 className="text-muted-foreground mt-1 text-sm">
            Area amministrativa
          </h1>
        </div>

        {message ? (
          <Alert
            variant="default"
            className="mb-6"
            role="status"
            aria-live="polite"
          >
            {message.tone === "warning" ? <TriangleAlert /> : <Info />}
            <AlertTitle>{message.title}</AlertTitle>
            <AlertDescription>{message.description}</AlertDescription>
          </Alert>
        ) : null}

        <LoginForm next={next} disabled={reason === "not_configured"} />
      </div>
    </main>
  );
}
