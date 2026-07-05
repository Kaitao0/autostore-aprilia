# Changelog — AUTOSTORE S.R.L.

Tutte le modifiche rilevanti del progetto, organizzate per fase.

## [Fase 1 — completata] Fondamenta: DB, auth, admin, sito pubblico — 2026-07-05

### Blocco A — Scaffold
- Next.js 15.5 (App Router, RSC, Server Actions) + TypeScript strict + Tailwind CSS v4.
- 41 componenti shadcn/ui (base radix, stile nova) vendorizzati in `src/components/ui`
  dai sorgenti ufficiali `shadcn-ui/ui` (la rete dell'ambiente blocca ui.shadcn.com;
  trasformazioni CLI replicate: alias import + IconPlaceholder→lucide).
- Design token brand in `globals.css`: nero #080808, superfici #101010/#191919/#282828,
  accento #F97316, testo #F7F7F5/#B8B8B8, radius 10px, motion tokens, prefers-reduced-motion.
- Space Grotesk (titoli) + Inter (testo) via next/font. `.env.example` completo.

### Blocco B — Database (migration scritte, NON ancora applicate)
- `supabase/migrations/` in ordine vincolante: ENUM → 13 tabelle + indici →
  `has_role`/`is_staff`/`trade_in_request_exists` SECURITY DEFINER → RLS su OGNI tabella →
  view `public_vehicles` (security_invoker, esclude targa/VIN/note interne) →
  bucket storage con policy → trigger (updated_at, handle_new_user, published_at/sold_at,
  redirect 301 su cambio slug, cronologia stati, audit log) → seed.
- Seed: dati reali AUTOSTORE (P.IVA, PEC, REA, SDI, indirizzo) + placeholder `[INSERIRE …]`,
  sezioni contenuto editabili, recensioni marcate DEMO, 6 veicoli demo `is_demo=true`
  con cover locali generate (nessun URL remoto instabile).
- Tipi Database scritti a mano allineati allo schema; client @supabase/ssr
  (browser, server con RLS, admin service-role solo server, helper middleware).

### Blocco C — Auth e area admin
- Middleware su `/admin/*`: refresh sessione + verifica ruolo `is_staff` via RPC,
  stati espliciti unauthenticated/session_expired/unauthorized/not_configured,
  `X-Robots-Tag: noindex`, rendering sempre dinamico.
- Login con banner di stato; guardie server-side (defense in depth) in ogni pagina/azione.
- Dashboard: contatori (totali/pubblicati/bozze/riservati/venduti/in evidenza),
  lead nuovi, stato AutoScout24, attività recenti da audit_logs.
- Gestione veicoli: tabella con ricerca/filtri/ordinamento/paginazione, selezione multipla
  con azioni bulk (pubblica con validazione, rimuovi, elimina), azioni rapide per riga
  (anteprima, duplica, featured, cambio disponibilità, elimina con conferma e pulizia storage).
- «Elimina dati demo» in un click (criterio di accettazione).
- Form veicolo a 10 tab con schema zod condiviso client+server, validazione BLOCCANTE
  per la pubblicazione (prezzo o prezzo su richiesta, anno, km, alimentazione,
  cover, descrizione ≥60), indicatore modifiche non salvate, pallini errore per tab.
- Stub onesti Fase 2/3 per lead/permute/impostazioni/integrazioni (nessun bottone finto).

### Blocco D — Sito pubblico
- Layout: header sticky con logo wordmark ([INSERIRE LOGO]), nav mobile accessibile,
  telefono/WhatsApp solo se configurati (i placeholder non diventano mai link),
  skip link, footer con dati legali reali e link admin discreto; JSON-LD AutoDealer.
- Home: hero tipografico da content_sections, ricerca rapida (marca/modello/prezzo/
  alimentazione/cambio/anno/km) in GET verso il catalogo, auto in evidenza,
  perché-Autostore e servizi da DB, CTA permuta, recensioni segnaposto marcate DEMO,
  dove siamo con orari e link Google Maps (mappa embedded rimandata al consenso cookie).
- `/parco-auto`: filtri completi in querystring condivisibile (server-side via
  searchParams), 6 ordinamenti, paginazione, stati vuoto/no-risultati/errore, skeleton.
