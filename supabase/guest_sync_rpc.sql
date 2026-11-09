-- Preserve server-recorded RSVP replies when owner synchronizes guest metadata.
-- Security invoker + owner RLS; no anonymous access.
create or replace function public.uri_sync_guest_tokens(p_event_id text,p_guests jsonb)
returns integer language plpgsql security invoker
set search_path='' as $$
declare v_user uuid; g jsonb; n integer:=0;
begin
 v_user:=(select auth.uid());
 if v_user is null then raise exception 'Sign in required.';end if;
 if jsonb_typeof(p_guests)<>'array' or jsonb_array_length(p_guests)>500 then
  raise exception 'Invalid guest list.';end if;
 if not exists(select 1 from public.uri_drafts d where d.owner_id=v_user and d.local_event_id=p_event_id) then
  raise exception 'Draft not found.';end if;
 for g in select value from jsonb_array_elements(p_guests) loop
  if length(coalesce(g->>'guest_id','')) not between 1 and 100
     or length(coalesce(g->>'name','')) not between 1 and 120
     or coalesce(g->>'token_hash','') !~ '^[a-f0-9]{64}$'
     or length(coalesce(g->>'email',''))>160
     or length(coalesce(g->>'household_id',''))>100
     or coalesce((g->>'plus_ones_allowed')::integer,0) not between 0 and 5 then
    raise exception 'Invalid guest metadata.';end if;
  insert into public.uri_guest_tokens(
   owner_id,local_event_id,guest_id,token_hash,name,email,household_id,plus_ones_allowed,active
  ) values(
   v_user,p_event_id,g->>'guest_id',g->>'token_hash',g->>'name',
   coalesce(g->>'email',''),coalesce(g->>'household_id',''),
   coalesce((g->>'plus_ones_allowed')::integer,0),true
  )
  on conflict(owner_id,local_event_id,guest_id)
  do update set token_hash=excluded.token_hash,name=excluded.name,
     email=excluded.email,household_id=excluded.household_id,
     plus_ones_allowed=excluded.plus_ones_allowed,active=true,updated_at=now();
  n:=n+1;
 end loop;
 delete from public.uri_guest_tokens t
 where t.owner_id=v_user and t.local_event_id=p_event_id
   and not exists(select 1 from jsonb_array_elements(p_guests) g
     where g.value->>'guest_id'=t.guest_id);
 return n;
end $$;
revoke all on function public.uri_sync_guest_tokens(text,jsonb) from public,anon;
grant execute on function public.uri_sync_guest_tokens(text,jsonb) to authenticated;
