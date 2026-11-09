-- URI cross-device drafts and bearer-token RSVP
-- Owner-only rows use RLS; only narrow token-protected RPCs are public.
create table if not exists public.uri_drafts (
 owner_id uuid not null references auth.users(id) on delete cascade,
 local_event_id text not null check (length(local_event_id) between 1 and 100),
 payload jsonb not null,
 revision bigint not null default 1 check (revision>=1),
 updated_at timestamptz not null default now(),
 primary key(owner_id,local_event_id),
 constraint uri_draft_size check (octet_length(payload::text) <= 8388608)
);
alter table public.uri_drafts enable row level security;
revoke all on table public.uri_drafts from public,anon,authenticated;
grant select,insert,update,delete on public.uri_drafts to authenticated;
drop policy if exists "uri_drafts_owner_select" on public.uri_drafts;
create policy "uri_drafts_owner_select" on public.uri_drafts for select to authenticated
 using (owner_id=(select auth.uid()));
drop policy if exists "uri_drafts_owner_insert" on public.uri_drafts;
create policy "uri_drafts_owner_insert" on public.uri_drafts for insert to authenticated
 with check (owner_id=(select auth.uid()));
drop policy if exists "uri_drafts_owner_update" on public.uri_drafts;
create policy "uri_drafts_owner_update" on public.uri_drafts for update to authenticated
 using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
drop policy if exists "uri_drafts_owner_delete" on public.uri_drafts;
create policy "uri_drafts_owner_delete" on public.uri_drafts for delete to authenticated
 using (owner_id=(select auth.uid()));

create or replace function public.uri_save_draft(
  p_event_id text, p_payload jsonb, p_revision bigint default 0
) returns bigint language plpgsql security invoker
set search_path = '' as $$
declare v_revision bigint; v_uid uuid;
begin
 v_uid := (select auth.uid());
 if v_uid is null then raise exception 'Sign in to sync drafts.'; end if;
 if length(coalesce(p_event_id,'')) not between 1 and 100
   or jsonb_typeof(p_payload) <> 'object'
   or p_payload->>'id' is distinct from p_event_id
   or octet_length(p_payload::text)>8388608
   or p_revision is null or p_revision<0 then
   raise exception 'Invalid draft payload.';
 end if;
 if p_revision=0 then
   insert into public.uri_drafts(owner_id,local_event_id,payload,revision)
   values (v_uid,p_event_id,p_payload,1)
   on conflict do nothing returning revision into v_revision;
 else
   update public.uri_drafts
   set payload=p_payload, revision=revision+1, updated_at=now()
   where owner_id=v_uid and local_event_id=p_event_id and revision=p_revision
   returning revision into v_revision;
 end if;
 if v_revision is null then
   raise exception 'Cloud version conflict. Load the latest cloud copy before saving.';
 end if;
 return v_revision;
end $$;
revoke all on function public.uri_save_draft(text,jsonb,bigint) from public,anon;
grant execute on function public.uri_save_draft(text,jsonb,bigint) to authenticated;

create table if not exists public.uri_guest_tokens (
 owner_id uuid not null references auth.users(id) on delete cascade,
 local_event_id text not null,
 guest_id text not null,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 name text not null check(length(name) between 1 and 120),
 email text not null default '',
 household_id text not null default '',
 plus_ones_allowed integer not null default 0 check (plus_ones_allowed between 0 and 5),
 status text not null default 'pending' check (status in ('pending','attending','declined')),
 plus_ones_confirmed integer not null default 0 check(plus_ones_confirmed between 0 and 5),
 answers jsonb not null default '{}'::jsonb,
 responded_at timestamptz,
 active boolean not null default true,
 updated_at timestamptz not null default now(),
 primary key(owner_id,local_event_id,guest_id),
 foreign key(owner_id,local_event_id)
   references public.uri_drafts(owner_id,local_event_id) on delete cascade
);
create index if not exists uri_guest_tokens_owner_event
 on public.uri_guest_tokens(owner_id,local_event_id);
