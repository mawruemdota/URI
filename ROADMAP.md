# URI Product Roadmap

## Adventure Invitation 1.0 — Light Platformer (2026-11-09)
- [x] Fourth selectable wedding template with the existing shared event model and section settings
- [x] Original Phaser 3.90 Arcade Physics side-scroller with continuous non-punishing level
- [x] Keyboard and responsive mobile controls, including virtual joystick option
- [x] Original pixel-art character looks, world palettes and collectible memories
- [x] Interactive checkpoint signs, themed in-game interiors, scrollable native HTML, and in-viewport world map (no popup dialogs)
- [x] All-section accessible fallback and skip-game navigation
- [x] Game Template Manager for scene, character, control preference, speed and optional collectibles
- [x] Published invitation payloads retain Adventure Game Manager settings and custom checkpoint order
- [x] Personalized game invitation URL loads a token-protected RSVP form directly within the in-game RSVP area
- [x] Automated feature and safety regression tests
- [x] Real Phaser Chromium movement and 390px mobile preview validation (GitHub Actions run 42634951950)
- [ ] Verify the revised in-game interior navigation and guest RSVP through Chromium CI
- [ ] Actual iOS/Android hardware performance, screen-reader and keyboard accessibility acceptance
- [ ] Live cloud guest RSVP acceptance, rate limiting and public beta security review
- [ ] Optional custom sprite uploads, additional world scenery and more advanced level editing

## Cross-device cloud drafts and secure online RSVP (2026-11-09)
- [x] Owner-scoped private cloud drafts, email sign-in integration and explicit import of prior local-only drafts
- [x] Optimistic cloud revision checks to prevent silent cross-device overwrites
- [x] Restore saved invitations and preserve offline edits with reconnect retry
- [x] Restrict drafts to their authenticated account and prevent cross-account upload
- [x] Owner-only cloud guest records and cryptographically random, hash-verified individual RSVP URLs
- [x] Public token RSVP lookup and submission without guest accounts
- [x] Server validation of required answers, plus-one allowances, deadlines and total/household capacity
- [x] Owner RSVP status refresh, online link copying, and safe cloud draft deletion
- [x] Automated mock integration tests, anonymous-access checks and database RLS review
- [ ] Real email magic-link authentication, cross-device edit and RSVP acceptance with two separate browsers/accounts
- [ ] Rate limiting and independent review of token-gated public SECURITY DEFINER functions (Supabase advisor warnings remain)
- [ ] Live publishing/unpublishing, session lifecycle and recovery tests
- [ ] Physical iOS Safari/Android Chrome, privacy, accessibility and abuse tests
- [ ] Production guest delivery, notification preferences and safe cleanup/retention of media

## Animation Manager 1.0 (2026-11-09)
- [x] CSS-first preset animations: None / Elegant / Cinematic / Playful
- [x] Per-event speed and independent entrance, scroll, photo, hover and decoration switches
- [x] Owner preview playback without blocking normal editing interactions
- [x] Preserve animation configuration when changing template and in public publication snapshots
- [x] Progressive GSAP cinematic enhancement with CSS and IntersectionObserver fallback
- [x] Respect system reduced-motion preferences; never depend on animation to reveal information
- [x] Automated animation smoke coverage and full Chromium builder journey passed
- [x] GitHub Pages build and deployment verified through GitHub Actions
- [ ] Manual reduced-motion, iOS Safari, and Android Chrome checks on physical devices
- [ ] Optional Lottie decoration assets with licensing / performance review
- [ ] Optional interactive envelope-opening scene (separate future feature)

## Stage 1 — UI/UX polish (in progress)
- [x] Responsive navigation improvements (browser QA pending)
- [x] Five-step wedding wizard, inline validation, persistent draft recovery, progress and full-page preview (browser QA pending)
- [x] Consistent wedding editor, templates, dashboard, and empty states (mobile browser QA pending)
- [x] Compact invitation previews, reusable wedding layout components and live desktop/mobile editor preview (browser QA pending)
- [ ] Complete accessibility checks and real desktop/mobile end-to-end browser testing (simulated flow tests added)

## Priority 1 wedding UX cleanup (implemented in code, browser QA pending)
- [x] Wedding-first template choice and five-step setup
- [x] Review and save directly into the wedding website editor
- [x] Consistent Content → Features → Design → Photos → Publish navigation
- [x] Local autosave status and resume-on-return for unfinished setup
- [x] Full-page desktop and mobile wedding previews
- [x] Improved mobile editing and navigation controls
- [x] Simulated end-to-end smoke tests and CI workflow
- [x] Inline builder readiness feedback for missing names, date, time, venue, and RSVP deadline
- [ ] Visual browser QA, device testing and accessibility audit

