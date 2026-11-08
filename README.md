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

## Reference-inspired wedding refinement

- **Romantic Botanical** uses a portrait-left, ivory-right cover, original vector botanical flourishes, delicate italic names, a framed story letter, a countdown, and a circular photo detail when the gallery feature is enabled.
- **Minimalist Editorial** uses a stationery-inspired three-column cover (details, central photo and names, timeline), handwritten headings, fine borders, and a second full-width monogram/photo/story spread.
- Both templates use the same editable wedding content and feature controls. Timeline/details previews in the Editorial cover automatically hide or change when those features are disabled.
- Layouts use responsive container rules; the editor and full-page previews now retain true desktop (1024px/1080px) or mobile (390px) layout widths, scaling their visual presentation to fit the screen. The supplied example photographs are visual references only and are not included as production assets; users upload their own photos.
- Code-level regression checks run under `tests/wedding-template-smoke.cjs`. Real browser and device visual QA remains outstanding.

## UI polish review

A source-based design review identified a narrow builder workspace and a desktop-preview fidelity issue: the preview could unintentionally reflow to the mobile layout. The creator workspace has been widened, editing controls and mobile form fields standardized, and fixed-width scaled previews implemented in both the editor and full-page views. Wedding hero and story layout variants now have explicit styling, and feature reordering preserves scroll and keyboard focus.

The wedding landing page now presents two balanced template cards. Photo placeholders, editorial details, botanical typography, gallery controls, and preview toolbars have been refined through `ui-polish.css`. A new `tests/ui-polish-smoke.cjs` suite checks preview sizing and core styling.

**Verification limitation:** Live GitHub Pages and browser screenshots were unavailable to this session. JavaScript syntax, source-level structure, and simulated flows were checked; pixel-accurate visual QA on real devices is still outstanding.

## Wedding Builder: six upgrades

1. **Feature Manager 2.0:** enable/disable sections, move up/down, and drag on desktop. The default order is Welcome / Hero, Our Story, Photo Gallery, Wedding Countdown, Event Details, Event Timeline, Dress Code (off), Gift Registry (off), RSVP.
2. **Layout variants:** every feature has multiple presentation choices. Variant preferences are stored separately per template.
3. **Photo Manager:** upload, replace, remove, rearrange, select landscape/square/portrait crop format, choose focal point and alt text; eight-photo gallery limit in the browser prototype.
4. **Design Manager:** independently customize each template's background, text and accent colors; choose heading and body fonts and section spacing.
5. **Modular template renderer:** shared feature data and separate template styling; responsive live desktop/mobile previews.
6. **Cloud publishing integration:** A dedicated URI Supabase project is now connected, with a migrated RLS-protected publication table and public media bucket. Email redirect settings and live end-to-end sign-in, upload, and publishing tests still need to be completed.

## Wedding creation reliability pass (November 2026)

- Template selection now previews the actual couple names, event date, and cover photograph when available. Switching styles in the Design Manager shows the same wedding content in both choices.
- The wizard's **Personal Touch** step can optionally accept a cover photograph. Images are validated, resized and compressed for local draft storage. Upload failures preserve the previous photograph; users may skip the photo and add one later.
- An enabled photo gallery with no images is hidden from the invitation until a photo is uploaded. The feature stays enabled and reappears in its saved position once images are added.
- Node-based coverage includes all **42 feature/layout combinations** across the two templates, empty-gallery handling, disabled sections, feature order, HTML escaping, optional photo upload, and draft recovery.
- `tests/browser-wedding.cjs` adds real Chromium automation for creating a wedding, uploading pictures, customizing designs, reordering features, editing gallery crops, checking mobile overflow, saving, reloading, and capturing screenshots. The GitHub Actions workflow installs Chromium and runs the browser checks; browser execution results need to be verified independently.

**Verification limits:** A browser-connected UI was unavailable during this change. Source-level JavaScript and simulated interactions were checked, but the new GitHub Actions browser test results and pixel-level screenshots have not yet been inspected. The cloud publishing and guest RSVP flows remain separate work.

## Wedding creation UX (Stage 1)

A five-step guided setup now runs **Template → Couple → Date & venue → Message → Review**. Saving opens the editor directly, with Content → Features → Design → Photos → Publish tabs, local save feedback, a readiness summary, and a full-page desktop/mobile preview. Unfinished setup is stored locally so it can be resumed. The full-page preview is **not a published link**. Automated smoke tests cover the complete setup/edit/preview journey, but real-device visual testing is still pending.

## Other existing prototype functionality

- Wedding-focused homepage and five-step wedding setup: Design → Couple → Details → Message → Review
- Event dashboard with multiple locally stored invitations
- Local guest list and same-browser RSVP test links and counts
- Local browser autosave, inline field validation, and draft recovery across browser restarts in the wedding wizard

## Wedding creation and editing flow

1. Choose a wedding template from the homepage or start from **Create Wedding**.
2. Complete the five-step wedding setup. Details are saved as an **unfinished draft in browser localStorage** and can be resumed after reopening the site in the same browser.
3. Select **View full wedding website** to inspect the draft before saving.
4. Select **Save & customize** to create a local event and enter the wedding website editor directly, starting on **Content**.
5. Use **Content → Features → Design → Photos → Publish**. Each page has previous/next navigation and a local autosave status.
6. Select **Full-page preview** to view the complete wedding site with desktop/mobile toggles. The preview is not a publication.

The interface is wedding-focused while the other event types remain deferred. Photos and local drafts are still browser-specific. Supabase setup and secure cross-device RSVP are not part of the frontend UX cleanup.

## Where to edit

- `index.html` — entrypoint, homepage, wizard, router and legacy dashboard
- `wedding.css`, `wedding.js` — existing wedding compatibility layer
- `builder-core.js`, `builder.css` — reusable wedding engine and styling
- `builder-editor.js` — Content, Features, Design and Publish controls
- `builder-photos.js` — local photo uploads and image editing controls
- `wedding-flow.js`, `wedding-flow.css` — five-step wedding wizard, draft recovery, editor flow and full-page preview
- `cloud-config.js` — **public** Supabase URL/key placeholder
- `cloud.js` — optional cloud publishing and public URL loading
- `supabase/schema.sql` and `supabase/SETUP.md` — database setup and security guidance
- `ROADMAP.md` — development milestones

## Critical limitations

**Not production-ready.** The cloud publication beta has a configured backend, but email authentication redirect settings and live publication tests remain pending. Local drafts and guest RSVP data stay in the current browser. Personalized guest links do not work across devices. The optional cloud layer publishes a **public snapshot** of the wedding website only: guest lists are omitted, and public photo files are stored in a public bucket. Real cross-device RSVP, secure guest tokens, private event visibility, payments, cloud-synced drafts, security testing and production data management are future milestones.

Never commit a service_role/secret key, API private key, personal token, or database password to this public repository.

## QA status

Syntax and simulated creation-flow checks were run for wedding setup, validation, draft recovery, local save, feature editing and preview navigation. GitHub Actions includes `tests/wedding-flow-smoke.cjs` alongside the modular builder smoke test. **Full rendered browser/device QA and GitHub Pages deployment verification are outstanding.**
