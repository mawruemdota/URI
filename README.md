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