## Priority 2 wedding template refinement (implemented in code; visual QA pending)
- [x] Romantic Botanical: 35/65 portrait and ivory cover, ornamental botanical vectors, italic serif names and circular photo detail
- [x] Minimalist Editorial: three-column details/photo/timeline cover, handwritten typography and monogram story panel
- [x] Distinct section treatments, gallery framing, timelines and responsive tablet/mobile compositions
- [x] Consistent miniature previews in the homepage, template selector and creation wizard
- [x] Preserve shared feature order, visibility, custom text and uploaded photos while switching designs
- [x] Add wedding-template regression tests to CI
- [ ] Review screenshots on real devices and compare visually against the supplied references

## UI design review polish (code complete; live browser QA pending)
- [x] Wider desktop editor canvas, clearer hierarchy, consistent control sizing and focus states
- [x] True-width scaled 1024px desktop and 390px mobile previews inside the editor
- [x] True-width scaled 1080px desktop and 390px mobile full-page previews
- [x] Keyboard focus and scroll retention when toggling or reordering features
- [x] Explicit centered and immersive cover variants; responsive story variants
- [x] Matching two-card template collection, polished preview placeholders and text treatments
- [x] Add UI preview regression tests to GitHub CI
- [ ] Capture live site screenshots and perform browser accessibility, layout and device testing

## Template creation reliability pass (2026-11-08)
- [x] Personalize style choices in wizard and editor with user-entered details and photo
- [x] Optional hero-photo upload, validation, compression, removal and draft recovery in wedding setup
- [x] Hide empty photo gallery from invite without disabling or reordering the feature
- [x] Exhaustive 42-combination feature/layout rendering matrix and wizard photo tests
- [x] Add Chromium browser journey automation and screenshot artifact upload to GitHub Actions
- [ ] Confirm the browser-qa workflow succeeds and inspect its screenshot artifacts
- [ ] Complete manual Safari/iOS and Chrome/Android UI checks on physical devices
- [ ] Revisit cloud publishing authentication, image storage, and guest RSVP security

## Photo Manager 2.0 implementation (2026-11-08)
- [x] Non-destructive crop editor with pan, zoom, aspect selection and Apply/Cancel
- [x] Preserve framing data, image identity and order across both wedding templates
- [x] Drag gallery images by handle, with accessible left/right controls on mobile
- [x] Replace photos from the editor preview and from the crop workspace
- [x] Updated responsive Photos tab, improved upload compression and photo removal confirmation
- [x] Add Node smoke tests and extend Chromium browser QA screenshots
- [ ] Verify GitHub Actions Chromium run results and inspect images for visual regressions
- [ ] Manually test touch panning and image selection on iOS Safari and Android Chrome

## Wedding Details 2.0 and Dashboard 2.0 (2026-11-08)
- [x] Separate ceremony and reception details, optional different dates and times
- [x] Individual venue names, addresses, HTTPS directions links, and arrival notes
- [x] Structured, editable, reorderable activities with notes, dates and location assignments
- [x] Preserve older single-venue weddings and migrate legacy text-based timelines
- [x] Include wedding venue and timeline records in the public invitation payload
- [x] Wedding dashboard with invitation cards, event dates, last-edited data and status
- [x] Search, draft/published filters, sorting and edit/preview actions
- [x] Local duplication without guest lists or publishing credentials
- [x] Safe local deletion and protective blocking for locally recorded published snapshots
- [x] New regression suite and extended Chromium browser QA
- [ ] Verify the current GitHub Actions Chromium workflow run and inspect screenshot artifacts
- [ ] Test iOS Safari and Android Chrome using actual devices
- [ ] Implement cross-device draft synchronization and real-time published status after returning to Supabase

## Readiness, direct editing, and Guest Management / RSVP 2.0 (2026-11-09)
- [x] Readiness checklist with publishing blockers, optional suggestions, progress and editor shortcuts
- [x] Dashboard completion progress and a dedicated Review editor tab
- [x] Direct editing shortcuts from private preview to names, story, venue, timeline and RSVP guest planning
- [x] Household and guest management with categories, plus-one allowances and seat allocations
- [x] Local test RSVP page with custom text/choice questions and guest-specific responses
- [x] Household and total-event seat-limit checks; local RSVP analytics
- [x] CSV import and export for local guest planning
- [x] Keep guest and household data out of public invitation publication payloads
- [x] Mark public wedding RSVP as unavailable until secure online replies exist
- [x] Add regression tests for readiness, guest planning and limits; extend Chromium journey
- [ ] Verify GitHub Actions browser tests, screenshots, real-device usability and accessibility
- [ ] Implement secure, cross-device RSVP storage, personalized invite tokens, event ownership and privacy policies using the backend
- [ ] Configure genuine guest delivery and notifications only after security and consent requirements

## Minimal interface copy polish
- [x] Simplify landing page, wizard, wedding editor, dashboard, guest and readiness text
- [x] Remove decorative arrow, checkmark, heart and floral glyphs from text and controls
- [x] Keep botanical art, accessible labels, and necessary local-demo safety warnings
- [x] Rebalance spacing and remove empty ornament holders with `minimal-ui.css`
- [x] Update existing smoke checks for streamlined interface copy
- [ ] Verify live GitHub Pages visuals on desktop, iOS Safari and Android Chrome

