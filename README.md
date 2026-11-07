# URI — You Are Invited

Interactive browser-based prototype for a digital invitation builder.

## Test locally
Open `index.html` in a browser, or serve the repository with any static web server.

## Publish with GitHub Pages
In the repository, open **Settings → Pages → Build and deployment**. Select **Deploy from a branch**, branch **main**, folder **/(root)**, then save. Once GitHub completes deployment, the site will appear at `https://mawruemdota.github.io/URI/`.

## Current features
- Responsive landing page and template gallery
- Six-step invitation creation wizard
- Multiple locally saved events
- Invitation editor with live preview
- Local guest list management
- Personalized test invitation links and RSVP response buttons
- RSVP counts and dashboard
- Local publish/unpublish status

## Prototype limitations
This is **not a production application**. Data is saved in browser localStorage, not a shared database. Guest links only work where the event data exists. There is no authentication, backend authorization, actual invitation delivery, secure token management, payments, or cross-device persistence. Do not use for real guest personal information. GitHub Pages hosts static files only.

## Next development phase
Connect real authentication, database, private invitation tokens, media storage, server-validated RSVP flows, and payment infrastructure before inviting real guests.

## Wedding templates (prototype)
The current wedding collection includes two distinct responsive designs based on user-supplied visual references:
1. **Romantic Botanical** — warm ivory, botanical accents, a large portrait column and elegant serif typography.
2. **Minimalist Editorial** — black and white, a monogram, handwritten typography, horizontal editorial columns and a timeline.

### Shared Feature Manager
In **My Events → Manage event → Edit invitation**, enable or disable the same features in either template: hero photograph, event details, countdown, photo carousel, monogram, timeline, dress code, gifts, personal message and RSVP information. Edit names, date, venue, timeline, dress code, gifts, and photos. Switching templates retains feature data. The photo carousel supports up to six locally stored images with previous/next controls.

**Limitations:** Image uploads are resized and stored in localStorage; browser storage limits apply. No cloud gallery, authenticated guest access, server RSVP, or production publish pipeline exists yet. The reference imagery is not bundled in the repository; users upload their own images.
