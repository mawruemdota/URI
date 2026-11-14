# URI Event Operations 2026-11

This release adds features **1, 2, 4, 5, 6, 7 and 8**, without implementing feature 3 (new event types).

## First-time setup
URI still uses GitHub Pages for the app and Supabase for accounts, private drafts, guests, and publishing. The committed SQL files \`supabase/event_operations_20261114.sql\` and \`supabase/event_operations_cohost_email_20261114.sql\` are applied to the connected URI Supabase project. The public \`uri-share\` Edge Function lives in \`supabase/functions/uri-share/index.ts\` and is deployed with \`verify_jwt=false\`. It fetches only publicly published event data through the published-only RLS policy.

## Invitation cards and sharing
Open an existing wedding event → **Preview & share** → **Invitation Sharing 2.0**. Choose Portrait (1080×1350), Square (1080×1080), or Story (1080×1920), then download PNG. Design uses the current template's palette, names, date, venue and cover image; a QR code is added after publication. The QR generator is pinned to \`qrcodejs@1.0.0\` and requires network access to its CDN. Where the browser cannot load a cross-origin photograph with CORS, an intentional illustrated fallback is rendered.

For rich metadata, use **Copy rich-preview link**. A published invitation may be shared through:
\`https://sclthfeqievigrcjoohh.supabase.co/functions/v1/uri-share?slug=<event-username>\`
Social crawlers receive Open Graph title, date/venue description and the published cover image (if it is in public URI storage); human browsers are redirected to the actual event page. This is not yet the final custom-domain \`/username\` sharing experience. Migrating away from GitHub Pages project hosting is required for HTTP-200 direct-event routes with per-event metadata.

## Guest tracking and event dashboard
**Guests & RSVP** now includes delivery tracking: mark **Sent** after manually sending a personalized link, and **Reminded** after your follow-up. No SMS, Messenger, email, or WhatsApp message is sent automatically. Sent/reminder timestamps are stored in private cloud draft data. **Event operations** shows RSVP response rate, confirmed seats, pending replies, and attendance. Refresh online responses and attendance to retrieve current server values.

## QR check-in
1. Sign in to Cloud and synchronize the event and guests.
2. In **Guests & RSVP**, select **Guest QR pass** for a guest. The PNG contains a separate 64-character cryptographically random check-in token, **not** their RSVP token.
3. On the event day, sign in as owner or accepted check-in staff, go to **Event operations** (or the staff-specific invitation in Cloud) and scan the guest pass.
4. On supported cameras/browsers, use **Start QR camera**. Otherwise, scan externally and paste the QR content into the manual check-in field.
5. The authenticated Supabase RPC checks event membership, matches the hash, and records one attendance row. Repeat scans indicate that a guest has already arrived.

Treat QR guest passes as private credentials. They identify a pass, not necessarily the person holding it. Event staff should verify the guest name if necessary. Camera scanning depends on browser support for \`BarcodeDetector\`; the paste fallback works across browsers.

## Style Studio 2.0
From the event editor → **Design**, select from six art-direction packs (Ivory & Gold, Sage Garden, Midnight Rose, Terracotta, Ink & Paper, Soft Lavender). Each preset updates palette, font pair and section layout variants while preserving event content and photos. Existing detailed controls and reusable template recipes remain available.

## Cohost access
1. Cohost must first sign in to URI with their own email address at least once.
2. Event owner must save the event to Cloud (requires an existing cloud revision).
3. **Event operations → Collaborators & event staff:** enter the cohost's email and select **Editor** or **Check-in staff**.
4. The invited person signs in with that email, opens **Cloud → Invitations to cohost**, and accepts the pending invitation.
5. Editors can restore and edit the shared cloud draft and manage guests. Check-in-only staff can scan passes but cannot view the full private draft or publish.
6. **Only the owner can publish/unpublish or invite/remove cohosts.** Owners may revoke collaborators. Up to 10 collaborators are supported per event.

Sharing an event does not send an email automatically. Owners must tell their cohosts to sign in and accept. Concurrent editors use revision-based conflict detection; if two editors change the same draft, restore the current cloud copy before saving again. No background auto-merge is implemented.

## Security and operational limits
- Private guest response tokens and check-in tokens are **not included** in public publication payloads or social previews.
- Check-in hashes are stored in \`uri_guest_tokens\`, and attendance in \`uri_guest_checkins\`; both require server-side authorization.
- Member invitations and attendance tables have RLS enabled. Anonymous users cannot select them. Only the authenticated membership-management/check-in RPCs can write them.
- Drafts cached for a cohost are tagged with the exact user account and should not appear under a different login.
- The public Edge Function only reads published rows and embeds escaped HTML metadata.
- Browser tests use simulated Supabase/CDN data. Before handling a real event, manually test two distinct accounts, revocation, simultaneous edits, guest check-in and social crawler previews under the actual deployment.
