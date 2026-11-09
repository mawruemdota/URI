# URI — You Are Invited

URI is a responsive digital invitation and RSVP **prototype**, currently focused on a modular wedding website builder.

## Run and test

Open the live site when GitHub Pages is enabled: **https://mawruemdota.github.io/URI/**.

To run it locally, serve the repository root with a static web server, e.g. `python -m http.server 8000`, then open `http://localhost:8000`.

## Wedding template collection

Four wedding styles:

- **Romantic Botanical** — warm ivory, botanical decoration, portrait/photo column, elegant Cormorant Garamond typography.
- **Minimalist Editorial** — black-and-white editorial columns, couple's monogram, handwriting-inspired Allura heading style, structured boxes.
- **Nightfall** — dark cinematic portrait, oversized condensed names, atmospheric gradients, and coral-red accents. Adapted from a MiroMiro review of the Dota 2 Abaddon page without reusing Valve art, logos, copy or fonts.
- **Adventure Invitation** — an original light 2D platformer with a controllable pixel-art explorer, themed worlds, and interactive information checkpoints. Phaser is lazy-loaded only when visitors play; standard invitation content remains accessible as HTML.

All four styles use the **same underlying event data and the same nine built-in features**. Switching templates does not delete the entered content. Adventure also supports custom sections as additional checkpoints.

## Adventure Invitation 1.0 (November 2026)

Adventure Invitation is a fourth selectable design in the wedding wizard and editor. It is an **original 2D platformer** rather than a copy of a Nintendo game. It contains no Mario characters, Nintendo assets or copyrighted game music.

**Gameplay:** An accessible continuous side-scrolling level with keyboard arrows / WASD, Space/Up to jump, E to interact, on-screen movement buttons or a mobile virtual joystick, optional collectible memories, and accessible checkpoint signs. Visitors walk through the enabled URI invitation sections, with a World Map for jumping directly to any section. There are **no enemies, lives or game-over screens**. On game-engine errors, reduced device capability or guests preferring not to play, **View all invitation information without playing** provides native HTML access to every section, including venue, directions and RSVP instructions. Interactive information panels use regular HTML so text is selectable, readable and accessible to assistive technologies.

**Game Template Manager:** In **Edit Invitation → Design → Game Template Manager**, choose one of three original world palettes (Meadow Journey, Sunset Village or Starlight Kingdom), one of three original character looks (Explorer, Celebration Guest or Dreamer), mobile movement (buttons or joystick), movement speed and collectibles. Editing feature visibility/order in the regular **Features** tab changes the in-world checkpoints; custom sections become checkpoints too. The world uses the shared content and existing Animation, Music and Background Manager data. The owner editor starts in static preview mode until **Play adventure** is selected.

**RSVP:** When the wedding is cloud-published and the owner chooses **Copy online RSVP link**, Adventure creates a personalized game URL (`#public/<slug>?rsvp=<token>`) instead of sending guests directly to the RSVP form. A bearer token stays in the URL fragment (not in HTTP requests). The RSVP checkpoint then provides **RSVP now**, linking to URI's existing token-protected response form. A generic public game URL without a guest token does not expose any guest-specific action or information. Never share personal links publicly.

**Technology:** Phaser **3.90.0** (MIT-licensed) is pinned in a lazy-loaded CDN URL and used only for gameplay; URI's HTML/CSS site continues to run on GitHub Pages. The game falls back to static details if the Phaser CDN is unavailable. All graphics are original procedural pixel art; no external sprites or audio files are shipped. Game worlds, character settings and feature checkpoints persist in local/cloud drafts and publication payloads.

**Tests:** `tests/adventure-smoke.cjs` verifies rendering, safety, world settings, checkpoint ordering, and shared data. `tests/browser-adventure.cjs` uses a real Phaser installation in CI to test movement, checkpoint overlays, keyboard controls, full-page preview and mobile viewport screenshots. Real iOS Safari/Android Chrome testing, game performance on older devices, and production end-to-end guest RSVPs still require manual acceptance.

## Cross-device drafts and secure guest RSVP (2026-11-09)

