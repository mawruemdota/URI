-- Show invited cohost email addresses only to the event owner and invitee.
alter table public.uri_event_members
 add column if not exists member_email text not null default '';

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
 select id into v_member from auth.users where lower(email)=v_email limit 1;
 if v_member is null then raise exception 'The cohost must first sign in to URI using this email';end if;
 if v_member=v_owner then raise exception 'The owner already manages this event';end if;
 if (select count(*) from public.uri_event_members m where m.owner_id=v_owner
  and m.local_event_id=p_event_id and m.member_id<>v_member)>=10
 then raise exception 'Maximum of 10 collaborators per event';end if;
 insert into public.uri_event_members(owner_id,local_event_id,member_id,member_email,role)
 values(v_owner,p_event_id,v_member,v_email,p_role)
 on conflict(owner_id,local_event_id,member_id) do update
 set role=excluded.role,member_email=excluded.member_email,
 accepted_at=case when uri_event_members.role=excluded.role then uri_event_members.accepted_at else null end,
 invited_at=now();
 return jsonb_build_object('memberId',v_member,'role',p_role,'email',v_email);
end $$;
revoke all on function public.uri_invite_cohost(text,text,text) from public,anon;
grant execute on function public.uri_invite_cohost(text,text,text) to authenticated;
