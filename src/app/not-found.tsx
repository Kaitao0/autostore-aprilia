import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <SearchX className="text-muted-foreground size-10" aria-hidden />
      <div className="max-w-md">
        <p className="text-muted-foreground mb-3 flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.18em] uppercase">
          <span aria-hidden className="bg-primary h-0.5 w-8" />
          Errore 404
          <span aria-hidden className="bg-primary h-0.5 w-8" />
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Pagina non trovata
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          La pagina che cerchi non esiste o è stata spostata. Se cercavi
          un&apos;auto, potrebbe essere stata venduta: nel parco auto trovi
          tutte le vetture disponibili.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/parco-auto">Vai al parco auto</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Torna alla home</Link>
        </Button>
      </div>
    </main>
  );
}
