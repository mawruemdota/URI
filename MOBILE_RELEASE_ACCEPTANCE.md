# URI — Mobile release acceptance checklist

**Status:** Browser-engine emulation is automated. Physical-device checks are **not yet completed**.

## Automated checks

GitHub Actions **URI Builder Checks** runs:

- Chromium desktop: wedding builder, editing, preview, guest manager, RSVP, Phaser Adventure and regressions.
- iPhone 13 **WebKit emulation**: start invitation, complete wedding setup, navigate essential and advanced editor steps, verify drafts cannot be shared, create a guest, check guest-only navigation and play Adventure using touch controls.
- Pixel 7 **Chromium emulation**: the same flows, screenshots, layout overflow checks and pointer interactions.
- On each `main` push: compare the live GitHub Pages files with the contents of `main`. A passing result means those checked assets are deployed—not that a real phone has been tested.

The mobile flow uses synthetic pointer events for automated movement tests. This does **not** prove multitouch behavior in a native device's touchscreen or Facebook in-app browser.

## Physical-device acceptance (manual, pending)

Use **test weddings and test guest names only**, not real attendee data.

| Case | iPhone Safari | Facebook in-app browser (iPhone) | Android Chrome |
|---|---|---|---|
| Home loads; no clipped text or horizontal scroll | ☐ | ☐ | ☐ |
| Create wedding; reopen draft without losing edits | ☐ | ☐ | ☐ |
| Editor switches basic/advanced, preview desktop/mobile | ☐ | ☐ | ☐ |
| Publish/update/share only when connected and signed in | ☐ | ☐ | ☐ |
| Public link opens from another phone with no creator navigation | ☐ | ☐ | ☐ |
| Guest online RSVP is private and saves once | ☐ | ☐ | ☐ |
| Adventure walk, jump + hold direction simultaneously | ☐ | ☐ | ☐ |
| Releasing touch immediately stops movement | ☐ | ☐ | ☐ |
| Rotate screen; background/resume; controls are never stuck | ☐ | ☐ | ☐ |
| All stations are reached by walking; no skips or teleport | ☐ | ☐ | ☐ |
| In-game RSVP, map and return-to-world work | ☐ | ☐ | ☐ |
| Text remains readable at larger font settings | ☐ | ☐ | ☐ |

Also test **VoiceOver (iOS)** or **TalkBack (Android)** for navigation outside the game. Keyboard-only users should be able to operate non-game forms and menus.

Record the model, OS/browser version, URL, step, expected behavior, actual behavior and screenshot/screen recording for every failure.

**Release gate:** Do not claim physical-device QA passed until at least one iPhone and one Android phone have completed the main guest and creator paths. Cloud publishing and real cross-device RSVPs additionally require authenticated test accounts and a test event; the automated suite does not use a live Supabase backend.
