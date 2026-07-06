# Changelog — AUTOSTORE S.R.L.

Tutte le modifiche rilevanti del progetto, organizzate per fase.

## [Fase 3 — completata, in attesa di setup DB] Showroom, consenso, AS24, import CSV — 2026-07-06

### Aggiunto
- **Sistema di consenso cookie**: banner accessibile a due scelte (i cookie
  tecnici sono sempre attivi e dichiarati; la scelta riguarda solo i
  contenuti esterni), persistenza locale, "Preferenze cookie" nel footer
  per cambiare idea, componente ConsentGate con placeholder esplicito e
  attivazione per servizio. Mappa Google su /contatti caricata SOLO previo
  consenso.
- **AutoScout24 (widget)**: iniettore dell'embed che ri-crea i tag script
  (innerHTML non li esegue), sezione "Anche su AutoScout24" in home e
  /contatti — visibile solo se configurata e sempre dietro consenso;
  bottone profilo concessionario da business_information; editor dello
  snippet in /admin/integrazioni (super admin, con disattivazione a un
  click). Feed a pagamento: resta dichiarato "non attivo" (Fase 4).
- **/showroom (tablet)**: filtri touch giganti (marca/alimentazione) con
  aria-pressed, card grandi, dettaglio semplificato con QR alla scheda
  pubblica, reset automatico dopo 90s di inattività, nessun header/footer
  del sito, noindex.
- **/showroom/display (kiosk TV)**: slideshow automatico 9s (featured e
  nuovi arrivi per primi), prezzo gigante, disponibilità, QR, contatti,
  layout portrait+landscape, bottone schermo intero, aggiornamento
  automatico con polling 60s su /api/showroom e badge "offline — ultimo
  stato salvato" quando la rete manca.
- **Import CSV a step** (/admin/veicoli/import): upload → mappatura colonne
  con riconoscimento automatico delle intestazioni italiane → validazione
  per riga con normalizzazione tollerante di alimentazione/cambio/
  carrozzeria/condizione e numeri in formato italiano → dedup via codice
  esterno → riepilogo crea/aggiorna/salta con scelta per gli esistenti →
  import in BOZZA (max 300 righe; gli aggiornamenti non toccano
  pubblicazione, slug o foto) → report errori scaricabile.

### Verifiche e review
- `next build` + lint + tsc strict verdi; axe-core 0 violazioni su
  showroom, display, home e contatti (corretti landmark/heading mancanti
  sulle pagine showroom).
- Review sul diff: corretti un errore di build (costante esportata da un
  modulo "use server"), la corruzione dei prezzi con decimali in formato
  inglese nell'import CSV e i fix di review Fase 2 (honeypot prima della
  validazione, bodySizeLimit 50mb, id lead nel log email).

### Bloccato / invariato
- Migration ancora da applicare (rete ambiente bloccata verso supabase.co):
  seguire docs/SETUP_SUPABASE.md.
- Analytics consent-gated: rimandata alla Fase 4 (nessun provider scelto).
- Restano aperti: snippet AS24 reale, RESEND_API_KEY/RESEND_FROM_EMAIL,
  dominio, telefono/WhatsApp/orari/social/logo, testi legali.

## [Fase 2 — completata, in attesa di setup DB] Lead, permute, immagini, impostazioni — 2026-07-05

### Aggiunto
- **Notifiche email (Resend)**: modulo server-only con esito esplicito
  `not_configured` quando mancano `RESEND_API_KEY`/`RESEND_FROM_EMAIL` o
  l'email aziendale è un placeholder — niente successi simulati; ogni
  tentativo registrato in `email_notifications`.
- **LeadForm** (zod + honeypot + rate limit per IP, 5/10min): sulla scheda
  veicolo (info/visita/test drive/permuta/finanziamento, veicolo e pagina
  agganciati automaticamente) e su /contatti in modalità generica; CTA
  della scheda e barra mobile ancorate al form.
- **Form /vendi-permuta completo**: dati persona + auto, targa opzionale,
  flag finanziamento in corso, fino a 6 foto (≤8MB, tipo verificato)
  caricate sul bucket PRIVATO `trade-in-images`; id richiesta generato
  server-side (la RLS anon non può rileggere le righe); rate limit 3/10min.
- **Admin lead**: lista filtrabile (tipo/stato) con veicolo collegato,
  dettaglio con azioni rapide tel/WhatsApp/mailto, cambio stato e note
  interne.
- **Admin permute**: lista + dettaglio con dati vettura, foto del cliente
  via URL firmati (1h) dal bucket privato, gestione stato.
- **Image manager** (tab Immagini del form veicolo, in modifica):
  drag&drop multiplo con progress per file, compressione client-side in
  WebP max 1920px prima dell'upload, riordino accessibile (su/giù), scelta
  copertina sincronizzata con `vehicles.cover_image_url`, alt text, elimina
  con conferma e pulizia storage; prima foto = copertina automatica.
  Upload con la sessione staff (policy RLS storage), niente service key.
- **Galleria pubblica** su /auto/[slug]: immagine principale + miniature +
  fullscreen con prev/next e contatore; fallback alla cover URL.
- **Impostazioni aziendali editabili** (super admin): contatti, sede,
  orari, social (solo profili attivi con URL https compaiono nel footer),
  URL profilo AutoScout24. Dati societari (P.IVA/REA/SDI/PEC) fissi.
- **SocialSection** in home da `content_sections.featured_reels`: card con
  link esterni, niente script di embed di default (consent-gated in Fase 3);
  nascosta se vuota.
- `docs/SETUP_SUPABASE.md` + `supabase/apply_all.sql` (bundle unico da
  incollare nel SQL Editor) e `.env.local` locale (git-ignorato).

### Verifiche
- `next build` + lint + tsc strict: verdi su ogni commit.
- Pass axe-core sulle pagine con i nuovi form (/, /contatti,
  /vendi-permuta): 0 violazioni WCAG 2.1 A/AA.
- Nota: /code-review formale sul diff Fase 2 e screenshot-audit rimandati
  all'inizio della prossima sessione (fermata richiesta per limiti di
  utilizzo).

### ⚠️ Bloccato / azioni richieste al cliente
- **La rete dell'ambiente di sviluppo remoto blocca `*.supabase.co`**: le
  migration NON sono state applicate. Seguire `docs/SETUP_SUPABASE.md`
  (3 passi: incollare `supabase/apply_all.sql` nel SQL Editor, creare il
  primo utente, assegnare `super_admin`). In alternativa, abilitare
  l'accesso a supabase.co nella network policy dell'ambiente Claude Code.
- Le chiavi fornite sono in `.env.local` (mai committato). La
  `service_role` è stata condivisa in chat: valutare la rigenerazione da
  Settings → API dopo il go-live.
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (dominio mittente verificato) per
  attivare le notifiche email.
- Restano aperti: snippet AS24, telefono/WhatsApp/orari/social/logo
  (ora modificabili da /admin/impostazioni), testi legali validati.

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
