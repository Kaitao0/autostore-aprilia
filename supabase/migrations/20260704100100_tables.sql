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
