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
    and exists (
      select 1 from public.trade_in_requests r
      where r.id::text = (storage.foldername(name))[2]
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