URI now includes a dedicated **Cloud** workspace (desktop and mobile navigation) for account sign-in, explicit first-time import of local drafts, cloud saves, and restoring saved invitations on another device. Supabase owns the data, with owner-only RLS access. After a draft is linked to an account, normal edits sync to the cloud after a short delay; offline changes remain locally and sync on reconnection. Version numbers detect concurrent edits, avoiding silent overwrites. A manual **Restore cloud copies** action is available when versions conflict. **First-time local-only drafts require clicking Save local drafts to cloud** so they are not silently uploaded into the wrong account. Drafts already linked to another user are blocked from cross-account uploads.

Guest management now supports **Copy online RSVP link** per invited guest after the owner signs in and publishes. Each guest gets a cryptographically random 256-bit bearer token in a hash URL (`#rsvp/<token>`); only SHA-256 token hashes are stored in the guest table. The guest's reusable link works on another browser and does not require a guest account. The RSVP page exposes only their own name, event name, venue/date, allowed plus-ones, questions, and their own response. Submissions are validated server-side for attendance, plus-one allowances, required responses, deadline, total event capacity and household seat limits, with a database lock preventing concurrent overbooking. Owner-only guest rows and draft rows are inaccessible directly by anonymous users.

The private cloud guest table, `public.uri_guest_tokens`, stores guest responses. Owner synchronization changes guest metadata while **preserving** responses already received online. In the Guests & RSVP tab, **Refresh online responses** retrieves those results, so the host can view updated totals and guest details. The legacy **Test RSVP / Copy test URL** remains explicitly browser-local and must not be used for public invitations. No email or messaging is sent automatically; hosts share the copied personal links themselves.

**Activation:** Use the Cloud page to sign in by email magic link. Configure the deployed URI URL as a Supabase Auth allowed redirect URL, then save/import drafts. Under Edit Invitation → Publish, publish the wedding; under Guests & RSVP, copy a guest's online link. Editing the invitation still requires republishing the public snapshot. Guest responses themselves write to the shared database.

**Data and security:** New SQL is in `supabase/cloud_drafts_rsvp.sql` and `supabase/guest_sync_rpc.sql`. They have been applied to the connected URI Supabase project. RLS protects private drafts/guests, and anonymous access is limited to carefully scoped token-protected lookup and response RPC functions. The Supabase linter flags these two deliberately public `SECURITY DEFINER` functions; this exception requires an independent security review, abuse/rate-limit protection, and production acceptance testing before using URI with real guests. Treat the bearer link as a secret: anyone who receives it can respond for that guest. Manual cross-device sign-in, publishing, account recovery, and actual user-based browser acceptance tests have **not** yet been completed because no test user accounts are configured.

**Tests:** `tests/cloud-sync-smoke.cjs` covers owner-bound draft versions, guest token hashing, response preservation, conflict protection, and simulated second-device restoration. Chromium tests cover the Cloud workspace and invalid link presentation. Production-grade account/session audits, deletion lifecycle, account switching, throttling and privacy compliance must be completed before public launch.

## Background images and music (November 2026)

**Background Manager:** Under **Edit Invitation → Design → Page background**, choose theme color or background image. Upload a JPEG/PNG/WebP photo (resized and compressed for local storage), or provide a direct HTTPS image URL. For images, set image opacity, shading strength, shade color (theme/dark/light/accent), section surface opacity, blur, and image position. A single backdrop is layered underneath the invitation, while readable themed surfaces and text remain above it. Background settings are saved per template, so switching designs does not overwrite the previous design's image or treatments.

**Music Manager:** Under **Edit Invitation → Music**, enable/disable the public player, choose an autoplay *request*, select a loop mode (off/current track/whole playlist), set initial volume, and add, rename, remove or reorder up to 12 tracks. Tracks can use direct HTTPS audio file URLs or owner-uploaded MP3/M4A/OGG/WAV/WebM files (up to 15 MB) in Supabase. The guest player offers Play/Pause, Previous/Next and volume. Spotify, YouTube watch pages, and other non-audio links will not play as direct music files. External audio servers may restrict playback.

**Publishing:** Local background images are converted to public media URLs during cloud publishing; audio uploaded by a signed-in owner already uses a separate public bucket (`uri-wedding-audio`). Media URLs and playlist metadata are included in public invitation snapshots, but private guest lists are not. **Republish** for changes to appear on the public invitation. A track uploaded to the public bucket remains directly accessible by URL even if an invitation is unpublished or the track is removed from the playlist; secure asset cleanup and private media are future features.