- `/auto/[slug]`: scheda RSC con dati tecnici completi, dotazioni, pannello prezzo
  sticky, CTA (chiama/WhatsApp/email + AutoScout24 se presente), barra CTA fissa
  mobile (≤3 azioni, ≥48px), veicoli simili, ultimo aggiornamento, redirect 301
  da slug storici, JSON-LD Car+Breadcrumb, `generateMetadata` con OG dinamica
  `/api/og/[slug]` (next/og, layout brand).
- `sitemap.xml` (solo veicoli pubblicati) e `robots.txt` (admin escluso, /api/og
  lasciato accessibile ai crawler social); pagine istituzionali; privacy/cookie
  in attesa di testo legale validato; 404 curata.

### Audit di fine fase
- **Build + lint**: verdi (next build pulito, eslint 0 errori, tsc strict 0 errori).
- **Accessibilità**: scansione axe-core (WCAG 2.1 A/AA + best practice) su 9 pagine
  → 0 violazioni dopo fix (struttura lista in /vendi-permuta). Touch target mobile ≥44px,
  focus visibile ovunque, heading senza duplicati.
- **Design audit (15 euristiche)**: aggiunti skeleton `loading.tsx` (catalogo, scheda,
  admin), corretti heading duplicati e touch target; corretto hydration-mismatch
  del reveal per utenti prefers-reduced-motion + fallback `<noscript>`.
- **Code review sul diff**: 7 finding → 5 corretti (policy RLS anon per immagini
  permuta non funzionanti, robots che bloccava le immagini OG, path traversal nella
  route OG, ricerca admin con parentesi, messaggi zod in inglese); 2 minori rimandati
  (conteggio lead senza stato errore in dashboard; 3 RPC ruolo per richiesta admin).

### Bloccato / in attesa (dipendenze esterne)
- **Credenziali Supabase** (nuovo progetto, scelta confermata): Project URL, anon key,
  service_role key → poi applicazione migration + creazione utenti admin.
- Snippet embed AutoScout24 (Carportal) — non configurato (stato esplicito in UI).
- Feed AutoScout24 a pagamento — non attivo (Fase 4 bloccata).
- `RESEND_API_KEY` — non configurata (i form Fase 2 salveranno comunque su DB).
- Dominio `autostoreaprilia.com` — non collegato.
- Telefono, WhatsApp, orari, social, logo, testi legali — `[INSERIRE …]`.

### Note per la Fase 2
- Image manager (upload multiplo, riordino, cover, alt) su bucket `vehicle-images`.
- LeadForm con Server Action (zod + honeypot + rate limit) + notifiche Resend.
- Form /vendi-permuta con upload su bucket privato.
- Gestione lead/permute in admin; impostazioni aziendali editabili; SocialSection.

## [Fase 0 — completata] Setup skill Claude Code — 2026-07-04

### Aggiunto
- Skill `frontend-design` (Anthropic ufficiale, da `anthropics/skills`) in `.claude/skills/frontend-design/`.
- Skill `ui-ux-pro-max` (da `nextlevelbuilder/ui-ux-pro-max-skill`) in `.claude/skills/ui-ux-pro-max/` — include database CSV locali di linee guida (stili, palette, tipografia, motion, stack Next.js/shadcn) e script Python di sola ricerca locale (verificati: nessuna rete, nessun subprocess).
- Skill `shadcn` (da `shadcn/ui`) in `.claude/skills/shadcn/` — gestione componenti, registry, regole forms/styling/composition.
- Skill `frontend-a11y` (da `mikemai2awesome/agent-skills`) in `.claude/skills/frontend-a11y/` — riferimenti WCAG, ARIA, pattern React.
- Plugin `frontend-design-audit` (da `mistyhx/frontend-design-audit`) registrato in `.claude/settings.json` via marketplace: skill di audit su 15 euristiche di usabilità + comandi `/frontend-design-audit:evaluate`, `:improve`, `:quick`.
- `CLAUDE.md` con regole vincolanti di utilizzo skill e regole di progetto.
- `skills-lock.json` generato dalla CLI `skills` per aggiornamenti riproducibili.

### Note di sicurezza
- Tutte le skill installate con `--copy` (file reali nel repo, nessun symlink).
- Script Python di `ui-ux-pro-max` ispezionati prima dell'uso: solo stdlib, ricerca locale su CSV, scrittura file solo su richiesta esplicita. Nessun `curl | bash` eseguito.
