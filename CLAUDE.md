# AUTOSTORE S.R.L. — Piattaforma concessionario (Aprilia, LT)

Rebuild custom in Next.js 15 (App Router, RSC, Server Actions) + TypeScript strict + Tailwind CSS + shadcn/ui + Supabase (Postgres, Auth via @supabase/ssr, Storage, RLS). UI in italiano; codice, tabelle e variabili in inglese.

## Skill usage (binding)

| Task | Skills to load BEFORE writing code |
|---|---|
| Any UI work (layout, components, pages) | `frontend-design` + `ui-ux-pro-max` |
| Base components (generate/customize) | `shadcn` |
| End of every phase — UX audit | `frontend-design-audit` plugin (`/frontend-design-audit:evaluate`) on the pages built in the phase |
| End of every phase — accessibility | `frontend-a11y` pass; fix findings before declaring the phase complete |
| End of every phase — code quality | `/code-review` on the phase diff |

The `frontend-design-audit` plugin is enabled via `.claude/settings.json` (marketplace: `mistyhx/frontend-design-audit`). The other skills live in `.claude/skills/`.

## Non-negotiable rules

- Never invent business data (phone, WhatsApp, hours, social, reviews, warranties, financing). Use placeholders formatted `[INSERIRE ...]`. Business data comes ONLY from `business_information` / `site_settings`.
- Vehicle catalog lives ONLY in Supabase — no hardcoded vehicle arrays, no static vehicle pages. Demo vehicles have `is_demo=true` and are deletable with a single admin action.
- No fake buttons/features: unconfigured services (AutoScout24 feed, Resend, domain) must show an explicit "not configured" state, never a simulated success.
- STOP and ask when a real credential or external datum is required (AS24 snippet/feed, RESEND_API_KEY, domain, WhatsApp number).
- TypeScript strict, no `any`, no hardcoded keys. `service_role` key and secrets are server-side only (Server Actions / Route Handlers / Edge Functions).
- RLS active on every table; roles via `user_roles` + `has_role()` SECURITY DEFINER (never a `role` column on profiles, never self-referencing policies).
- Public queries never expose `plate`, `vin`, `internal_notes` — use the `public_vehicles` view.

## Phase workflow

Before each phase: present a short plan and wait for explicit approval. After each phase: `next build` + lint must pass → design audit + a11y pass → `/code-review` on the diff → update `CHANGELOG.md` (including open external dependencies).

The full project specification (DB schema, routing, design tokens, phases) is in the initial task brief; keep `CHANGELOG.md` as the running source of truth for what is done/blocked.
