-- URI Event Operations 2026-11-14
-- Private collaborator invitations and authenticated QR check-in.
-- All exposed tables use RLS. No service keys are sent to the browser.

create table if not exists public.uri_event_members (
 owner_id uuid not null references auth.users(id) on delete cascade,
 local_event_id text not null,
 member_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('editor','checkin')),
 invited_at timestamptz not null default now(),
 accepted_at timestamptz,
 primary key (owner_id,local_event_id,member_id),
 foreign key (owner_id,local_event_id) references public.uri_drafts(owner_id,local_event_id) on delete cascade,
 check (owner_id <> member_id)
);
create index if not exists uri_event_members_member_idx on public.uri_event_members(member_id,accepted_at);
alter table public.uri_event_members enable row level security;
create policy "uri members see their own invite" on public.uri_event_members for select to authenticated
 using (owner_id=(select auth.uid()) or member_id=(select auth.uid()));
revoke all on public.uri_event_members from anon;
revoke all on public.uri_event_members from authenticated;
grant select on public.uri_event_members to authenticated;

create policy "uri cohosts read shared drafts" on public.uri_drafts for select to authenticated
 using (exists (select 1 from public.uri_event_members m
  where m.owner_id=uri_drafts.owner_id and m.local_event_id=uri_drafts.local_event_id
  and m.member_id=(select auth.uid()) and m.role='editor' and m.accepted_at is not null));
create policy "uri editors update shared drafts" on public.uri_drafts for update to authenticated
 using (exists (select 1 from public.uri_event_members m
  where m.owner_id=uri_drafts.owner_id and m.local_event_id=uri_drafts.local_event_id
  and m.member_id=(select auth.uid()) and m.role='editor' and m.accepted_at is not null))
 with check (exists (select 1 from public.uri_event_members m
  where m.owner_id=uri_drafts.owner_id and m.local_event_id=uri_drafts.local_event_id
  and m.member_id=(select auth.uid()) and m.role='editor' and m.accepted_at is not null));

create policy "uri editors read shared guest data" on public.uri_guest_tokens for select to authenticated
 using (exists (select 1 from public.uri_event_members m
  where m.owner_id=uri_guest_tokens.owner_id and m.local_event_id=uri_guest_tokens.local_event_id
  and m.member_id=(select auth.uid()) and m.role='editor' and m.accepted_at is not null));
create policy "uri editors insert shared guest data" on public.uri_guest_tokens for insert to authenticated
 with check (exists (select 1 from public.uri_event_members m
  where m.owner_id=uri_guest_tokens.owner_id and m.local_event_id=uri_guest_tokens.local_event_id
  and m.member_id=(select auth.uid()) and m.role='editor' and m.accepted_at is not null));
create policy "uri editors update shared guest data" on public.uri_guest_tokens for update to authenticated
 using (exists (select 1 from public.uri_event_members m
  where m.owner_id=uri_guest_tokens.owner_id and m.local_event_id=uri_guest_tokens.local_event_id
  and m.member_id=(select auth.uid()) and m.role='editor' and m.accepted_at is not null))
 with check (exists (select 1 from public.uri_event_members m
  where m.owner_id=uri_guest_tokens.owner_id and m.local_event_id=uri_guest_tokens.local_event_id
  and m.member_id=(select auth.uid()) and m.role='editor' and m.accepted_at is not null));
create policy "uri editors delete shared guest data" on public.uri_guest_tokens for delete to authenticated
 using (exists (select 1 from public.uri_event_members m
  where m.owner_id=uri_guest_tokens.owner_id and m.local_event_id=uri_guest_tokens.local_event_id
  and m.member_id=(select auth.uid()) and m.role='editor' and m.accepted_at is not null));

alter table public.uri_guest_tokens add column if not exists checkin_hash text;
alter table public.uri_guest_tokens add constraint uri_guest_tokens_checkin_hash_format
 check (checkin_hash is null or checkin_hash ~ '^[a-f0-9]{64}$');