alter table public.uri_guest_tokens enable row level security;
revoke all on public.uri_guest_tokens from public,anon,authenticated;
grant select,insert,update,delete on public.uri_guest_tokens to authenticated;
drop policy if exists "uri_guest_owner_select" on public.uri_guest_tokens;
create policy "uri_guest_owner_select" on public.uri_guest_tokens for select to authenticated
 using (owner_id=(select auth.uid()));
drop policy if exists "uri_guest_owner_insert" on public.uri_guest_tokens;
create policy "uri_guest_owner_insert" on public.uri_guest_tokens for insert to authenticated
 with check(owner_id=(select auth.uid()));
drop policy if exists "uri_guest_owner_update" on public.uri_guest_tokens;
create policy "uri_guest_owner_update" on public.uri_guest_tokens for update to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists "uri_guest_owner_delete" on public.uri_guest_tokens;
create policy "uri_guest_owner_delete" on public.uri_guest_tokens for delete to authenticated
 using(owner_id=(select auth.uid()));

-- Token holders may see only their own guest response, never the owner draft or guest list.
create or replace function public.uri_rsvp_lookup(p_token text)
returns jsonb language plpgsql stable security definer
set search_path = '' as $$
declare g public.uri_guest_tokens%rowtype; p public.uri_publications%rowtype;
 d public.uri_drafts%rowtype; v_questions jsonb;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' then return null; end if;
 select * into g from public.uri_guest_tokens
  where token_hash=pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_token,'UTF8'),'sha256'),'hex')
    and active=true;
 if not found then return null; end if;
 select * into p from public.uri_publications
   where owner_id=g.owner_id and local_event_id=g.local_event_id and published=true;
 if not found then return null; end if;
 select * into d from public.uri_drafts
   where owner_id=g.owner_id and local_event_id=g.local_event_id;
 if not found then return null; end if;
 v_questions:=coalesce(d.payload #> '{rsvpSettings,questions}','[]'::jsonb);
 if jsonb_typeof(v_questions) <> 'array' then v_questions:='[]'::jsonb; end if;
 return jsonb_build_object(
  'name',g.name,'status',g.status,'plusOnesAllowed',g.plus_ones_allowed,
  'plusOnesConfirmed',g.plus_ones_confirmed,'answers',g.answers,
  'eventName',coalesce(p.title,'Your celebration'),
  'date',coalesce(p.payload->>'date',''),
  'venue',coalesce(p.payload->>'venue',''),
  'deadline',coalesce(p.payload->>'deadline',''),
  'questions',v_questions);
end $$;
revoke all on function public.uri_rsvp_lookup(text) from public;
grant execute on function public.uri_rsvp_lookup(text) to anon,authenticated;

-- Lock the publication row before capacity checks to serialize concurrent guest replies.
create or replace function public.uri_rsvp_respond(
 p_token text,p_response text,p_plus_ones integer default 0,p_answers jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer
set search_path = '' as $$
declare g public.uri_guest_tokens%rowtype;
 p public.uri_publications%rowtype; d public.uri_drafts%rowtype;
 v_capacity integer; v_household_limit integer; v_confirmed integer;
 v_household_seats integer; v_questions jsonb; v_answers jsonb:='{}'::jsonb;
 v_q jsonb; v_key text; v_val text; v_deadline text;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$'
    or p_response not in ('attending','declined') or p_plus_ones is null
    or p_plus_ones not between 0 and 5
    or jsonb_typeof(p_answers) <> 'object'
    or octet_length(p_answers::text)>12000 then
   raise exception 'Invalid RSVP request.';
 end if;
 select * into g from public.uri_guest_tokens
  where token_hash=pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_token,'UTF8'),'sha256'),'hex') and active=true;
 if not found then raise exception 'Invitation not found.'; end if;
 select * into p from public.uri_publications
   where owner_id=g.owner_id and local_event_id=g.local_event_id and published=true
   for update;
 if not found then raise exception 'Invitation unavailable.'; end if;
 select * into g from public.uri_guest_tokens
  where owner_id=g.owner_id and local_event_id=g.local_event_id and guest_id=g.guest_id and active=true
  for update;
 if not found then raise exception 'Invitation unavailable.'; end if;
 select * into d from public.uri_drafts
   where owner_id=g.owner_id and local_event_id=g.local_event_id;
 if not found then raise exception 'Invitation unavailable.'; end if;
 v_deadline := coalesce(p.payload->>'deadline','');
 if v_deadline ~ '^\d{4}-\d{2}-\d{2}$'
    and (now() at time zone 'Asia/Manila')::date > v_deadline::date then
   raise exception 'The RSVP deadline has passed.';
 end if;
 if p_response='attending' and p_plus_ones>g.plus_ones_allowed then
   raise exception 'Additional guest limit exceeded.';
 end if;
 if p_response='declined' then p_plus_ones:=0;end if;
 v_questions:=coalesce(d.payload #> '{rsvpSettings,questions}','[]'::jsonb);
 if jsonb_typeof(v_questions)<>'array' then v_questions:='[]'::jsonb; end if;
 if p_response='attending' then
  for v_q in select value from jsonb_array_elements(v_questions) loop
   v_key:=left(coalesce(v_q->>'id',''),64);
   if v_key='' then continue;end if;
   v_val:=trim(coalesce(p_answers->>v_key,''));
   if length(v_val)>400 then raise exception 'Answer too long.';end if;
   if coalesce((v_q->>'required')::boolean,false) and v_val='' then
      raise exception 'Please answer all required questions.';
   end if;
   if v_q->>'type'='choice' and v_val<>'' and not exists(
     select 1 from jsonb_array_elements_text(coalesce(v_q->'options','[]'::jsonb)) x where x.value=v_val
   ) then raise exception 'Invalid answer choice.';end if;
   v_answers:=v_answers||jsonb_build_object(v_key,v_val);
  end loop;
 end if;
 if p_response='attending' then
   v_capacity:=coalesce(nullif(d.payload #>> '{rsvpSettings,capacity}','')::integer,0);
   if v_capacity>0 then
     select coalesce(sum(1+plus_ones_confirmed),0) into v_confirmed
       from public.uri_guest_tokens
       where owner_id=g.owner_id and local_event_id=g.local_event_id
         and guest_id<>g.guest_id and active=true and status='attending';
     if v_confirmed+1+p_plus_ones>v_capacity then raise exception 'Event capacity reached.';end if;
   end if;
   if g.household_id<>'' then
    select coalesce((h.value->>'seatLimit')::integer,0) into v_household_limit
    from jsonb_array_elements(coalesce(d.payload->'households','[]'::jsonb)) h
    where h.value->>'id'=g.household_id limit 1;
    if coalesce(v_household_limit,0)>0 then
      select coalesce(sum(1+plus_ones_confirmed),0) into v_household_seats
       from public.uri_guest_tokens where owner_id=g.owner_id
         and local_event_id=g.local_event_id and household_id=g.household_id
         and guest_id<>g.guest_id and active=true and status='attending';
      if v_household_seats+1+p_plus_ones>v_household_limit then
        raise exception 'Household seat limit reached.';
      end if;
    end if;
   end if;
 end if;
 update public.uri_guest_tokens set
   status=p_response,plus_ones_confirmed=p_plus_ones,answers=v_answers,
   responded_at=now(),updated_at=now()
   where owner_id=g.owner_id and local_event_id=g.local_event_id and guest_id=g.guest_id;
 return jsonb_build_object('status',p_response,'plusOnesConfirmed',p_plus_ones,
   'message','Your RSVP has been saved.');
end $$;
revoke all on function public.uri_rsvp_respond(text,text,integer,jsonb) from public;
grant execute on function public.uri_rsvp_respond(text,text,integer,jsonb) to anon,authenticated;
