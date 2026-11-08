# URI — You Are Invited

URI is a responsive digital invitation and RSVP **prototype**, currently focused on a modular wedding website builder.

## Run and test

Open the live site when GitHub Pages is enabled: **https://mawruemdota.github.io/URI/**.

To run it locally, serve the repository root with a static web server, e.g. `python -m http.server 8000`, then open `http://localhost:8000`.

## Wedding template collection

Two wedding styles inspired by the owner's supplied visual references:

- **Romantic Botanical** — warm ivory, botanical decoration, portrait/photo column, elegant Cormorant Garamond typography.
- **Minimalist Editorial** — black-and-white editorial columns, couple's monogram, handwriting-inspired Allura heading style, structured boxes.

Both styles use the **same underlying event data and the same nine features**. Switching templates does not delete the entered content.

## Wedding Builder: six upgrades

1. **Feature Manager 2.0:** enable/disable sections, move up/down, and drag on desktop. The default order is Welcome / Hero, Our Story, Photo Gallery, Wedding Countdown, Event Details, Event Timeline, Dress Code (off), Gift Registry (off), RSVP.
2. **Layout variants:** every feature has multiple presentation choices. Variant preferences are stored separately per template.
3. **Photo Manager:** upload, replace, remove, rearrange, select landscape/square/portrait crop format, choose focal point and alt text; eight-photo gallery limit in the browser prototype.
4. **Design Manager:** independently customize each template's background, text and accent colors; choose heading and body fonts and section spacing.
5. **Modular template renderer:** shared feature data and separate template styling; responsive live desktop/mobile previews.
6. **Cloud publishing integration:** A dedicated URI Supabase project is now connected, with a migrated RLS-protected publication table and public media bucket. Email redirect settings and live end-to-end sign-in, upload, and publishing tests still need to be completed.

## Other existing prototype functionality

- Responsive homepage and six-step invitation creation wizard
- Event dashboard with multiple locally stored invitations
- Local guest list and same-browser RSVP test links and counts
- Browser-based autosave and draft recovery in the wizard

## Where to edit

- `index.html` — entrypoint, homepage, wizard, router and legacy dashboard
- `wedding.css`, `wedding.js` — existing wedding compatibility layer
- `builder-core.js`, `builder.css` — reusable wedding engine and styling
- `builder-editor.js` — Content, Features, Design and Publish controls
- `builder-photos.js` — local photo uploads and image editing controls
- `cloud-config.js` — **public** Supabase URL/key placeholder
- `cloud.js` — optional cloud publishing and public URL loading
- `supabase/schema.sql` and `supabase/SETUP.md` — database setup and security guidance
- `ROADMAP.md` — development milestones

## Critical limitations

**Not production-ready.** The cloud publication beta has a configured backend, but email authentication redirect settings and live publication tests remain pending. Local drafts and guest RSVP data stay in the current browser. Personalized guest links do not work across devices. The optional cloud layer publishes a **public snapshot** of the wedding website only: guest lists are omitted, and public photo files are stored in a public bucket. Real cross-device RSVP, secure guest tokens, private event visibility, payments, cloud-synced drafts, security testing and production data management are future milestones.

Never commit a service_role/secret key, API private key, personal token, or database password to this public repository.