**Browser autoplay restriction:** Enabling autoplay only requests playback. Safari, Chrome and other browsers may block audible audio before a user gesture; the player then displays a Play prompt. Autoplay is disabled by default and is suppressed within the editor preview. No copyrighted music files are shipped with URI; owners must have the rights to publicly use audio they upload.

**QA:** `tests/theme-media-smoke.cjs` validates data safety, styling configuration, playlist settings, template switching, publication fields and local persistence. `tests/browser-wedding.cjs` exercises the background upload and music editor in real Chromium. Safari/iOS and Android device checks, production music streaming and cross-browser autoplay still need independent real-device verification.

## Animation Manager 1.0 (November 2026)

The Wedding Builder's **Design** tab now includes an **Animation Manager** with four options: None, Elegant, Cinematic, and Playful. Users can set animation speed (0.5× to 1.5×) and independently toggle **page entrance**, **scroll reveals**, **photo movement**, **button interactions**, and **animated decorations**. A **Play animation** button in the editor preview deliberately replays the effects while keeping ordinary editing static and predictable.

Animation preferences are saved alongside each event in browser storage, preserved while switching wedding designs, and included in public publication snapshots. New invitations start on the subtle Elegant preset; older invitations without animation configuration remain static until an owner chooses a preset. The live website and full-page previews mount the animations automatically.

The implementation is **CSS-first with optional GSAP enhancement** for cinematic section reveals. When the GSAP CDN is unavailable, CSS transitions and browser-native IntersectionObserver remain available. When IntersectionObserver or JavaScript animation features are unavailable, the invitation content must remain visible. The operating system's `prefers-reduced-motion` setting takes precedence over event animation options. Animations affect only the presentation of invitation sections, never original photo crop transforms or guest lists.

Source: `animation.js`, `animation.css`. QA: `tests/animation-smoke.cjs` and the Chromium walkthrough in `tests/browser-wedding.cjs`. Confirmed GitHub Actions smoke, Chromium, and Pages deployment passed at commit `bf42ee226661fc0694d9496ab1e57dda58641ce3`. Lottie assets and an interactive envelope-opening experience are **not included** in this release. For future advanced visual builders, review GSAP licensing restrictions separately.

## Custom Builder, Visual Editing 2.0 and Template Studio

URI now supports six **custom section types** in addition to its nine built-in wedding sections: Text, Image, Video (YouTube/Vimeo), FAQ, Location and Button. Custom sections use the same data model, visibility, ordering, theme colors, and publication snapshot as existing features. Each template supplies its own responsive appearance.

The preview has owner-only controls for **Edit, Move Up, Move Down, Hide**, and **Duplicate** for independent custom sections. Clicking available noninteractive space opens editing. Sections can be restored without losing content; deletion requires confirmation.

The **Template Studio** under Design builds reusable custom design recipes from one of the three built-in structures. Paste MiroMiro-extracted design token JSON or CSS colors, optionally attach a source URL, then create or export a new style recipe. Recipes remain locally saved to this device and in event snapshots, not automatically synchronized across accounts. URI does not fetch or clone an arbitrary site from its frontend.

See [CUSTOM_BUILDER_GUIDE.md](CUSTOM_BUILDER_GUIDE.md) for the supported section fields, design token syntax, and limitations. Automated checks are in `tests/custom-builder-smoke.cjs` and the Chromium browser suite.

## Dynamic sections and template-aware layouts

URI currently offers **nine wedding sections**: Hero, Our Story, Photo Gallery, Countdown, Event Details, Event Timeline, Dress Code, Gift Registry, and RSVP. The default invitation enables all except Dress Code and Gift Registry. Empty galleries and timelines do not reserve space.

Under **Editor → Features**, active sections can be removed, reordered and assigned an appearance. Disabled sections appear under **Add a section**. Re-adding one restores its existing content. All sections share the same event data, so switching between Romantic Botanical, Minimalist Editorial and Nightfall does not delete details, photos, or other section settings.

The renderer (`URIBuilder.compose()`) builds a layout from the **actual visible sections**, not a fixed grid. Each template defines which sections can form adjacent pairs. When a partner section is removed, the remaining section expands to full width. The Editorial cover and template thumbnails independently hide the Details and Timeline side panels when those features are disabled. Mobile and desktop layouts are governed by `dynamic-sections.css`, loaded after the template styles.

