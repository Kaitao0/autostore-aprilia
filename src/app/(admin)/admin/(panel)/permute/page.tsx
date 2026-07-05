import type { Metadata } from "next";
import { Repeat } from "lucide-react";
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
  title: "Permute",
};

export default async function AdminTradeInsPage() {
  const { supabase } = await requireStaff();

  const { count } = await supabase
    .from("trade_in_requests")
    .select("id", { count: "exact", head: true });

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Permute
        </h1>
        <p className="text-muted-foreground text-sm">
          {count ?? 0} richieste di valutazione ricevute
        </p>
      </div>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Repeat />
          </EmptyMedia>
          <EmptyTitle>
            Gestione permute in preparazione{" "}
            <Badge variant="secondary">Fase 2</Badge>
          </EmptyTitle>
          <EmptyDescription>
            Le richieste inviate da /vendi-permuta vengono già salvate su
            Supabase (incluse le foto, su bucket privato). Il dettaglio con
            gallery e cambio stato arriva nella Fase 2.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
