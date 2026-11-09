# Nightfall wedding template — design reference

**Reference page:** https://www.dota2.com/hero/abaddon  
**Extraction:** MiroMiro, 9 November 2026  
**Use:** An original, wedding-specific adaptation of the page's cinematic presentation.

## Extracted characteristics

MiroMiro read the rendered Abaddon hero page, reporting 98% styling coverage on the extracted view. The broad palette and overall role colors were inferred from stylesheet usage (confidence 0.5), not declared official brand tokens.

| Aspect | Source reference | URI Nightfall adaptation |
| --- | --- | --- |
| Palette | Black, dark charcoal, white, coral-red accents | Background `#0f0f0f`, text `#f3f3f3`, accent `#ff6046` |
| Typography | Reaver (display) and Radiance (UI) | Google Fonts Barlow Condensed (display), Montserrat (UI) |
| Composition | Oversized headline against dark, cinematic media | Couple names over a full-bleed wedding photo |
| Visual depth | Dark gradients and atmospheric contrast | Original layered CSS gradients; uploaded photo remains the focal image |
| Navigation cues | Fine dividers, restrained uppercase labels | Original accent rules and lightweight labels |
| Mobile | Narrower cinematic composition | Container-aware 740px and 480px layouts |

### Implementation

The template is registered as `nightfall` in `wedding.js` and `builder-core.js`; the stylesheet is `nightfall-template.css`. The hero and story are unique to Nightfall, but all nine standard URI features, visibility controls, photo crops, venue details, timelines, readiness, and publication payloads remain compatible with the other templates.

Users can select Nightfall in the wedding wizard, switch to/from it in the Design tab without losing content, and edit its colors, fonts, spacing and section layouts.

### Intellectual-property boundary

No Dota 2 character models, logos, backgrounds, original artwork, branded copy, proprietary font files or extracted source code are redistributed in URI. Only general styling observations were used as a design reference; the actual template markup and CSS were authored for URI. Wedding photography comes from the invitation owner's own uploads.

### Verification

The Node regression test `tests/nightfall-template-smoke.cjs`, all feature/layout combinations in `tests/template-matrix.cjs`, and the Chromium end-to-end wedding test include Nightfall. Inspect [GitHub Actions](https://github.com/mawruemdota/URI/actions) for current run results and screenshots. Physical-device visual review is still needed.

**Source design rights:** Valve Corporation owns its original materials. URI Nightfall is not affiliated with Valve or Dota 2.
