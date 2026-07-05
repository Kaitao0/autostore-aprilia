import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { requireStaff } from "@/features/auth/guards";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Lead",
};

export default async function AdminLeadsPage() {
  const { supabase } = await requireStaff();

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true });

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Lead
        </h1>
        <p className="text-muted-foreground text-sm">
          {count ?? 0} richieste ricevute
        </p>
      </div>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>
            Gestione lead in preparazione <Badge variant="secondary">Fase 2</Badge>
          </EmptyTitle>
          <EmptyDescription>
            I lead raccolti dai form del sito sono già salvati in modo sicuro
            su Supabase. La lista con filtri, dettaglio e cambio stato arriva
            nella Fase 2.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