create unique index if not exists uri_guest_checkin_hash_unique
 on public.uri_guest_tokens(checkin_hash) where checkin_hash is not null;

create table if not exists public.uri_guest_checkins (
 owner_id uuid not null,
 local_event_id text not null,
 guest_id text not null,
 checked_in_at timestamptz not null default now(),
 checked_in_by uuid not null references auth.users(id),
 primary key(owner_id,local_event_id,guest_id),
 foreign key(owner_id,local_event_id,guest_id)
  references public.uri_guest_tokens(owner_id,local_event_id,guest_id) on delete cascade
);
alter table public.uri_guest_checkins enable row level security;
create policy "uri event staff view attendance" on public.uri_guest_checkins for select to authenticated
 using (owner_id=(select auth.uid()) or exists
  (select 1 from public.uri_event_members m where m.owner_id=uri_guest_checkins.owner_id
   and m.local_event_id=uri_guest_checkins.local_event_id and m.member_id=(select auth.uid())
   and m.role in ('editor','checkin') and m.accepted_at is not null));
revoke all on public.uri_guest_checkins from anon;
revoke all on public.uri_guest_checkins from authenticated;
grant select on public.uri_guest_checkins to authenticated;

create or replace function public.uri_invite_cohost(
 p_event_id text,p_email text,p_role text default 'editor'
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_owner uuid;v_member uuid;v_email text;
begin
 v_owner:=auth.uid();
 v_email:=lower(trim(coalesce(p_email,'')));
 if v_owner is null then raise exception 'Sign in required';end if;
 if p_role not in ('editor','checkin') or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 or length(v_email)>254 then raise exception 'Invalid collaborator';end if;
 if not exists(select 1 from public.uri_drafts d where d.owner_id=v_owner and d.local_event_id=p_event_id)
 then raise exception 'Save this invitation to your cloud account first';end if;
 if (select count(*) from public.uri_event_members m where m.owner_id=v_owner and m.local_event_id=p_event_id)>=10
 then raise exception 'Maximum of 10 collaborators per event';end if;
 select id into v_member from auth.users where lower(email)=v_email limit 1;
 if v_member is null then raise exception 'The cohost must first sign in to URI using this email';end if;
 if v_member=v_owner then raise exception 'The owner already manages this event';end if;
 insert into public.uri_event_members(owner_id,local_event_id,member_id,role)
 values(v_owner,p_event_id,v_member,p_role)
 on conflict(owner_id,local_event_id,member_id) do update
 set role=excluded.role,
 accepted_at=case when uri_event_members.role=excluded.role then uri_event_members.accepted_at else null end,
 invited_at=now();
 return jsonb_build_object('memberId',v_member,'role',p_role,'email',v_email);
end $$;

create or replace function public.uri_accept_cohost(p_owner_id uuid,p_event_id text)
 returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 update public.uri_event_members set accepted_at=coalesce(accepted_at,now())
 where owner_id=p_owner_id and local_event_id=p_event_id and member_id=auth.uid();
 if not found then raise exception 'Invitation not found';end if;
 return true;
end $$;

create or replace function public.uri_remove_cohost(p_event_id text,p_member_id uuid)
 returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 delete from public.uri_event_members where owner_id=auth.uid()
 and local_event_id=p_event_id and member_id=p_member_id;
 return found;
end $$;

create or replace function public.uri_leave_cohost(p_owner_id uuid,p_event_id text)
 returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 delete from public.uri_event_members where owner_id=p_owner_id
 and local_event_id=p_event_id and member_id=auth.uid();
 return found;
end $$;

create or replace function public.uri_cohost_save_draft(
 p_owner_id uuid,p_event_id text,p_payload jsonb,p_revision bigint
) returns bigint language plpgsql security invoker set search_path=''
as $$
declare v_revision bigint;
begin
 if auth.uid() is null or not exists (
  select 1 from public.uri_event_members m where m.owner_id=p_owner_id
  and m.local_event_id=p_event_id and m.member_id=auth.uid()
  and m.role='editor' and m.accepted_at is not null)
 then raise exception 'Editor permission required';end if;
 if length(coalesce(p_event_id,'')) not between 1 and 100
 or jsonb_typeof(p_payload)<>'object' or p_payload->>'id' is distinct from p_event_id
 or octet_length(p_payload::text)>8388608 or coalesce(p_revision,0)<1
 then raise exception 'Invalid shared draft revision';end if;
 update public.uri_drafts set payload=p_payload,revision=revision+1,updated_at=now()
 where owner_id=p_owner_id and local_event_id=p_event_id and revision=p_revision
 returning revision into v_revision;
 if v_revision is null then raise exception 'Cloud version conflict. Restore latest copy';end if;
 return v_revision;
end $$;

create or replace function public.uri_cohost_sync_guests(
 p_owner_id uuid,p_event_id text,p_guests jsonb
) returns integer language plpgsql security invoker set search_path=''
as $$
declare g jsonb;n integer:=0;
begin
 if auth.uid() is null or not exists (
  select 1 from public.uri_event_members m where m.owner_id=p_owner_id
  and m.local_event_id=p_event_id and m.member_id=auth.uid()
  and m.role='editor' and m.accepted_at is not null)
 then raise exception 'Editor permission required';end if;
 if jsonb_typeof(p_guests)<>'array' or jsonb_array_length(p_guests)>500
 then raise exception 'Invalid guest list';end if;
 for g in select value from jsonb_array_elements(p_guests) loop
  if length(coalesce(g->>'guest_id','')) not between 1 and 100
   or length(coalesce(g->>'name','')) not between 1 and 120
   or coalesce(g->>'token_hash','') !~ '^[a-f0-9]{64}$'
   or length(coalesce(g->>'email',''))>160
   or length(coalesce(g->>'household_id',''))>100
   or coalesce((g->>'plus_ones_allowed')::integer,0) not between 0 and 5
  then raise exception 'Invalid guest metadata';end if;
  insert into public.uri_guest_tokens(
   owner_id,local_event_id,guest_id,token_hash,name,email,household_id,plus_ones_allowed,active
  )values(p_owner_id,p_event_id,g->>'guest_id',g->>'token_hash',g->>'name',
   coalesce(g->>'email',''),coalesce(g->>'household_id',''),
   coalesce((g->>'plus_ones_allowed')::integer,0),true)
  on conflict(owner_id,local_event_id,guest_id) do update set
   token_hash=excluded.token_hash,name=excluded.name,email=excluded.email,
   household_id=excluded.household_id,plus_ones_allowed=excluded.plus_ones_allowed,
   active=true,updated_at=now();
  n:=n+1;
 end loop;
 delete from public.uri_guest_tokens t where t.owner_id=p_owner_id
 and t.local_event_id=p_event_id and not exists (
  select 1 from jsonb_array_elements(p_guests) g where g.value->>'guest_id'=t.guest_id);
 return n;
end $$;

create or replace function public.uri_sync_checkin_codes(
 p_owner_id uuid,p_event_id text,p_codes jsonb
) returns integer language plpgsql security invoker set search_path=''
as $$
declare g jsonb;n integer:=0;
begin
 if auth.uid() is null or not (
  auth.uid()=p_owner_id or exists(select 1 from public.uri_event_members m
   where m.owner_id=p_owner_id and m.local_event_id=p_event_id
   and m.member_id=auth.uid() and m.role='editor' and m.accepted_at is not null))
 then raise exception 'Editor permission required';end if;
 if jsonb_typeof(p_codes)<>'array' or jsonb_array_length(p_codes)>500 then
  raise exception 'Invalid check-in code list';end if;
 for g in select value from jsonb_array_elements(p_codes) loop
  if coalesce(g->>'code_hash','') !~ '^[a-f0-9]{64}$'
  or length(coalesce(g->>'guest_id','')) not between 1 and 100
  then raise exception 'Invalid check-in code';end if;
  update public.uri_guest_tokens set checkin_hash=g->>'code_hash'
  where owner_id=p_owner_id and local_event_id=p_event_id and guest_id=g->>'guest_id';
  if found then n:=n+1;end if;
 end loop;
 return n;
end $$;

create or replace function public.uri_checkin_guest(
 p_owner_id uuid,p_event_id text,p_code text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid;v_guest record;v_at timestamptz;v_existing boolean;
begin
 v_uid:=auth.uid();
 if v_uid is null or not (v_uid=p_owner_id or exists (
  select 1 from public.uri_event_members m where m.owner_id=p_owner_id
   and m.local_event_id=p_event_id and m.member_id=v_uid
   and m.role in ('editor','checkin') and m.accepted_at is not null))
 then raise exception 'Event staff sign-in required';end if;
 if coalesce(p_code,'') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid QR pass';end if;
 select t.guest_id,t.name,t.active into v_guest from public.uri_guest_tokens t
 where t.owner_id=p_owner_id and t.local_event_id=p_event_id
 and t.checkin_hash=encode(sha256(convert_to(p_code,'UTF8')),'hex') and t.active;
 if not found then raise exception 'Pass not recognized for this event';end if;
 select checked_in_at into v_at from public.uri_guest_checkins
  where owner_id=p_owner_id and local_event_id=p_event_id and guest_id=v_guest.guest_id;
 v_existing:=found;
 if not v_existing then
  insert into public.uri_guest_checkins(owner_id,local_event_id,guest_id,checked_in_by)
  values(p_owner_id,p_event_id,v_guest.guest_id,v_uid)
  on conflict(owner_id,local_event_id,guest_id) do nothing;
  select checked_in_at into v_at from public.uri_guest_checkins
  where owner_id=p_owner_id and local_event_id=p_event_id and guest_id=v_guest.guest_id;
 end if;
 return jsonb_build_object('guestId',v_guest.guest_id,'name',v_guest.name,
   'alreadyCheckedIn',v_existing,'checkedInAt',v_at);
end $$;

create or replace function public.uri_undo_checkin(
 p_owner_id uuid,p_event_id text,p_guest_id text
) returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not (auth.uid()=p_owner_id or exists(
  select 1 from public.uri_event_members m where m.owner_id=p_owner_id
  and m.local_event_id=p_event_id and m.member_id=auth.uid()
  and m.role='editor' and m.accepted_at is not null))
 then raise exception 'Editor permission required';end if;
 delete from public.uri_guest_checkins where owner_id=p_owner_id
  and local_event_id=p_event_id and guest_id=p_guest_id;
 return found;
end $$;

-- Only authenticated callers can invoke privileged workflows.
revoke all on function public.uri_invite_cohost(text,text,text) from public,anon;
revoke all on function public.uri_accept_cohost(uuid,text) from public,anon;
revoke all on function public.uri_remove_cohost(text,uuid) from public,anon;
revoke all on function public.uri_leave_cohost(uuid,text) from public,anon;
revoke all on function public.uri_cohost_save_draft(uuid,text,jsonb,bigint) from public,anon;
revoke all on function public.uri_cohost_sync_guests(uuid,text,jsonb) from public,anon;
revoke all on function public.uri_sync_checkin_codes(uuid,text,jsonb) from public,anon;
revoke all on function public.uri_checkin_guest(uuid,text,text) from public,anon;
revoke all on function public.uri_undo_checkin(uuid,text,text) from public,anon;
grant execute on function public.uri_invite_cohost(text,text,text),
 public.uri_accept_cohost(uuid,text),public.uri_remove_cohost(text,uuid),
 public.uri_leave_cohost(uuid,text),public.uri_cohost_save_draft(uuid,text,jsonb,bigint),
 public.uri_cohost_sync_guests(uuid,text,jsonb),public.uri_sync_checkin_codes(uuid,text,jsonb),
 public.uri_checkin_guest(uuid,text,text),public.uri_undo_checkin(uuid,text,text)
 to authenticated;
