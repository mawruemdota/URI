# URI Product Roadmap

## Stage 1 — UI/UX polish (in progress)
- [x] Responsive navigation improvements (browser QA pending)
- [x] Wizard validation, draft recovery, progress and live preview (browser QA pending)
- [ ] Consistent editor, templates, dashboard, and empty states
- [x] Compact invitation previews, reusable wedding layout components and live desktop/mobile editor preview (browser QA pending)
- [ ] Complete accessibility checks and end-to-end browser testing

## Stage 2 — Real authentication and data
- [ ] Account sign-in and event ownership
- [ ] Database-backed event records
- [ ] Cloud image storage
- [ ] Secure event permissions and collaborator roles

## Stage 3 — Invitation builder 2.0
- [x] Modular wedding sections and two reference-inspired wedding presets (browser QA pending)
- [x] Wedding photo manager and typography / color controls (browser QA pending)
- [ ] Cloud-synced drafts and production publishing (optional publication beta scaffold exists)
- [x] Responsive editor with mobile preview (browser QA pending)

## Stage 4 — Guests and RSVP
- [ ] Households, allocations, and plus-ones
- [ ] Secure personalized links
- [ ] CSV import/export and guest filters
- [ ] Cross-device RSVP and analytics
- [ ] Sharing and QR codes

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