The test suite `tests/dynamic-sections-smoke.cjs` checks **1,536 feature-visibility combinations** (512 configurations × three designs), section ordering, pairing, empty-content behavior, template switching, and Editorial cover reflow. The Chromium test also toggles and re-adds sections through the actual interface.

**Scope:** "Add a section" currently means selecting one of these nine built-in section types. A user-defined custom feature builder is not yet implemented.

## Nightfall — MiroMiro design reference

A third wedding theme, **Nightfall**, is available in the wedding setup and in the editor's Design tab. Its palette, typography hierarchy, and cinematic split-photo layout were studied from [Dota 2's Abaddon hero page](https://www.dota2.com/hero/abaddon) using MiroMiro. The resulting layout and CSS are original to URI and use only wedding-owner photographs; no game images, logos, or proprietary fonts are included.

Nightfall uses `Barlow Condensed` and `Montserrat`, a black-and-charcoal palette with `#ff6046` accent, and three hero layouts (split, centered, immersive). It supports the same nine editable sections as other templates; changing styles preserves photos, wedding details, feature order, and customizations. See [NIGHTFALL_DESIGN_REFERENCE.md](NIGHTFALL_DESIGN_REFERENCE.md).

Automated regression checks are in `tests/nightfall-template-smoke.cjs`, the 63-case `tests/template-matrix.cjs`, and the Chromium wedding journey. Physical-device visual verification is still needed.

## Reference-inspired wedding refinement

- **Romantic Botanical** uses a portrait-left, ivory-right cover, original vector botanical flourishes, delicate italic names, a framed story letter, a countdown, and a circular photo detail when the gallery feature is enabled.
- **Minimalist Editorial** uses a stationery-inspired three-column cover (details, central photo and names, timeline), handwritten headings, fine borders, and a second full-width monogram/photo/story spread.
- Both templates use the same editable wedding content and feature controls. Timeline/details previews in the Editorial cover automatically hide or change when those features are disabled.
- Layouts use responsive container rules; the editor and full-page previews now retain true desktop (1024px/1080px) or mobile (390px) layout widths, scaling their visual presentation to fit the screen. The supplied example photographs are visual references only and are not included as production assets; users upload their own photos.
- Code-level regression checks run under `tests/wedding-template-smoke.cjs`. Real browser and device visual QA remains outstanding.

## UI polish review

A source-based design review identified a narrow builder workspace and a desktop-preview fidelity issue: the preview could unintentionally reflow to the mobile layout. The creator workspace has been widened, editing controls and mobile form fields standardized, and fixed-width scaled previews implemented in both the editor and full-page views. Wedding hero and story layout variants now have explicit styling, and feature reordering preserves scroll and keyboard focus.

The wedding landing page presents three template cards. Photo placeholders, editorial details, botanical typography, gallery controls, and preview toolbars have been refined through `ui-polish.css`. A new `tests/ui-polish-smoke.cjs` suite checks preview sizing and core styling.

**Verification limitation:** Live GitHub Pages and browser screenshots were unavailable to this session. JavaScript syntax, source-level structure, and simulated flows were checked; pixel-accurate visual QA on real devices is still outstanding.

## Minimal interface copy pass

The homepage, wedding setup, builder, Photo Manager, dashboard, readiness checklist, and guest management now use shorter headings and fewer redundant helper captions. Decorative Unicode symbols were removed from visible controls and invitation content; important accessibility names, instructions and local-RSVP warnings remain. The Romantic Botanical template retains its original vector illustration as part of its core design. Styling refinements load through `minimal-ui.css`.

Automated JavaScript and simulated wedding-flow checks pass, but live desktop/mobile screenshots and device-specific visual review are not verified.

## Wedding Details 2.0 and Dashboard 2.0

### Flexible wedding information
Wedding ceremonies and receptions can now have **independent dates, start times, venue names, addresses, external HTTPS directions links and arrival instructions**. The ceremony continues using the existing `date`, `time`, `venue`, and `address` fields, preserving older weddings. The reception is optional and disabled until selected in Content.

A structured **Wedding timeline** replaces the old plain-text editor: add, edit, reorder and remove activities, with each activity's time, optional date, event location, and notes. Existing text timelines are automatically converted into editable activities on the next edit. Both wedding designs render the same data; disabling Wedding Timeline also hides it from the Editorial cover. New details and activities are included in publication snapshots; guest lists are excluded.

### Dashboard 2.0
The event dashboard now has preview-image cards, event date, last-edited information, and draft versus locally recorded published snapshot indicators. You can search, filter by draft/published status, sort by recent edits or event date, edit, preview, duplicate and delete local invitations.

Duplication preserves the wedding design and content but resets the duplicated invitation to **draft**, generates a new local event ID, and **does not copy guests or public publishing identifiers**. Deleting local data requires confirmation; invitations with a locally recorded published snapshot must be unpublished first. Deleting a draft in the browser does **not** delete any independently hosted public copy.

**Storage/security note:** Dashboard data stays in the same browser. Published-status badges reflect local saved metadata and are not a real-time database verification. The Dashboard does not synchronize accounts or guests across devices.

**Tests:** `tests/details-dashboard-smoke.cjs` covers older weddings, venues, map-link safety, activity schedules, publishing snapshots, duplication and deletion safeguards. `tests/browser-wedding.cjs` includes desktop/mobile navigation and automated browser scenarios for the new Content editor and Dashboard. Browser workflow execution, real-device checks, and screenshot inspection remain pending.

## Readiness, direct editing, and Guest Management / RSVP 2.0 (November 2026)

**Invitation readiness:** URI now displays a checklist and completion percentage in the editor and Dashboard 2.0. The Review tab separates required fields (names, valid wedding date, ceremony time and venue, valid RSVP deadline if specified, and enabled reception details) from optional suggestions (story, photos, map directions and local guest planning). "Fix" controls navigate to relevant editing fields. The frontend publish action refuses to proceed while required details are missing; production validation must also be enforced by the future backend.

**Direct preview editing:** Only the private editor preview gets Edit controls on the wedding names, story, ceremony/reception venues, timeline activities, and each section. These shortcuts navigate to the matching Content, Photos, or Guests editor controls; the public invitation remains presentation-only. Photo edit controls continue to open the non-destructive crop dialog.

**Guests & RSVP 2.0 — local testing:** The Guests & RSVP tab supports households, guest categories, email notes, plus-one allowances, household seat limits, total event capacity, optional or required text/choice questions, local test responses, RSVP counts, and CSV import/export. Responses enforce per-guest plus-one allowances, household and event seat limits. Analytics summarize local responses. Local RSVP previews use the existing test-only invitation route.

**Not secure online RSVP:** These guest-specific URLs are not authenticated, confidential, or cross-device. All guest and household data stays in the current browser. **Do not distribute these test URLs to real guests**, or treat the test response counts as production records. No emails or messages are sent by the UI. The public invitation explicitly states online RSVP is not yet enabled. Secure online replies, abuse protection, verification, access controls, and real collaboration are future Supabase milestones.

Regression tests: `tests/experience-smoke.cjs` (readiness, preview navigation, legacy grouping, capacity limits, custom questions, privacy and duplication) plus the extended `tests/browser-wedding.cjs` (Chromium walkthrough and screenshots). Code-level tests have been simulated; hosted-browser and physical mobile QA still require verification.

## Wedding Builder: six upgrades

1. **Feature Manager 2.0:** enable/disable sections, move up/down, and drag on desktop. The default order is Welcome / Hero, Our Story, Photo Gallery, Wedding Countdown, Event Details, Event Timeline, Dress Code (off), Gift Registry (off), RSVP.
2. **Layout variants:** every feature has multiple presentation choices. Variant preferences are stored separately per template.
3. **Photo Manager 2.0:** interactive drag-to-pan crop preview, up to 3× zoom, portrait/landscape/square frames, replacement directly from the editor preview, gallery drag-to-reorder and mobile move buttons, description editing and eight-photo local gallery limit.
4. **Design Manager:** independently customize each template's background, text and accent colors; choose heading and body fonts and section spacing.
5. **Modular template renderer:** shared feature data and separate template styling; responsive live desktop/mobile previews.
6. **Cloud publishing integration:** A dedicated URI Supabase project is now connected, with a migrated RLS-protected publication table and public media bucket. Email redirect settings and live end-to-end sign-in, upload, and publishing tests still need to be completed.

## Wedding creation reliability pass (November 2026)

- Template selection now previews the actual couple names, event date, and cover photograph when available. Switching styles in the Design Manager shows the same wedding content in both choices.
- The wizard's **Personal Touch** step can optionally accept a cover photograph. Images are validated, resized and compressed for local draft storage. Upload failures preserve the previous photograph; users may skip the photo and add one later.
- An enabled photo gallery with no images is hidden from the invitation until a photo is uploaded. The feature stays enabled and reappears in its saved position once images are added.
- Node-based coverage includes all **63 feature/layout combinations** across the three templates, empty-gallery handling, disabled sections, feature order, HTML escaping, optional photo upload, and draft recovery.
- `tests/browser-wedding.cjs` adds real Chromium automation for creating a wedding, uploading pictures, customizing designs, reordering features, editing gallery crops, checking mobile overflow, saving, reloading, and capturing screenshots. The GitHub Actions workflow installs Chromium and runs the browser checks; browser execution results need to be verified independently.

**Verification limits:** A browser-connected UI was unavailable during this change. Source-level JavaScript and simulated interactions were checked, but the new GitHub Actions browser test results and pixel-level screenshots have not yet been inspected. The cloud publishing and guest RSVP flows remain separate work.

## Photo Manager 2.0

The wedding editor's **Photos** tab now provides an interactive, non-destructive crop workspace. Users can drag the image within portrait, square or landscape frames; adjust focal position and zoom; preview both cover orientations; and **Apply** or **Cancel** before saving. Photo descriptions are editable and saved with each image.

Gallery photos support desktop drag-and-drop via a grip handle and **left/right move buttons** on touchscreens. Users can replace, reorder, or remove photos, with confirmation for removals. Changes to the photo order preserve each photo's original crop/zoom settings. The live editor preview adds **Edit photo** controls over the cover and each gallery image; these edit controls are not included in public invitations.

Uploads are resized and compressed to help fit browser storage limits. Images remain in local browser storage until explicitly published, and cloud RSVP remains separate. The prototype supports up to eight gallery images, subject to browser storage limits.

**Checks:** `tests/photo-manager-smoke.cjs` tests crop Apply/Cancel, image identity, zoom persistence, drag and arrow ordering, replacement and preview shortcuts. `tests/browser-wedding.cjs` now exercises the crop dialog, pointer panning, gallery dragging and editor preview in Chromium. Real GitHub Actions browser results and screenshots require independent verification.

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

## Builder QA and usability refinement (2026-11-09)

- Wedding setup now accepts a direct **Nightfall** template selection while preserving the existing saved draft fields.
- Owner-preview name shortcuts target the first or second partner separately, including Nightfall. Public invitation pages remain non-editable.
- Template Studio offers **Save current appearance as template** to preserve the active template's visual settings in a reusable local recipe without pasting design tokens.
- Regression cases were added for direct Nightfall selection, reusable appearance saving, and unsafe/incomplete custom blocks. Mobile styling for quick template saving was added.

**Verification pending:** CI/browser workflow results, live GitHub Pages deployment, visual screenshots, mobile devices, and accessibility checks have not been independently verified during this change. These code changes do not implement cloud-synced designs, secure guest RSVP, or remote hosting.

## Critical limitations

**Not production-ready.** The cloud publication beta has a configured backend, but email authentication redirect settings and live publication tests remain pending. Local drafts and guest RSVP data stay in the current browser. Personalized guest links do not work across devices. The optional cloud layer publishes a **public snapshot** of the wedding website only: guest lists are omitted, and public photo files are stored in a public bucket. Real cross-device RSVP, secure guest tokens, private event visibility, payments, cloud-synced drafts, security testing and production data management are future milestones.

Never commit a service_role/secret key, API private key, personal token, or database password to this public repository.

## QA status

Syntax and simulated creation-flow checks were run for wedding setup, validation, draft recovery, local save, feature editing and preview navigation. GitHub Actions includes `tests/wedding-flow-smoke.cjs` alongside the modular builder smoke test. **Full rendered browser/device QA and GitHub Pages deployment verification are outstanding.**
