---
name: MyConference Media Evidence
description: Durable presentation rules for governed project screenshots and architecture diagrams.
colors:
  archive-stage: "#171717"
  evidence-paper: "#f5f4ef"
  stage-text: "#fff"
  stage-muted: "#d7d5cd"
  evidence-rule: "#b42318"
typography:
  evidence-heading:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "clamp(2rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  evidence-context:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: "0.04em"
  evidence-caption:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.5
spacing:
  stage-column-gap: "clamp(2rem, 7vw, 7rem)"
  media-grid-gap: "clamp(2rem, 5vw, 4rem)"
  caption-padding: "0.875rem 0 0"
components:
  media-stage:
    backgroundColor: "{colors.archive-stage}"
    textColor: "{colors.stage-text}"
  evidence-caption:
    textColor: "{colors.evidence-paper}"
    typography: "{typography.evidence-caption}"
    padding: "{spacing.caption-padding}"
---

# Design System: MyConference Media Evidence

## Overview

**Creative North Star: "The Archival Evidence Stage"**

This document governs only the media-evidence group used for MyConference and future project media that follows the same proof standard. It does not define the Portfolio's wider visual identity.

The dark, full-bleed stage separates governed artifacts from the surrounding case-study narrative. A recruiter should see the current product record first, then supporting responsive and architectural evidence. The presentation stays quiet so the artifacts carry the claim.

**Key characteristics:**

- One dominant record followed by supporting records.
- Factual captions attached to every artifact.
- Publication, provenance, and accessibility data resolved before display.

## Colors

### Primary

- **Evidence rule:** Use the narrow red rule only to bind a caption to its artifact. It is an evidence marker, not decoration.

### Neutral

- **Archive stage:** Use the charcoal ground for the full media group.
- **Stage text:** Use white for the main heading and paper white for captions.
- **Stage context:** Use the muted warm gray for the short description beneath the heading.
- **Artifact ground:** Give images a paper-colored fallback while they load.

**The restrained-marker rule.** The red rule belongs above captions. Do not spread it across the stage as a general accent.

## Typography

The media group keeps the Portfolio's Arial and Helvetica stack. Its heading is compact and forceful, while context and captions are small enough to remain secondary to the artifacts.

- **Evidence heading:** Limit the measure to about 11 characters so the title forms a short block beside the media.
- **Evidence context:** Use the established small bold text beneath the heading.
- **Evidence caption:** Use sentence case and a compact line height. Keep it factual rather than promotional.

**The artifact-first rule.** Type identifies and explains the evidence. It must not compete with the image.

## Layout

The stage runs edge to edge while its content aligns to the Portfolio's 72rem container. At wider widths, the stage uses a narrow heading column and a larger media column. The media column uses an asymmetric two-column grid. The first record spans both columns; supporting phone and architecture records sit beneath it.

At 44rem and below, both grids become one column and the first record stops spanning columns. Keep phone captures centered and no wider than 24.375rem. Other records may use the available width.

**The first-record rule.** Put the strongest wide-format runtime record first. Entry order controls the full-width visual hierarchy.

## Elevation & Depth

The stage itself is flat. Images receive one ambient shadow (`0 0.75rem 2rem rgb(0 0 0 / 0.28)`) to separate pale interfaces and diagrams from the charcoal ground. Do not add shadows to captions or heading copy.

## Shapes

Evidence images keep square outer corners and their native aspect ratios. Do not crop them into cards, apply ornamental masks, or round their edges. The caption's straight red rule is the only framing device.

## Components

### Evidence stage

Use a semantic section labelled by its visible heading. The heading states the project and evidence purpose; the short context line distinguishes current runtime captures from an authored architecture diagram.

### Evidence visual

Each asset is one `figure` containing the image and its `figcaption`. The caption names what the artifact records. It must agree with the governed media block and asset record.

Every displayed asset must have approved provenance and at least one supporting evidence reference. Runtime captures must pass the fictional-data check. Captions and alternative text describe only facts supported by those records.

### Responsive image

Load project assets through Astro image metadata so width and height remain intrinsic. Render at `width: 100%` and `height: auto`. Runtime captures provide responsive candidates at 390, 780, 1176, and 1440 pixels; the lead record advertises a 72rem display ceiling, while supporting records advertise a 48rem ceiling. Keep lazy loading and asynchronous decoding for this below-the-fold group.

Alternative text must identify the interface or diagram and state the meaningful content visible in it. Do not use the caption as a substitute for alternative text. The architecture SVG also retains its own title, description, dimensions, and view box.

## Do's and Don'ts

### Do:

- **Do** lead with the clearest wide-format runtime capture, then add phone and architecture evidence.
- **Do** keep captions concise, literal, and synchronized with the governed content record.
- **Do** preserve intrinsic dimensions, aspect ratio, semantic figures, and the section's visible accessible name.
- **Do** verify publication approval, provenance, evidence references, and fictional data before a runtime capture appears.

### Don't:

- **Don't** use an asset whose visual claim exceeds its approved evidence.
- **Don't** stretch, crop, round, or decorate evidence images.
- **Don't** turn the archival stage or caption rule into a sitewide style without separate design authority.
