# URI Cloud Publishing Setup (Supabase)

This is **optional beta infrastructure**. Without these steps the wedding builder works entirely in local browser storage. Do not use for real guest responses until the separate secure RSVP backend is implemented and security-tested.

## 1. Create your Supabase project
Create a Supabase project in your own account. Keep the project database password, secret keys, and service_role key private.

## 2. Install the database schema
Open **SQL Editor** inside Supabase and run the full contents of `supabase/schema.sql`.
This creates:
- `public.uri_publications` — published website snapshots, with owner access and read-only published visibility.
- `uri-wedding-public` — a **public** media bucket, with owner-scoped upload permissions.

The bucket is intentionally public, because published wedding website images are viewable by visitors. **Never put private or confidential photographs in it.** Publishing a new version can leave unused old uploads in storage; cleanup is not implemented yet.

## 3. Configure email authentication
In Supabase Authentication settings, enable email sign-in and configure the allowed Site URL / redirect URL:
`https://mawruemdota.github.io/URI/`

The current app requests an email magic link. Email delivery may have rate limits until you configure your own email provider. After clicking the magic link, return to your event's Publish tab.

## 4. Connect your public frontend
Edit `cloud-config.js` in the public GitHub repository:

```js
window.URI_CLOUD_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',
  publishableKey: 'YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY'
};
```

The URL and the **publishable/anon key** are designed for client-side use when RLS is correctly configured. **Never paste a secret, service_role key, database password, or any private token into a public repository.**

## 5. Publish and test
1. Enable GitHub Pages from `main` and `/(root)`, if not already enabled.
2. Open `https://mawruemdota.github.io/URI/`.
3. Create a Wedding event, then open **Edit Invitation → Publish**.
4. Sign in, and publish your invitation.
5. Open the generated public URL in a different browser or private window.
6. Edit a section, then **publish again** for that change to appear on the public website.
7. Test **Unpublish**, then confirm the public link becomes unavailable.

## Important limitations
- Local drafts are still stored in browser localStorage; signing in does not automatically sync or import them between browsers.
- The public page is a snapshot of editable wedding feature content and public image links; editing requires republishing.
- Guest lists and private personalized RSVP links are **not included in the public publication data**.
- The legacy local guest RSVP flow is only a same-browser demo, not a production RSVP system.
- This beta does not provide moderation, abuse prevention, asset garbage collection, private media, data portability, full account security review, or a deletion/export UI.
- The GitHub Pages URL and public Supabase project must both be configured.
- The SQL policies and authenticated/public boundaries need real database security tests before inviting real users.

## Technical references
- [Supabase JavaScript setup](https://supabase.com/docs/reference/javascript/installing)
- [Supabase Auth magic links](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
