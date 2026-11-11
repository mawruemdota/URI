-- URI wedding website beta: run in your own Supabase project's SQL Editor.
-- Client applications use ONLY the publishable/anon key. Never expose a secret or service_role key.
create table if not exists public.uri_publications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  local_event_id text not null,
  slug text not null unique,
  title text not null,
  payload jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uri_pub_owner_event unique(owner_id,local_event_id),
  constraint uri_pub_slug_format check (
    (slug ~ '^[a-z0-9]([a-z0-9-]{1,30})[a-z0-9]
  constraint uri_pub_payload_limit check (octet_length(payload::text) < 1048576)
);

alter table public.uri_publications enable row level security;
revoke all on table public.uri_publications from anon, authenticated;
grant select on public.uri_publications to anon, authenticated;
grant insert (owner_id,local_event_id,slug,title,payload,published) on public.uri_publications to authenticated;
grant update on public.uri_publications to authenticated; -- RLS limits updates to the authenticated owner
grant delete on public.uri_publications to authenticated;

drop policy if exists "uri public invitations view" on public.uri_publications;
create policy "uri public invitations view"
  on public.uri_publications for select to anon
  using (published is true);

drop policy if exists "uri auth owners or public view" on public.uri_publications;
create policy "uri auth owners or public view"
  on public.uri_publications for select to authenticated
  using (published is true or owner_id = (select auth.uid()));

drop policy if exists "uri owners insert" on public.uri_publications;
create policy "uri owners insert"
  on public.uri_publications for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "uri owners update" on public.uri_publications;
create policy "uri owners update"
  on public.uri_publications for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "uri owners delete" on public.uri_publications;
create policy "uri owners delete"
  on public.uri_publications for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Gallery images become accessible to anyone with the published invitation URL.
-- Never upload private or sensitive photographs to this public bucket.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('uri-wedding-public','uri-wedding-public',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "uri owner photo upload" on storage.objects;
create policy "uri owner photo upload"
  on storage.objects for insert to authenticated
  with check (bucket_id='uri-wedding-public' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "uri owner photo delete" on storage.objects;
create policy "uri owner photo delete"
  on storage.objects for delete to authenticated
  using (bucket_id='uri-wedding-public' and (storage.foldername(name))[1]=(select auth.uid())::text);


-- URI public invitation audio: published tracks can be streamed without logging in.
-- This bucket is public even when the invitation itself is unpublished.
-- Owners must only upload tracks they have the right to distribute.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('uri-wedding-audio','uri-wedding-audio',true,15728640,
  array['audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm'])
on conflict (id) do nothing;

drop policy if exists "uri owner audio upload" on storage.objects;
create policy "uri owner audio upload"
  on storage.objects for insert to authenticated
  with check (bucket_id='uri-wedding-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "uri owner audio delete" on storage.objects;
create policy "uri owner audio delete"
  on storage.objects for delete to authenticated
  using (bucket_id='uri-wedding-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Manual acceptance tests before real users:
-- 1. anon cannot see unpublished rows or write any row.
-- 2. auth user A cannot update, delete, or read unpublished user B rows.
-- 3. auth user B cannot upload to A's storage prefix.
-- 4. public visitors can read published invitations but no guest list is stored in payload.

      and slug !~ '--'
      and slug not in ('home','dashboard','create','cloud','event','events','invite','invites','public','rsvp','admin','login','logout','signup','settings','account','api','assets','static','preview','pricing','features','templates','about','terms','privacy','help','contact','support','www','uri','index','404'))
    or slug ~ '^uri-[a-z0-9-]{12,80}
  constraint uri_pub_payload_limit check (octet_length(payload::text) < 1048576)
);

alter table public.uri_publications enable row level security;
revoke all on table public.uri_publications from anon, authenticated;
grant select on public.uri_publications to anon, authenticated;
grant insert (owner_id,local_event_id,slug,title,payload,published) on public.uri_publications to authenticated;
grant update on public.uri_publications to authenticated; -- RLS limits updates to the authenticated owner
grant delete on public.uri_publications to authenticated;

drop policy if exists "uri public invitations view" on public.uri_publications;
create policy "uri public invitations view"
  on public.uri_publications for select to anon
  using (published is true);

drop policy if exists "uri auth owners or public view" on public.uri_publications;
create policy "uri auth owners or public view"
  on public.uri_publications for select to authenticated
  using (published is true or owner_id = (select auth.uid()));

drop policy if exists "uri owners insert" on public.uri_publications;
create policy "uri owners insert"
  on public.uri_publications for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "uri owners update" on public.uri_publications;
create policy "uri owners update"
  on public.uri_publications for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "uri owners delete" on public.uri_publications;
create policy "uri owners delete"
  on public.uri_publications for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Gallery images become accessible to anyone with the published invitation URL.
-- Never upload private or sensitive photographs to this public bucket.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('uri-wedding-public','uri-wedding-public',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "uri owner photo upload" on storage.objects;
create policy "uri owner photo upload"
  on storage.objects for insert to authenticated
  with check (bucket_id='uri-wedding-public' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "uri owner photo delete" on storage.objects;
create policy "uri owner photo delete"
  on storage.objects for delete to authenticated
  using (bucket_id='uri-wedding-public' and (storage.foldername(name))[1]=(select auth.uid())::text);


-- URI public invitation audio: published tracks can be streamed without logging in.
-- This bucket is public even when the invitation itself is unpublished.
-- Owners must only upload tracks they have the right to distribute.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('uri-wedding-audio','uri-wedding-audio',true,15728640,
  array['audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm'])
on conflict (id) do nothing;

drop policy if exists "uri owner audio upload" on storage.objects;
create policy "uri owner audio upload"
  on storage.objects for insert to authenticated
  with check (bucket_id='uri-wedding-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "uri owner audio delete" on storage.objects;
create policy "uri owner audio delete"
  on storage.objects for delete to authenticated
  using (bucket_id='uri-wedding-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Manual acceptance tests before real users:
-- 1. anon cannot see unpublished rows or write any row.
-- 2. auth user A cannot update, delete, or read unpublished user B rows.
-- 3. auth user B cannot upload to A's storage prefix.
-- 4. public visitors can read published invitations but no guest list is stored in payload.

  ),
  constraint uri_pub_payload_limit check (octet_length(payload::text) < 1048576)
);

alter table public.uri_publications enable row level security;
revoke all on table public.uri_publications from anon, authenticated;
grant select on public.uri_publications to anon, authenticated;
grant insert (owner_id,local_event_id,slug,title,payload,published) on public.uri_publications to authenticated;
grant update on public.uri_publications to authenticated; -- RLS limits updates to the authenticated owner
grant delete on public.uri_publications to authenticated;

drop policy if exists "uri public invitations view" on public.uri_publications;
create policy "uri public invitations view"
  on public.uri_publications for select to anon
  using (published is true);

drop policy if exists "uri auth owners or public view" on public.uri_publications;
create policy "uri auth owners or public view"
  on public.uri_publications for select to authenticated
  using (published is true or owner_id = (select auth.uid()));

drop policy if exists "uri owners insert" on public.uri_publications;
create policy "uri owners insert"
  on public.uri_publications for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "uri owners update" on public.uri_publications;
create policy "uri owners update"
  on public.uri_publications for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "uri owners delete" on public.uri_publications;
create policy "uri owners delete"
  on public.uri_publications for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Gallery images become accessible to anyone with the published invitation URL.
-- Never upload private or sensitive photographs to this public bucket.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('uri-wedding-public','uri-wedding-public',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "uri owner photo upload" on storage.objects;
create policy "uri owner photo upload"
  on storage.objects for insert to authenticated
  with check (bucket_id='uri-wedding-public' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "uri owner photo delete" on storage.objects;
create policy "uri owner photo delete"
  on storage.objects for delete to authenticated
  using (bucket_id='uri-wedding-public' and (storage.foldername(name))[1]=(select auth.uid())::text);


-- URI public invitation audio: published tracks can be streamed without logging in.
-- This bucket is public even when the invitation itself is unpublished.
-- Owners must only upload tracks they have the right to distribute.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('uri-wedding-audio','uri-wedding-audio',true,15728640,
  array['audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm'])
on conflict (id) do nothing;

drop policy if exists "uri owner audio upload" on storage.objects;
create policy "uri owner audio upload"
  on storage.objects for insert to authenticated
  with check (bucket_id='uri-wedding-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "uri owner audio delete" on storage.objects;
create policy "uri owner audio delete"
  on storage.objects for delete to authenticated
  using (bucket_id='uri-wedding-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Manual acceptance tests before real users:
-- 1. anon cannot see unpublished rows or write any row.
-- 2. auth user A cannot update, delete, or read unpublished user B rows.
-- 3. auth user B cannot upload to A's storage prefix.
-- 4. public visitors can read published invitations but no guest list is stored in payload.
