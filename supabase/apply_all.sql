-- ══════════════════════════════════════════════════════════════════
-- AUTOSTORE — bundle AUTO-GENERATO di tutte le migration (in ordine).
-- Da incollare UNA VOLTA nel SQL Editor di Supabase (progetto nuovo).
-- Fonte canonica: supabase/migrations/*.sql — non modificare a mano.
-- Rigenera con: cat supabase/migrations/*.sql > supabase/apply_all.sql
-- ══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- AUTOSTORE — 01. ENUM types
-- ═══════════════════════════════════════════════════════════════

create type public.app_role as enum ('super_admin', 'editor', 'viewer');

create type public.vehicle_condition as enum (
  'nuovo', 'usato', 'km0', 'aziendale', 'demo'
);

create type public.availability_status as enum (
  'disponibile', 'riservato', 'venduto', 'in_arrivo', 'non_disponibile'
);

create type public.fuel_type as enum (
  'benzina', 'diesel', 'gpl', 'metano', 'hybrid', 'hybrid_plugin',
  'mild_hybrid', 'elettrico', 'altro'
);

create type public.transmission as enum (
  'manuale', 'automatico', 'semiautomatico'
);

create type public.body_type as enum (
  'berlina', 'station_wagon', 'suv', 'crossover', 'citycar', 'utilitaria',
  'monovolume', 'coupe', 'cabrio', 'pickup', 'furgone', 'altro'
);

create type public.drivetrain as enum ('anteriore', 'posteriore', 'integrale');

create type public.lead_type as enum (
  'info_veicolo', 'test_drive', 'visita', 'permuta', 'valutazione_usato',
  'contatto_generico', 'finanziamento'
);

create type public.lead_status as enum (
  'nuovo', 'da_contattare', 'contattato', 'appuntamento', 'chiuso',
  'non_interessato', 'spam'
);
-- ═══════════════════════════════════════════════════════════════
-- AUTOSTORE — 02. Tables + indexes
-- All timestamps are timestamptz with default now().
-- RLS is enabled here and policies are defined in 03.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. profiles ────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ── 2. user_roles (NEVER a role column on profiles) ────────────
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- ── 3. vehicles ────────────────────────────────────────────────
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  internal_code text,
  external_id text,
  autoscout_url text,
  make text not null,
  model text not null,
  version text,
  display_title text,
  condition public.vehicle_condition not null default 'usato',
  body_type public.body_type,
  availability public.availability_status not null default 'disponibile',
  price numeric(10, 2),
  previous_price numeric(10, 2),
  currency text not null default 'EUR',
  price_on_request boolean not null default false,
  vat_deductible boolean,
  year integer check (year between 1900 and 2100),
  registration_month integer check (registration_month between 1 and 12),
  mileage integer check (mileage >= 0),
  fuel_type public.fuel_type,
  transmission public.transmission,
  power_hp integer,
  power_kw integer,
  engine_displacement integer,
  exterior_color text,
  interior_color text,
  doors integer,
  seats integer,
  emission_class text,
  drivetrain public.drivetrain,
  previous_owners integer,
  -- PRIVACY: plate, vin, internal_notes are NEVER exposed publicly.
  -- The public site must query the public_vehicles view only.
  plate text,
  vin text,
  description text,
  warranty text,
  internal_notes text,
  location text,
  cover_image_url text,
  video_url text,
  equipment text[] not null default '{}',
  featured boolean not null default false,
  published boolean not null default false,
  showroom_enabled boolean not null default true,
  source text not null default 'manual',
  is_demo boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vehicles enable row level security;

create index vehicles_published_idx on public.vehicles (published);
create index vehicles_featured_idx on public.vehicles (featured);
create index vehicles_make_idx on public.vehicles (make);
create index vehicles_price_idx on public.vehicles (price);
create index vehicles_year_idx on public.vehicles (year);
create index vehicles_availability_idx on public.vehicles (availability);
create index vehicles_published_featured_idx
  on public.vehicles (published, featured);
-- CSV import dedup key (multiple NULLs allowed)
create unique index vehicles_external_id_key
  on public.vehicles (external_id) where external_id is not null;

-- ── 4. vehicle_images ──────────────────────────────────────────
create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vehicle_images enable row level security;
create index vehicle_images_vehicle_id_idx
  on public.vehicle_images (vehicle_id, sort_order);

-- ── 5. vehicle_features (v1 uses vehicles.equipment; ready for v2) ──
create table public.vehicle_features (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  slug text not null unique,
  created_at timestamptz not null default now()
);
alter table public.vehicle_features enable row level security;

create table public.vehicle_feature_assignments (
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  feature_id uuid not null references public.vehicle_features (id) on delete cascade,
  primary key (vehicle_id, feature_id)
);
alter table public.vehicle_feature_assignments enable row level security;

-- ── 6. vehicle_status_history ──────────────────────────────────
create table public.vehicle_status_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  from_status public.availability_status,
  to_status public.availability_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.vehicle_status_history enable row level security;
create index vehicle_status_history_vehicle_idx
  on public.vehicle_status_history (vehicle_id, created_at desc);

-- ── 7. leads ───────────────────────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  message text,
  lead_type public.lead_type not null default 'info_veicolo',
  vehicle_id uuid references public.vehicles (id) on delete set null,
  source_page text,
  source text,
  status public.lead_status not null default 'nuovo',
  assigned_to uuid references public.profiles (id) on delete set null,
  internal_notes text,
  preferred_channel text,
  privacy_consent boolean not null check (privacy_consent = true),
  trade_in_info jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.leads enable row level security;
create index leads_status_idx on public.leads (status, created_at desc);
create index leads_vehicle_idx on public.leads (vehicle_id);

-- ── 8. trade_in_requests + trade_in_images ─────────────────────
create table public.trade_in_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  car_make text not null,
  car_model text not null,
  car_version text,
  car_year integer,
  car_mileage integer,
  car_fuel_type public.fuel_type,
  car_transmission public.transmission,
  plate text,
  existing_finance boolean not null default false,
  message text,
  status public.lead_status not null default 'nuovo',
  privacy_consent boolean not null check (privacy_consent = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.trade_in_requests enable row level security;

create table public.trade_in_images (
  id uuid primary key default gen_random_uuid(),
  trade_in_id uuid not null references public.trade_in_requests (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
alter table public.trade_in_images enable row level security;

-- ── 9. business_information (singleton) ────────────────────────
create table public.business_information (
  id integer primary key default 1 check (id = 1),
  name text not null,
  legal_name text not null,
  vat_number text not null,
  tax_code text not null,
  rea text,
  sdi text,
  pec text,
  address text,
  city text,
  zip text,
  province text,
  phone text,
  whatsapp text,
  email text,
  hours jsonb not null default '[]'::jsonb,
  social jsonb not null default '[]'::jsonb,
  map_lat double precision,
  map_lng double precision,
  logo_url text,
  autoscout_dealer_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.business_information enable row level security;

-- ── 10. site_settings + content_sections ───────────────────────
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

create table public.content_sections (
  key text not null,
  locale text not null default 'it',
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (key, locale)
);
alter table public.content_sections enable row level security;

-- ── 11. autoscout_settings (singleton) ─────────────────────────
create table public.autoscout_settings (
  id integer primary key default 1 check (id = 1),
  embed_snippet text,
  dealer_url text,
  feed_url text,
  last_import_at timestamptz,
  status text not null default 'not_configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.autoscout_settings enable row level security;

-- ── 12. email_notifications + audit_logs ───────────────────────
create table public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  type text not null,
  related_lead_id uuid references public.leads (id) on delete set null,
  status text not null default 'pending',
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
alter table public.email_notifications enable row level security;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  changes jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ── 13. slug_redirects (301 when a vehicle slug changes) ───────
create table public.slug_redirects (
  old_slug text primary key,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.slug_redirects enable row level security;
-- ═══════════════════════════════════════════════════════════════
-- AUTOSTORE — 03. has_role (SECURITY DEFINER) + RLS policies + views
--
-- CRITICAL RLS RULE: roles live in user_roles, checked via the
-- SECURITY DEFINER function has_role(). A protected table is never
-- referenced inside its own policy (no RLS recursion).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- Staff = super_admin or editor (write access to catalog/leads).
create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(_user_id, 'super_admin')
      or public.has_role(_user_id, 'editor');
$$;

-- Existence check for anon INSERT policies on trade-in images: an
-- invoker-rights subquery against trade_in_requests would be blocked
-- by that table's own RLS (anon has no SELECT policy there).
create or replace function public.trade_in_request_exists(_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trade_in_requests where id = _request_id
  );
$$;

-- ── profiles ───────────────────────────────────────────────────
create policy "profiles: read own or super_admin reads all"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or public.has_role((select auth.uid()), 'super_admin')
  );

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: super_admin manages"
  on public.profiles for all to authenticated
  using (public.has_role((select auth.uid()), 'super_admin'))
  with check (public.has_role((select auth.uid()), 'super_admin'));

-- ── user_roles ─────────────────────────────────────────────────
create policy "user_roles: read own role"
  on public.user_roles for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_role((select auth.uid()), 'super_admin')
  );

create policy "user_roles: super_admin manages"
  on public.user_roles for all to authenticated
  using (public.has_role((select auth.uid()), 'super_admin'))
  with check (public.has_role((select auth.uid()), 'super_admin'));

-- ── vehicles ───────────────────────────────────────────────────
-- Public sees only published; staff sees everything.
create policy "vehicles: public reads published"
  on public.vehicles for select to anon, authenticated
  using (published = true or public.is_staff((select auth.uid())));

create policy "vehicles: staff writes"
  on public.vehicles for insert to authenticated
  with check (public.is_staff((select auth.uid())));

create policy "vehicles: staff updates"
  on public.vehicles for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "vehicles: staff deletes"
  on public.vehicles for delete to authenticated
  using (public.is_staff((select auth.uid())));

-- ── vehicle_images ─────────────────────────────────────────────
create policy "vehicle_images: public reads for published vehicles"
  on public.vehicle_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and (v.published = true or public.is_staff((select auth.uid())))
    )
  );

create policy "vehicle_images: staff writes"
  on public.vehicle_images for all to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

-- ── vehicle_features (+ assignments) ───────────────────────────
create policy "vehicle_features: public read"
  on public.vehicle_features for select to anon, authenticated
  using (true);

create policy "vehicle_features: staff writes"
  on public.vehicle_features for all to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "vehicle_feature_assignments: public read"
  on public.vehicle_feature_assignments for select to anon, authenticated
  using (true);

create policy "vehicle_feature_assignments: staff writes"
  on public.vehicle_feature_assignments for all to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

-- ── vehicle_status_history ─────────────────────────────────────
create policy "vehicle_status_history: staff reads"
  on public.vehicle_status_history for select to authenticated
  using (public.is_staff((select auth.uid())));

create policy "vehicle_status_history: staff writes"
  on public.vehicle_status_history for insert to authenticated
  with check (public.is_staff((select auth.uid())));

-- ── leads ──────────────────────────────────────────────────────
-- Anyone can submit a lead (with explicit privacy consent);
-- nobody anonymous can ever read one back.
create policy "leads: anon inserts with consent"
  on public.leads for insert to anon, authenticated
  with check (privacy_consent = true);

create policy "leads: staff reads"
  on public.leads for select to authenticated
  using (public.is_staff((select auth.uid())));

create policy "leads: staff updates"
  on public.leads for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "leads: staff deletes"
  on public.leads for delete to authenticated
  using (public.is_staff((select auth.uid())));

-- ── trade_in_requests + images ─────────────────────────────────
create policy "trade_in_requests: anon inserts with consent"
  on public.trade_in_requests for insert to anon, authenticated
  with check (privacy_consent = true);

create policy "trade_in_requests: staff reads"
  on public.trade_in_requests for select to authenticated
  using (public.is_staff((select auth.uid())));

create policy "trade_in_requests: staff updates"
  on public.trade_in_requests for update to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "trade_in_images: anon inserts bound to a request"
  on public.trade_in_images for insert to anon, authenticated
  with check (public.trade_in_request_exists(trade_in_id));

create policy "trade_in_images: staff reads"
  on public.trade_in_images for select to authenticated
  using (public.is_staff((select auth.uid())));

create policy "trade_in_images: staff deletes"
  on public.trade_in_images for delete to authenticated
  using (public.is_staff((select auth.uid())));

-- ── business_information ───────────────────────────────────────
create policy "business_information: public read"
  on public.business_information for select to anon, authenticated
  using (true);

create policy "business_information: super_admin writes"
  on public.business_information for all to authenticated
  using (public.has_role((select auth.uid()), 'super_admin'))
  with check (public.has_role((select auth.uid()), 'super_admin'));

-- ── site_settings + content_sections ───────────────────────────
create policy "site_settings: public read"
  on public.site_settings for select to anon, authenticated
  using (true);

create policy "site_settings: super_admin writes"
  on public.site_settings for all to authenticated
  using (public.has_role((select auth.uid()), 'super_admin'))
  with check (public.has_role((select auth.uid()), 'super_admin'));

create policy "content_sections: public read"
  on public.content_sections for select to anon, authenticated
  using (true);

create policy "content_sections: staff writes"
  on public.content_sections for all to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

-- ── autoscout_settings (super_admin only; the public embed is
--    read server-side with the service role) ────────────────────
create policy "autoscout_settings: super_admin all"
  on public.autoscout_settings for all to authenticated
  using (public.has_role((select auth.uid()), 'super_admin'))
  with check (public.has_role((select auth.uid()), 'super_admin'));

-- ── email_notifications ────────────────────────────────────────
create policy "email_notifications: staff reads"
  on public.email_notifications for select to authenticated
  using (public.is_staff((select auth.uid())));

-- ── audit_logs (written only via SECURITY DEFINER triggers) ─────
create policy "audit_logs: staff reads"
  on public.audit_logs for select to authenticated
  using (public.is_staff((select auth.uid())));

-- ── slug_redirects ─────────────────────────────────────────────
create policy "slug_redirects: public read"
  on public.slug_redirects for select to anon, authenticated
  using (true);

create policy "slug_redirects: staff writes"
  on public.slug_redirects for all to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

-- ═══════════════════════════════════════════════════════════════
-- PRIVACY VIEW: the public site queries ONLY this view.
-- Explicit column list — plate, vin, internal_notes are excluded.
-- security_invoker keeps RLS enforcement on the underlying table.
-- ═══════════════════════════════════════════════════════════════
create view public.public_vehicles
with (security_invoker = true) as
select
  id,
  slug,
  autoscout_url,
  make,
  model,
  version,
  display_title,
  condition,
  body_type,
  availability,
  price,
  previous_price,
  currency,
  price_on_request,
  vat_deductible,
  year,
  registration_month,
  mileage,
  fuel_type,
  transmission,
  power_hp,
  power_kw,
  engine_displacement,
  exterior_color,
  interior_color,
  doors,
  seats,
  emission_class,
  drivetrain,
  previous_owners,
  description,
  warranty,
  location,
  cover_image_url,
  video_url,
  equipment,
  featured,
  showroom_enabled,
  is_demo,
  sort_order,
  published_at,
  sold_at,
  created_at,
  updated_at
from public.vehicles
where published = true;

grant select on public.public_vehicles to anon, authenticated;
-- ═══════════════════════════════════════════════════════════════
-- AUTOSTORE — 04. Storage buckets + policies
-- vehicle-images: PUBLIC  → vehicles/{vehicle_id}/originals|optimized|thumbnails/
-- trade-in-images: PRIVATE → trade-ins/{request_id}/
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-images',
  'vehicle-images',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trade-in-images',
  'trade-in-images',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic']
);

-- ── vehicle-images: public read, staff write ───────────────────
create policy "vehicle-images: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'vehicle-images');

create policy "vehicle-images: staff insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vehicle-images'
    and public.is_staff((select auth.uid()))
  );

create policy "vehicle-images: staff update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'vehicle-images'
    and public.is_staff((select auth.uid()))
  );

create policy "vehicle-images: staff delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'vehicle-images'
    and public.is_staff((select auth.uid()))
  );

-- ── trade-in-images: anon upload bound to an existing request,
--    staff-only read/delete ─────────────────────────────────────
create policy "trade-in-images: anon upload bound to request"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'trade-in-images'
    and (storage.foldername(name))[1] = 'trade-ins'
    -- SECURITY DEFINER helper: anon cannot SELECT trade_in_requests directly
    and public.trade_in_request_exists(
      ((storage.foldername(name))[2])::uuid
    )
  );

create policy "trade-in-images: staff read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'trade-in-images'
    and public.is_staff((select auth.uid()))
  );

create policy "trade-in-images: staff delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'trade-in-images'
    and public.is_staff((select auth.uid()))
  );
-- ═══════════════════════════════════════════════════════════════
-- AUTOSTORE — 05. Triggers: updated_at, handle_new_user,
-- publish/sold timestamps, slug redirects, status history, audit.
-- ═══════════════════════════════════════════════════════════════

-- ── updated_at ─────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();
create trigger set_vehicle_images_updated_at
  before update on public.vehicle_images
  for each row execute function public.set_updated_at();
create trigger set_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();
create trigger set_trade_in_requests_updated_at
  before update on public.trade_in_requests
  for each row execute function public.set_updated_at();
create trigger set_business_information_updated_at
  before update on public.business_information
  for each row execute function public.set_updated_at();
create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger set_content_sections_updated_at
  before update on public.content_sections
  for each row execute function public.set_updated_at();
create trigger set_autoscout_settings_updated_at
  before update on public.autoscout_settings
  for each row execute function public.set_updated_at();

-- ── handle_new_user: auth.users → profiles ─────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── vehicles: publish/sold timestamps + slug redirects ─────────
create or replace function public.handle_vehicle_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.published = true and old.published = false then
    new.published_at = now();
  end if;
  if new.availability = 'venduto'
     and old.availability is distinct from 'venduto' then
    new.sold_at = now();
  end if;
  return new;
end;
$$;

create trigger vehicles_before_update
  before update on public.vehicles
  for each row execute function public.handle_vehicle_before_update();

-- 301 redirect bookkeeping when a published vehicle changes slug
create or replace function public.handle_vehicle_slug_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.slug is distinct from new.slug then
    insert into public.slug_redirects (old_slug, vehicle_id)
    values (old.slug, new.id)
    on conflict (old_slug) do update set vehicle_id = excluded.vehicle_id;
    -- A slug that becomes current again must not redirect anymore.
    delete from public.slug_redirects where old_slug = new.slug;
  end if;
  return new;
end;
$$;

create trigger vehicles_slug_change
  after update of slug on public.vehicles
  for each row execute function public.handle_vehicle_slug_change();

-- ── vehicles: availability history ─────────────────────────────
create or replace function public.handle_vehicle_status_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.vehicle_status_history
      (vehicle_id, from_status, to_status, changed_by)
    values (new.id, null, new.availability, auth.uid());
  elsif old.availability is distinct from new.availability then
    insert into public.vehicle_status_history
      (vehicle_id, from_status, to_status, changed_by)
    values (new.id, old.availability, new.availability, auth.uid());
  end if;
  return new;
end;
$$;

create trigger vehicles_status_history
  after insert or update on public.vehicles
  for each row execute function public.handle_vehicle_status_history();

-- ── audit log (SECURITY DEFINER so staff writes pass RLS) ──────
-- Generic diff of changed columns, excluding noise.
create or replace function public.handle_vehicle_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _action text;
  _changes jsonb;
begin
  if tg_op = 'INSERT' then
    _action := 'vehicle.created';
    _changes := jsonb_build_object(
      'make', new.make, 'model', new.model, 'slug', new.slug,
      'published', new.published, 'is_demo', new.is_demo
    );
  elsif tg_op = 'DELETE' then
    _action := 'vehicle.deleted';
    _changes := jsonb_build_object(
      'make', old.make, 'model', old.model, 'slug', old.slug
    );
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, changes)
    values (auth.uid(), _action, 'vehicle', old.id::text, _changes);
    return old;
  else
    if old.published = false and new.published = true then
      _action := 'vehicle.published';
    elsif old.published = true and new.published = false then
      _action := 'vehicle.unpublished';
    elsif old.price is distinct from new.price then
      _action := 'vehicle.price_changed';
    elsif old.availability is distinct from new.availability then
      _action := 'vehicle.status_changed';
    else
      _action := 'vehicle.updated';
    end if;
    select jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value))
      into _changes
      from jsonb_each(to_jsonb(old)) o
      join jsonb_each(to_jsonb(new)) n on o.key = n.key
      where o.value is distinct from n.value
        and n.key not in ('updated_at', 'created_at');
    if _changes is null then
      return new; -- no-op update: nothing to log
    end if;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, changes)
  values (auth.uid(), _action, 'vehicle', new.id::text, _changes);
  return new;
end;
$$;

create trigger vehicles_audit
  after insert or update or delete on public.vehicles
  for each row execute function public.handle_vehicle_audit();

-- ── audit on role changes ──────────────────────────────────────
create or replace function public.handle_user_role_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, changes)
    values (
      auth.uid(), 'user_role.granted', 'user_role', new.user_id::text,
      jsonb_build_object('role', new.role)
    );
    return new;
  else
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, changes)
    values (
      auth.uid(), 'user_role.revoked', 'user_role', old.user_id::text,
      jsonb_build_object('role', old.role)
    );
    return old;
  end if;
end;
$$;

create trigger user_roles_audit
  after insert or delete on public.user_roles
  for each row execute function public.handle_user_role_audit();
-- ═══════════════════════════════════════════════════════════════
-- AUTOSTORE — 06. Seed: real business data + editable content +
-- demo vehicles (is_demo=true, removable with one admin action).
-- Placeholders use the required "[INSERIRE ...]" format.
-- ═══════════════════════════════════════════════════════════════

-- ── business_information (real data from the brief) ────────────
insert into public.business_information (
  id, name, legal_name, vat_number, tax_code, rea, sdi, pec,
  address, city, zip, province, phone, whatsapp, email,
  hours, social, autoscout_dealer_url
) values (
  1,
  'Autostore',
  'AUTOSTORE S.R.L.',
  '03129320598',
  '03129320598',
  'LT-302800',
  'AGX0ABB',
  'autostoresrlaprilia@pec.it',
  'Via delle Palme angolo Via Ottaviano 8',
  'Aprilia',
  '04011',
  'LT',
  '[INSERIRE TELEFONO]',
  '[INSERIRE NUMERO WHATSAPP]',
  'info@autostoreaprilia.com',
  '[
    {"days": "Lunedì – Venerdì", "hours": "[INSERIRE ORARI]"},
    {"days": "Sabato", "hours": "[INSERIRE ORARI]"},
    {"days": "Domenica", "hours": "[INSERIRE ORARI]"}
  ]'::jsonb,
  '[
    {"platform": "instagram", "url": "", "enabled": false},
    {"platform": "facebook", "url": "", "enabled": false},
    {"platform": "tiktok", "url": "", "enabled": false},
    {"platform": "youtube", "url": "", "enabled": false}
  ]'::jsonb,
  null
);

-- ── autoscout_settings singleton (explicitly not configured) ───
insert into public.autoscout_settings (id, status) values (1, 'not_configured');

-- ── editable content sections ──────────────────────────────────
insert into public.content_sections (key, locale, value) values
(
  'hero', 'it',
  '{
    "headline": "Auto usate selezionate, ad Aprilia.",
    "subheadline": "Schede complete, foto reali e prezzi chiari per ogni vettura del parco. Vienile a vedere in sede o scrivici.",
    "cta_primary": "Scopri il parco auto",
    "cta_secondary": "Contattaci",
    "image_url": null
  }'::jsonb
),
(
  'why_us', 'it',
  '{
    "title": "Perché Autostore",
    "items": [
      {"title": "Schede trasparenti", "text": "Dati tecnici completi, dotazioni e foto reali per ogni auto in vendita."},
      {"title": "Valutazione del tuo usato", "text": "Portaci la tua auto: la valutiamo per permuta o acquisto diretto."},
      {"title": "[INSERIRE PUNTO DI FORZA]", "text": "[INSERIRE TESTO]"}
    ]
  }'::jsonb
),
(
  'services', 'it',
  '{
    "title": "I nostri servizi",
    "items": [
      {"title": "Vendita auto usate, km 0 e aziendali", "text": "Parco auto selezionato con disponibilità aggiornata in tempo reale."},
      {"title": "Permuta e ritiro dell''usato", "text": "Richiedi una valutazione online: bastano i dati dell''auto e qualche foto."},
      {"title": "[INSERIRE SERVIZIO]", "text": "[INSERIRE DESCRIZIONE]"}
    ]
  }'::jsonb
),
(
  'reviews', 'it',
  '{
    "title": "Dicono di noi",
    "note": "Sezione predisposta per recensioni Google reali. Le voci seguenti sono segnaposto DEMO.",
    "items": [
      {"author": "[DEMO] Cliente 1", "rating": 5, "text": "[DEMO] Testo recensione di esempio, da sostituire con recensioni Google reali."},
      {"author": "[DEMO] Cliente 2", "rating": 5, "text": "[DEMO] Testo recensione di esempio, da sostituire con recensioni Google reali."}
    ]
  }'::jsonb
),
(
  'featured_reels', 'it',
  '{"title": "Dai nostri social", "items": []}'::jsonb
);

-- ── demo vehicles (deletable in one action: delete where is_demo) ──
insert into public.vehicles (
  slug, make, model, version, condition, body_type, availability,
  price, previous_price, price_on_request, vat_deductible,
  year, registration_month, mileage, fuel_type, transmission,
  power_hp, power_kw, engine_displacement, exterior_color, interior_color,
  doors, seats, emission_class, drivetrain, previous_owners,
  description, location, cover_image_url, equipment,
  featured, published, showroom_enabled, is_demo, internal_notes
) values
(
  'volkswagen-golf-1-5-tsi-life-2021',
  'Volkswagen', 'Golf', '1.5 TSI Life', 'usato', 'berlina', 'disponibile',
  18900, 19900, false, false,
  2021, 6, 61000, 'benzina', 'manuale',
  130, 96, 1498, 'Grigio chiaro metallizzato', 'Tessuto nero',
  5, 5, 'Euro 6d', 'anteriore', 1,
  'Volkswagen Golf 8 1.5 TSI Life in ottime condizioni, unico proprietario. Tagliandi documentati e gomme in buono stato. Interni curati, ideale per chi cerca una compatta completa e affidabile.',
  'Aprilia (LT)', '/demo/volkswagen-golf-1-5-tsi-life-2021.webp',
  array['Apple CarPlay / Android Auto', 'Cruise control adattivo', 'Cerchi in lega 16"', 'Sensori di parcheggio anteriori e posteriori', 'Fari LED', 'Clima automatico bizona'],
  true, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'audi-a3-sportback-30-tdi-s-tronic-2022',
  'Audi', 'A3 Sportback', '30 TDI S tronic Business', 'usato', 'berlina', 'disponibile',
  24900, null, false, true,
  2022, 3, 45000, 'diesel', 'automatico',
  116, 85, 1968, 'Nero brillante', 'Similpelle nera',
  5, 5, 'Euro 6d', 'anteriore', 1,
  'Audi A3 Sportback 30 TDI con cambio S tronic, versione Business. IVA esposta e deducibile. Perfetta per lunghe percorrenze, consumi contenuti e dotazione completa.',
  'Aprilia (LT)', '/demo/audi-a3-sportback-30-tdi-s-tronic-2022.webp',
  array['Virtual Cockpit', 'Navigatore MMI', 'Cruise control adattivo', 'Cerchi in lega 17"', 'Fari Full LED', 'Portellone elettrico'],
  true, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'toyota-yaris-1-5-hybrid-trend-2023',
  'Toyota', 'Yaris', '1.5 Hybrid Trend', 'usato', 'citycar', 'disponibile',
  19400, null, false, false,
  2023, 9, 22000, 'hybrid', 'automatico',
  116, 85, 1490, 'Bianco perla', 'Tessuto grigio',
  5, 5, 'Euro 6d', 'anteriore', 1,
  'Toyota Yaris Hybrid di ultima generazione, chilometraggio contenuto. Consumi ridotti in città grazie al sistema full hybrid, cambio automatico e-CVT.',
  'Aprilia (LT)', '/demo/toyota-yaris-1-5-hybrid-trend-2023.webp',
  array['Retrocamera', 'Toyota Safety Sense', 'Apple CarPlay / Android Auto', 'Clima automatico', 'Cerchi in lega 16"', 'Keyless entry'],
  true, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'jeep-renegade-1-0-t3-limited-2020',
  'Jeep', 'Renegade', '1.0 T3 Limited', 'usato', 'suv', 'disponibile',
  15900, 16900, false, false,
  2020, 11, 74000, 'benzina', 'manuale',
  120, 88, 999, 'Blu Jetset', 'Tessuto nero',
  5, 5, 'Euro 6d', 'anteriore', 2,
  'Jeep Renegade 1.0 T3 Limited benzina. Posizione di guida rialzata, dotazione ricca e look inconfondibile. Prezzo aggiornato di recente.',
  'Aprilia (LT)', '/demo/jeep-renegade-1-0-t3-limited-2020.webp',
  array['Uconnect 8.4" con navigatore', 'Cerchi in lega 18"', 'Sensori di parcheggio', 'Cruise control', 'Fari LED', 'Barre al tetto'],
  false, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'fiat-500x-1-3-multijet-cross-2019',
  'Fiat', '500X', '1.3 MultiJet Cross', 'usato', 'crossover', 'riservato',
  13500, null, false, false,
  2019, 4, 89000, 'diesel', 'manuale',
  95, 70, 1248, 'Rosso passione', 'Tessuto nero/grigio',
  5, 5, 'Euro 6d-temp', 'anteriore', 1,
  'Fiat 500X Cross 1.3 MultiJet, diesel economico e affidabile. Attualmente riservata: contattaci per verificare la disponibilità o per proposte simili.',
  'Aprilia (LT)', '/demo/fiat-500x-1-3-multijet-cross-2019.webp',
  array['Schermo touch 7"', 'Cruise control', 'Sensori di parcheggio posteriori', 'Cerchi in lega 17"', 'Fendinebbia'],
  false, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'renault-clio-tce-90-gpl-zen-2021',
  'Renault', 'Clio', 'TCe 90 GPL Zen', 'usato', 'utilitaria', 'disponibile',
  12900, null, false, false,
  2021, 2, 58000, 'gpl', 'manuale',
  90, 66, 999, 'Grigio titanio', 'Tessuto nero',
  5, 5, 'Euro 6d', 'anteriore', 1,
  'Renault Clio TCe 90 con impianto GPL di serie: costi di gestione ridottissimi e nessuna limitazione ZTL nella maggior parte dei comuni. Ideale come prima auto.',
  'Aprilia (LT)', '/demo/renault-clio-tce-90-gpl-zen-2021.webp',
  array['Easy Link 7" con Apple CarPlay', 'Cruise control', 'Fari Full LED', 'Clima manuale', 'Limitatore di velocità'],
  false, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
);
