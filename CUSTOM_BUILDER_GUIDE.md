# URI Custom Builder and Template Studio

## Custom sections

In a wedding invitation, open **Edit → Features → Custom content**. Add Text, Image, Video, FAQ, Location, or Button. The new section enters the invitation's section order and adopts the current template's typography, spacing, and colors.

Each section supports a heading and its own content. Text can contain line breaks; images can be uploaded and captioned; video accepts YouTube or Vimeo HTTPS links; FAQs contain editable question/answer pairs; locations provide notes and a directions link; buttons have a caption and an HTTPS destination. Raw HTML or arbitrary third-party embeds are not accepted.

Use the section's editor to edit content and set **Adapt to template** or **Full width**. Enabled sections can be reordered with the existing Features controls or the preview toolbar. Disabled custom sections appear under **Hidden sections** for restoration. Duplicating a custom section makes an independent editable copy. Deletion asks for confirmation.

Custom sections are stored in the invitation's `customSections` array and their IDs in `featureOrder`. They appear in all three templates and are included in publication snapshots. Limit: 16 custom sections and 12 FAQ pairs per FAQ section.

## Visual Editing 2.0

The *editor preview only* shows section controls when the owner hovers or focuses a section. Use **Edit**, **Up**, **Down**, or **Hide**. Custom sections also have **Duplicate**. Clicking noninteractive space in a section opens the corresponding editor. On touch devices the controls remain visible. None of these controls are rendered on the public invitation.

## Template Studio

Under **Edit → Design → Template Studio**, create a reusable style recipe.

1. Extract colors and font information from a website with MiroMiro via ChatGPT.
2. Choose a URI base structure: Romantic Botanical, Minimalist Editorial, or Nightfall.
3. Give the design a name and optional reference URL.
4. Paste MiroMiro color/font JSON or CSS variables, then create the design.
5. Further adjust colors, fonts, spacing, and feature layout in URI's ordinary Design and Features tabs.

Example JSON:

```json
{
  "background": "#151515",
  "text": "#efefef",
  "accent": "#d75e49",
  "fonts": {
    "heading": "Barlow Condensed",
    "body": "Montserrat"
  }
}
```

CSS variables also work: `--background: #151515; --text: #efefef; --accent: #d75e49;`.

The recipe applies safe color and font values to one of URI's existing responsive template structures. It does **not** automatically clone an entire external website or use copyrighted page assets. MiroMiro extraction runs in ChatGPT; the GitHub Pages client has no MiroMiro API access.

Recipes are stored locally in the invitation and in a reusable browser library. A recipe can be exported as a JSON file and imported into another invitation. The published invitation includes the recipe needed to display it. The library is not yet cloud-synced.

## Limitations

Real-time secure RSVP, account-wide design synchronization, and shared cloud photo libraries are separate backend milestones. Photo uploads remain subject to the browser's storage limits, and physical iOS/Android testing is still required.

## QA

Run `node tests/custom-builder-smoke.cjs` and the existing builder tests. GitHub Actions also runs an actual Chromium workflow creating and modifying sections and importing a design recipe. See [URI Actions](https://github.com/mawruemdota/URI/actions).
