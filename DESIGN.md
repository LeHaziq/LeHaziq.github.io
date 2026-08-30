---
name: Margin of Record
description: The production visual system for Muhammad Haziq Aiman Anuar's guided Portfolio manuscript.
colors:
  coated-paper: "#f4f1e8"
  paper-depth: "#dfd9ca"
  carbon-black: "#171916"
  graphite-note: "#50544e"
  manuscript-rule: "#aaa596"
  cobalt-acetate: "#123fc7"
  cobalt-depth: "#0d2e91"
  cobalt-tint: "#dce5ff"
  verification-red: "#b42318"
  emboss-highlight: "rgb(255 255 255 / 0.7)"
  emboss-shadow: "rgb(83 78 66 / 0.12)"
  image-shadow: "rgb(0 0 0 / 0.2)"
typography:
  manuscript-display:
    fontFamily: "Newsreader Variable, Georgia, Times New Roman, serif"
    fontWeight: 650
    fontSize: "clamp(2.55rem, 8vw, 6rem)"
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  section-heading:
    fontFamily: "Newsreader Variable, Georgia, Times New Roman, serif"
    fontWeight: 650
    fontSize: "clamp(2.5rem, 5vw, 4.75rem)"
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  record-heading:
    fontFamily: "Newsreader Variable, Georgia, Times New Roman, serif"
    fontWeight: 650
    fontSize: "clamp(1.35rem, 3.5vw, 3rem)"
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  evidence-prose:
    fontFamily: "Newsreader Variable, Georgia, Times New Roman, serif"
    fontWeight: 400
    fontSize: "clamp(1.2rem, 2vw, 1.55rem)"
    lineHeight: 1.48
  interface:
    fontFamily: "Public Sans Variable, Arial, Helvetica, sans-serif"
    fontWeight: "400 800"
    fontSize: "1rem"
    lineHeight: 1.65
  annotation:
    fontFamily: "Newsreader Variable, Georgia, Times New Roman, serif"
    fontWeight: 400
    fontSize: "0.95rem"
    lineHeight: 1.4
  label:
    fontFamily: "Public Sans Variable, Arial, Helvetica, sans-serif"
    fontWeight: 800
    fontSize: "0.7rem"
    lineHeight: 1
    letterSpacing: "0.07em"
spacing:
  sheet-gutter: "clamp(1.25rem, 5vw, 5rem)"
  sheet-block: "clamp(3.5rem, 8vw, 7rem)"
  manuscript-gap: "1rem"
  record-gap: "clamp(2rem, 7vw, 7rem)"
components:
  manuscript-sheet:
    backgroundColor: "{colors.coated-paper}"
    textColor: "{colors.carbon-black}"
    padding: "{spacing.sheet-block} {spacing.sheet-gutter}"
  acetate-pass:
    backgroundColor: "{colors.cobalt-acetate}"
    textColor: "#fff"
  verified-fact:
    backgroundColor: "{colors.verification-red}"
    textColor: "#fff"
    typography: "{typography.label}"
  working-note:
    textColor: "{colors.graphite-note}"
    typography: "{typography.annotation}"
---

# Design system: Margin of Record

## Intent

The Portfolio is one guided manuscript. Recruiters move from Haziq's introduction into MyConference evidence, then through the dated optimization, Academic projects, chronology, and contact actions. The page reads as a sequence of physical records on a cobalt work surface, not as a grid of interchangeable project cards.

The visual system uses six material roles from the approved direction:

- Coated paper carries the main document and quieter evidence.
- Cobalt acetate marks MyConference ownership and safeguards.
- Carbon black is the default reading color.
- Verification red marks only the exact phrase `Verified fact`, evidence-caption rules, and critical focus annotations.
- Graphite notes explain the manuscript's working structure. They never claim third-party review or public proof.
- Blind embossing appears only as low-contrast paper depth. It never carries required information.

## Typography

Newsreader is the manuscript voice. It carries names, section headings, evidence prose, metrics, and working notes. Public Sans carries navigation, controls, technical labels, captions, and dense supporting prose. Both variable fonts are self-hosted from committed package versions; CSS imports only their upright weight axes.

Georgia and Times New Roman form the Newsreader fallback chain. Arial and Helvetica form the Public Sans fallback chain. Copy remains available while fonts load, and neither fallback changes the content order.

Display text stops at 6rem and never tracks tighter than -0.035em. Evidence prose keeps a readable measure near 44rem. Labels use uppercase only where the manuscript needs indexing or verification language.

## Layout

The page has a maximum 80rem manuscript width with a one-rem cobalt channel between sheets. Desktop records use a narrow annotation column beside the evidence column. At 52rem the sheets become one-column records. At 44rem the desktop-only MyConference header action disappears, facts move inline, and the normal document order remains unchanged.

No section becomes sticky, hidden, tabbed, collapsed, or horizontally scrollable. The three MyConference passes remain separate headed sections. Approved desktop and phone captures sit inside the workflow pass; the tenant-isolation diagram sits inside safeguards and history.

## Sheets and acetate

Paper sheets use one ambient shadow and no border. Cobalt sections use folded-corner geometry to imply acetate without imitating a photograph. The introduction is one oversized sheet with a partial cobalt record that points into MyConference. The restrained embossed `PORTFOLIO / 2026` mark is decorative and sits outside the accessibility tree through CSS-generated content.

The next issue may animate acetate progression. The issue 21 baseline remains complete and readable without JavaScript. Any later motion must preserve these static layouts and content boundaries.

## Evidence and media

Verified facts have one semantic copy. Their red stamp may rotate by one degree, but the claim text stays level and readable. Working notes use graphite or a tint of the surface they sit on. They must not use verification red or resemble an evidence stamp.

Each governed visual stays in a semantic figure with its approved alternative text and caption. Runtime captures retain responsive candidates and reserved dimensions. The phone capture remains narrower than the desktop record. The original tenant-isolation diagram is not cropped, rounded, or masked.

## Actions and browser surfaces

Actions are native links with at least 44 pixels of block-axis space. Primary actions use cobalt on paper and coated white on cobalt. Links open in the same tab. Resume links keep the native `download` behavior.

Keyboard focus uses a three-pixel verification-red outline because focus is a critical annotation. Selection uses the cobalt tint, and the scrollbar uses carbon black against paper depth. Reduced-motion preferences remove smooth scrolling even before the signature interaction exists.

## Social card

`public/social-card.svg` uses only name, role, location, and field labels from the approved Portfolio copy. It contains no project screenshot or hidden raster image. Metadata points to the stable custom-origin URL `https://haziqaiman.my/social-card.svg`.