## Nightfall MiroMiro reference template (November 2026)
- [x] Extract Abaddon page styling with MiroMiro and document the source's inferred colors and typography
- [x] Create original dark/cinematic wedding design without Dota artwork or proprietary fonts
- [x] Register third template in landing page, wedding wizard, Design Manager and dashboard
- [x] Build responsive Nightfall hero, story, gallery, countdown and secondary section styles
- [x] Support all wedding sections, photo crop controls, per-template colors, layouts, and public payloads
- [x] Extend the feature/layout matrix to 63 cases and add Nightfall-specific and Chromium checks
- [ ] Conduct a hands-on iPhone/Android visual review of Nightfall

## Adaptive wedding sections (November 2026)
- [x] Compose visible sections into template-specific paired or full-width layouts
- [x] Hide empty galleries/timelines without leaving blank layout slots
- [x] Reflow Editorial hero and thumbnail when Details/Timeline are toggled
- [x] Separate active sections from available sections in the wedding editor
- [x] Preserve content and per-template variants when switching templates or re-adding a section
- [x] Keep section ordering and pairing responsive in desktop and mobile previews
- [x] Cover 1,536 visibility configurations in the section regression suite
- [ ] Allow user-defined additional section types beyond the nine built-in features

## Custom Builder and Template Studio (November 2026)
- [x] Add independent Text, Image, Video, FAQ, Location, and Button blocks
- [x] Render custom blocks according to the selected wedding template and responsive layout
- [x] Add, edit, duplicate, hide, show, reorder and delete custom sections
- [x] Add hover/focus/touch editing controls to the owner-only live preview
- [x] Create reusable Template Studio recipes from MiroMiro tokens or CSS color variables
- [x] Export/import template recipes and preserve them in publication snapshots
- [x] Add automated custom-section, token-import and real-browser regression checks
- [ ] Verify interactive controls on physical iOS Safari and Android Chrome
- [ ] Implement optional cloud synchronization for reusable template library
- [ ] Consider a hosted MiroMiro import endpoint when the app has a secure server-side integration

## Stage 2 — Real authentication and data
- [x] Email magic-link account flow and private owner RLS policies (acceptance pending)
- [x] Versioned cloud draft records, explicit import, offline reconciliation and per-owner access
- [x] Public photo and audio storage integration (live upload validation pending)
- [ ] Real-user sign-in, cross-device saving and publishing acceptance tests
- [ ] Secure collaborator roles and sharing permissions

## Stage 3 — Invitation builder 2.0
- [x] Modular wedding sections and two reference-inspired wedding presets (browser QA pending)
- [x] Wedding photo manager and typography / color controls (browser QA pending)
- [ ] Cloud-synced drafts and production publishing (optional publication beta scaffold exists)
- [x] Responsive editor with mobile preview (browser QA pending)

## Stage 4 — Guests and RSVP
- [x] Local household planning, guest allocations and plus-ones
- [x] Personal online RSVP links with secure random bearer tokens (beta)
- [x] CSV import/export and guest filters
- [x] Online RSVP collection with manual owner refresh and server-side capacity enforcement (beta)
- [ ] Live end-to-end response testing, throttling, notifications and privacy acceptance
- [ ] Sharing tools and QR codes

## Stage 5 — Commercial platform
- [ ] Free, Standard and Premium entitlements
- [ ] Verified Philippine payments
- [ ] Admin template and plan management

## Stage 6 — Public beta
- [ ] Security and privacy audit
- [ ] End-to-end and mobile testing
- [ ] Performance and accessibility review
- [ ] Production deployment

## Acceptance criteria
First preview in under 3 minutes; basic invitation in under 5 minutes; guest RSVP in 30–45 seconds (targets to validate). Guests should not need an account. Never label a frontend-only prototype production-ready.

## Current limitations
The initial prototype is a static GitHub Pages app. localStorage data is not shared across devices. Personalized links and RSVP are test-only, not secure or production-ready.

## Wedding builder: six requested upgrades (November 2026)
- [x] Feature Manager 2.0 — section order, visibility and keyboard-accessible move controls
- [x] Feature-specific layout variants stored per template
- [x] Photo Manager — upload, replace, reorder, focal point and non-destructive crop format
- [x] Design Manager — template-specific colors, fonts and spacing
- [x] Modular template renderer — same data and features for Botanical and Editorial
- [x] Optional Supabase publishing integration and RLS schema committed
- [x] Create dedicated Supabase URI project, configure public URL/key and apply RLS migration
- [ ] Test hosted login, cloud uploads, publication, RLS, and unpublish using real user accounts
- [ ] Replace prototype guest RSVP with a secure shared backend before real guests
- [ ] Visual browser QA on desktop/mobile and end-to-end reliability checks

The six upgrade code modules have been committed, but **cloud publishing is not active or production-ready until external configuration and testing are completed**.
