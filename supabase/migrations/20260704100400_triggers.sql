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
