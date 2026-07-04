# Changelog — AUTOSTORE S.R.L.

Tutte le modifiche rilevanti del progetto, organizzate per fase.

## [Fase 0 — in corso] Setup skill Claude Code — 2026-07-04

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

### Da fare (resto Fase 0 — in attesa di via)
- Scaffold Next.js 15 + TypeScript strict + Tailwind + shadcn/ui.
- Design token brand (tema scuro, accento arancione #F97316, Space Grotesk + Inter via next/font).
- `.env.example` + connessione Supabase.
- **DECISIONE APERTA**: riuso del progetto Supabase esistente (Lovable) con introspezione schema, oppure progetto nuovo con migration da zero.

### Dipendenze esterne aperte
- Snippet embed AutoScout24 (Carportal) — non configurato.
- Feed AutoScout24 a pagamento — non attivo (Fase 4, bloccata).
- `RESEND_API_KEY` — non configurata.
- Dominio produzione `autostoreaprilia.com` — non collegato.
- Telefono, WhatsApp, orari, social, logo — `[INSERIRE ...]`.
