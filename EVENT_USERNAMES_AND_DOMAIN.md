# URI public event usernames and custom domain

## Editable event links

For each wedding, open **Edit invitation → Publish**. Choose a unique public username such as `maya-and-emir`, sign in, then **Publish invitation**.

A published event has a public URL of the form:

- Current GitHub Pages address: `https://mawruemdota.github.io/URI/maya-and-emir`
- After connecting an owned custom domain: `https://uri.ph/maya-and-emir` (example only; domain availability/ownership not confirmed)

The public username is scoped to **one event**, not the creator's account. Two events cannot use the same username. Allowed: 3–32 lowercase letters, numbers, single hyphens; no leading/trailing hyphen or double hyphens. Reserved app paths are blocked. Validation runs in the client **and** in the Supabase table CHECK constraint; uniqueness is enforced by the existing UNIQUE(slug) constraint.

The owner may edit a draft username before signing in. The selected address becomes live only after successful cloud publication. Editing the username on a published event requires **Publish updates**; changing it removes access through the old slug, including previously shared guest links. The app asks for confirmation.

Existing `#public/<legacy slug>` invitation URLs remain usable. Old legacy slug strings remain accepted by the database migration.

## Hosting route behavior

The current GitHub Pages project URL is served under `/URI/`, and a future custom domain would normally serve from `/`.

GitHub Pages has no rewrite rule for arbitrary dynamic paths. A `404.html` fallback serves the client-side app at `/username`, preserving the URL and allowing in-browser opening and refresh. **The initial request still returns HTTP 404**. This may affect social media link previews, search indexing and automated preview bots. This behavior is a technical limitation of GitHub Pages, not a missing database row.

For a commercial release where `/username` must return **HTTP 200** reliably, deploy the same static app to a rewrite-capable host (e.g., Cloudflare Pages with SPA fallback). Keep the domain at Namecheap; only change DNS. Do not create a `CNAME` file for `uri.ph` until the domain has actually been registered and the owner confirms the hostname.

## Backend setup

The connected URI Supabase project was updated using the `uri_editable_public_event_usernames` migration. For a new database, use the current `supabase/schema.sql`. To upgrade an older schema manually, use `supabase/username-migration.sql`.

The client never sends a service-role key. The existing owner-only RLS and globally unique slug constraint remain unchanged. Guest tokens never appear in the public invitation payload.

## Namecheap setup after domain registration

1. In Namecheap's Advanced DNS, point the apex domain at GitHub Pages' documented A records, and add `www` as a CNAME to `mawruemdota.github.io`. Existing DNS records must be reviewed before removing them.
2. In **GitHub → mawruemdota/URI → Settings → Pages**, set the verified custom domain and enable HTTPS when available.
3. Verify `https://yourdomain/username` and `https://www.yourdomain/username` on a guest device, refreshing directly, as well as RSVP links.
4. If Facebook/Instagram unfurl previews or SEO matter, switch to a static host with an HTTP-200 SPA fallback.

## Automated checks

`node tests/public-usernames-browser.cjs` checks the app under Chromium and WebKit, with a mocked Supabase client and simulated GitHub Pages 404 fallback. It verifies event routing, refresh, unknown events, old hash URLs, owner draft editing and reserved usernames. It uses **no live guest data**.
