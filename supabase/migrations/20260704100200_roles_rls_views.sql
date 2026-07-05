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
