"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  checkExistingExternalIdsAction,
  importVehiclesAction,
  type ImportRowResult,
} from "@/features/vehicles/import-actions";
import {
  buildImportRow,
  HEADER_GUESSES,
  IMPORT_FIELDS,
  MAX_IMPORT_ROWS,
  type ImportRow,
} from "@/features/vehicles/import-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Step = "upload" | "map" | "review" | "done";

type ParsedCsv = {
  headers: string[];
  records: Record<string, string>[];
  fileName: string;
};

type ReviewedRow = {
  index: number;
  row: ImportRow;
  errors: string[];
  exists: boolean;
};

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<
    Partial<Record<keyof ImportRow, string>>
  >({});
  const [reviewed, setReviewed] = useState<ReviewedRow[]>([]);
  const [existingMode, setExistingMode] = useState<"update" | "skip">(
    "update",
  );
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ImportRowResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 1: upload + parse ─────────────────────────────────────
  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (parsed) => {
        const headers = (parsed.meta.fields ?? []).filter(Boolean);
        if (headers.length === 0 || parsed.data.length === 0) {
          toast.error("CSV vuoto o senza riga di intestazione");
          return;
        }
        if (parsed.data.length > MAX_IMPORT_ROWS) {
          toast.error(
            `Il file ha ${parsed.data.length} righe: il massimo per import è ${MAX_IMPORT_ROWS}. Dividilo in più file.`,
          );
          return;
        }
        // Auto-guess the mapping from the header names.
        const guessed: Partial<Record<keyof ImportRow, string>> = {};
        for (const field of IMPORT_FIELDS) {
          const candidates = HEADER_GUESSES[field.key];
          const hit = headers.find((h) =>
            candidates.includes(h.trim().toLowerCase().replace(/\s+/g, "_")),
          );
          if (hit) guessed[field.key] = hit;
        }
        setCsv({ headers, records: parsed.data, fileName: file.name });
        setMapping(guessed);
        setStep("map");
      },
      error: () => toast.error("Impossibile leggere il file CSV"),
    });
  }

  // ── Step 2 → 3: build rows, validate, dedup check ──────────────
  async function runReview() {
    if (!csv) return;
    if (!mapping.make || !mapping.model) {
      toast.error("Associa almeno le colonne Marca e Modello");
      return;
    }
    setBusy(true);
    try {
      const rows = csv.records.map((record, index) => {
        const { row, errors } = buildImportRow(record, mapping);
        return { index, row, errors, exists: false };
      });
      const externalIds = rows
        .map((r) => r.row.external_id)
        .filter((v): v is string => Boolean(v));
      let existingMap: Record<string, { id: string; label: string }> = {};
      if (externalIds.length > 0) {
        const res = await checkExistingExternalIdsAction(externalIds);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        existingMap = res.data ?? {};
      }
      for (const r of rows) {
        r.exists = Boolean(r.row.external_id && existingMap[r.row.external_id]);
      }
      setReviewed(rows);
      setStep("review");
    } finally {
      setBusy(false);
    }
  }

  const counts = useMemo(() => {
    const valid = reviewed.filter((r) => r.errors.length === 0);
    return {
      total: reviewed.length,
      errors: reviewed.length - valid.length,
      toCreate: valid.filter((r) => !r.exists).length,
      existing: valid.filter((r) => r.exists).length,
    };
  }, [reviewed]);

  // ── Step 3 → 4: import ─────────────────────────────────────────
  async function runImport() {
    const valid = reviewed.filter((r) => r.errors.length === 0);
    if (valid.length === 0) {
      toast.error("Nessuna riga valida da importare");
      return;
    }
    setBusy(true);
    try {
      const res = await importVehiclesAction(
        valid.map(({ index, row }) => ({ index, row })),
        existingMode,
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResults(res.data?.results ?? []);
      setStep("done");
    } finally {
      setBusy(false);
    }
  }

  // Error report (validation + server errors) as downloadable CSV.
  function downloadReport() {
    const lines: string[][] = [["riga", "problema"]];
    for (const r of reviewed.filter((r) => r.errors.length > 0)) {
      lines.push([String(r.index + 2), r.errors.join("; ")]);
    }
    for (const r of results.filter((r) => r.action === "error")) {
      lines.push([String(r.index + 2), r.error ?? "errore"]);
    }
    const csvText = Papa.unparse(lines);
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report-errori-import.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const doneCounts = useMemo(
    () => ({
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
      errors:
        results.filter((r) => r.action === "error").length + counts.errors,
    }),
    [results, counts.errors],
  );

  return (
    <div className="flex flex-col gap-6">
      <ol
        className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium tracking-wide uppercase"
        aria-label="Passi dell'import"
      >
        {(
          [
            ["upload", "1. File"],
            ["map", "2. Colonne"],
            ["review", "3. Verifica"],
            ["done", "4. Risultato"],
          ] as Array<[Step, string]>
        ).map(([s, label]) => (
          <li
            key={s}
            aria-current={step === s ? "step" : undefined}
            className={step === s ? "text-primary" : undefined}
          >
            {label}
          </li>
        ))}
      </ol>

      {/* ── Step 1 ── */}
      {step === "upload" ? (
        <div className="flex max-w-xl flex-col gap-4">
          <Alert>
            <FileSpreadsheet />
            <AlertTitle>Come funziona</AlertTitle>
            <AlertDescription>
              Carichi un CSV con intestazioni, associ le colonne, controlli
              l&apos;anteprima con il conteggio crea/aggiorna/salta e importi.
              Tutti i veicoli nuovi entrano come BOZZA: niente va online da
              solo. Il codice esterno evita i doppi inserimenti.
            </AlertDescription>
          </Alert>
          <Button
            size="lg"
            className="w-fit"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload data-icon="inline-start" />
            Scegli il file CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="File CSV da importare"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : null}

      {/* ── Step 2 ── */}
      {step === "map" && csv ? (
        <div className="flex flex-col gap-6">
          <p className="text-sm">
            <span className="font-medium">{csv.fileName}</span> —{" "}
            {csv.records.length} righe, {csv.headers.length} colonne
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {IMPORT_FIELDS.map((field) => (
              <Field key={field.key}>
                <FieldLabel htmlFor={`map-${field.key}`}>
                  {field.label}
                  {field.required ? " *" : ""}
                </FieldLabel>
                <NativeSelect
                  id={`map-${field.key}`}
                  value={mapping[field.key] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({
                      ...m,
                      [field.key]: e.target.value || undefined,
                    }))
                  }
                >
                  <NativeSelectOption value="">— ignora —</NativeSelectOption>
                  {csv.headers.map((h) => (
                    <NativeSelectOption key={h} value={h}>
                      {h}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {field.hint ? (
                  <FieldDescription>{field.hint}</FieldDescription>
                ) : null}
              </Field>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep("upload")}>
              <ArrowLeft data-icon="inline-start" />
              Cambia file
            </Button>
            <Button onClick={runReview} disabled={busy}>
              {busy ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <ArrowRight data-icon="inline-start" />
              )}
              Verifica le righe
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Step 3 ── */}
      {step === "review" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2" aria-live="polite">
            <Badge>{counts.toCreate} da creare (bozza)</Badge>
            <Badge variant="secondary">
              {counts.existing} già presenti (
              {existingMode === "update" ? "verranno aggiornati" : "saltati"})
            </Badge>
            <Badge variant={counts.errors > 0 ? "destructive" : "outline"}>
              {counts.errors} con errori (saltate)
            </Badge>
          </div>

          {counts.existing > 0 ? (
            <fieldset className="bg-card flex flex-col gap-3 rounded-lg border p-4">
              <legend className="px-1 text-sm font-medium">
                Veicoli già presenti (stesso codice esterno)
              </legend>
              <RadioGroup
                value={existingMode}
                onValueChange={(v) =>
                  setExistingMode(v === "skip" ? "skip" : "update")
                }
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="update" id="mode-update" />
                  <Label htmlFor="mode-update">
                    Aggiorna i dati (stato di pubblicazione e foto restano
                    invariati)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="skip" id="mode-skip" />
                  <Label htmlFor="mode-skip">Salta, non toccarli</Label>
                </div>
              </RadioGroup>
            </fieldset>
          ) : null}

          <div className="max-h-96 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Riga</TableHead>
                  <TableHead>Veicolo</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Esito previsto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewed.slice(0, 60).map((r) => (
                  <TableRow key={r.index}>
                    <TableCell className="tabular-nums">
                      {r.index + 2}
                    </TableCell>
                    <TableCell>
                      {r.row.make} {r.row.model} {r.row.version ?? ""}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.row.price !== null ? `${r.row.price} €` : "—"}
                    </TableCell>
                    <TableCell>
                      {r.errors.length > 0 ? (
                        <Badge variant="destructive">
                          {r.errors.join(", ")}
                        </Badge>
                      ) : r.exists ? (
                        <Badge variant="secondary">
                          {existingMode === "update" ? "aggiorna" : "salta"}
                        </Badge>
                      ) : (
                        <Badge>crea bozza</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {reviewed.length > 60 ? (
              <p className="text-muted-foreground p-3 text-xs">
                …e altre {reviewed.length - 60} righe (incluse nell&apos;import)
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep("map")}>
              <ArrowLeft data-icon="inline-start" />
              Torna alla mappatura
            </Button>
            {counts.errors > 0 ? (
              <Button variant="outline" onClick={downloadReport}>
                <Download data-icon="inline-start" />
                Scarica report errori
              </Button>
            ) : null}
            <Button
              onClick={runImport}
              disabled={busy || counts.toCreate + counts.existing === 0}
            >
              {busy ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Import in corso…
                </>
              ) : (
                `Importa ${counts.toCreate + (existingMode === "update" ? counts.existing : 0)} veicoli`
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Step 4 ── */}
      {step === "done" ? (
        <div className="flex max-w-xl flex-col gap-4" aria-live="polite">
          <Alert>
            <FileSpreadsheet />
            <AlertTitle>Import completato</AlertTitle>
            <AlertDescription>
              {doneCounts.created} creati come bozza · {doneCounts.updated}{" "}
              aggiornati · {doneCounts.skipped} saltati · {doneCounts.errors}{" "}
              errori. I veicoli creati NON sono pubblicati: completali (foto,
              descrizione) e pubblicali dalla lista.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2">
            {doneCounts.errors > 0 ? (
              <Button variant="outline" onClick={downloadReport}>
                <Download data-icon="inline-start" />
                Scarica report errori
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/admin/veicoli?published=false">
                Vai alle bozze importate
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
