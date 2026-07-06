import type { Metadata } from "next";
import { requireStaff } from "@/features/auth/guards";
import { ImportWizard } from "./import-wizard";

export const metadata: Metadata = {
  title: "Import CSV",
};

export default async function ImportPage() {
  await requireStaff();

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Import CSV
        </h1>
        <p className="text-muted-foreground text-sm">
          Ponte anti-doppio-inserimento: carica, mappa le colonne, verifica e
          importa in bozza.
        </p>
      </div>
      <ImportWizard />
    </>
  );
}
