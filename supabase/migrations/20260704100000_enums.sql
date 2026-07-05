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
