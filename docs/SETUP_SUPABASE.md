# Setup del progetto Supabase (una tantum)

Il progetto è stato creato su https://supabase.com (ref: `bdjtmbxszqeoelizheaq`).
L'ambiente di sviluppo remoto non raggiunge `*.supabase.co` (policy di rete),
quindi lo schema va applicato dal dashboard. Sono 3 passi, ~5 minuti.

## 1. Applica lo schema (migration)

1. Apri il progetto su Supabase → **SQL Editor** → *New query*.
2. Incolla l'intero contenuto di [`supabase/apply_all.sql`](../supabase/apply_all.sql)
   (bundle auto-generato di `supabase/migrations/*.sql`, già nell'ordine giusto:
   ENUM → tabelle → RLS → storage → trigger → seed).
3. Esegui (**Run**). Alla fine devono esistere 18 tabelle in `public`,
   la view `public_vehicles`, 2 bucket storage e i 6 veicoli demo.

> Il bundle va eseguito UNA sola volta su un progetto vuoto. Per modifiche
> future si aggiungono nuove migration, non si riesegue il bundle.

## 2. Crea il primo utente amministratore

1. Dashboard → **Authentication** → *Users* → **Add user** → *Create new user*.
   Inserisci email e password (es. la tua email di lavoro). Spunta "Auto confirm".
2. Torna al **SQL Editor** ed esegui (sostituendo l'email):

```sql
insert into public.user_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'TUA_EMAIL_QUI';
```

3. Login su `/admin/login` del sito con quelle credenziali.

Per aggiungere un collaboratore con permessi limitati (veicoli/lead ma non
utenti/integrazioni), ripeti con `'editor'` al posto di `'super_admin'`.

## 3. Variabili d'ambiente

In locale (`.env.local`) e su Vercel (Project → Settings → Environment Variables):

| Variabile | Dove trovarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (**solo server, mai nel client**) |
| `NEXT_PUBLIC_SITE_URL` | `https://autostoreaprilia.com` in produzione |
| `RESEND_API_KEY` | (Fase 2, opzionale) dashboard Resend |

> ⚠️ La `service_role` key bypassa la RLS: non condividerla e, se è stata
> trasmessa su canali non sicuri, rigenerala da Settings → API → *Reset*.

## Verifiche post-setup (criteri di accettazione)

- `/parco-auto` mostra i 6 veicoli demo; `/admin` mostra i contatori.
- Un utente anonimo può inviare un lead ma `select * from leads` con la anon key
  restituisce zero righe (test RLS).
- «Elimina dati demo» in `/admin/veicoli` svuota il catalogo e il sito
  resta funzionante con gli stati vuoti.
