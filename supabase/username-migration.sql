-- URI editable public event usernames (safe for existing opaque legacy slugs).
-- Apply once to the connected URI Supabase project. The UNIQUE(slug) index and
-- existing owner-only UPDATE/INSERT RLS policies remain intact.
alter table public.uri_publications
  drop constraint if exists uri_pub_slug_format;

alter table public.uri_publications
  add constraint uri_pub_slug_format check (
    (
      slug ~ '^[a-z0-9]([a-z0-9-]{1,30})[a-z0-9]$'
      and slug !~ '--'
      and slug not in (
        'home','dashboard','create','cloud','event','events','invite','invites',
        'public','rsvp','admin','login','logout','signup','settings','account',
        'api','assets','static','preview','pricing','features','templates',
        'about','terms','privacy','help','contact','support','www','uri','index','404'
      )
    )
    or slug ~ '^uri-[a-z0-9-]{12,80}$'
  );
