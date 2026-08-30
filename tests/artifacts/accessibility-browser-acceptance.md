# Accessibility and browser acceptance

- Validation date: 30 August 2026
- Candidate: the Portfolio source in this commit
- Environment: Ubuntu 24.04.4 LTS on WSL2, Linux 6.6.87.1

## Result

All automated and locally executable checks pass. The remaining device limits are recorded below. The environment cannot run the Safari application or provide physical Android and iPhone devices.

## Automated accessibility

`npm run test:accessibility` runs both public pages (`/` and `/404.html`) through normal motion and reduced motion with axe-core 4.13.0. The scan includes WCAG 2.0 A and AA, WCAG 2.1 A and AA, and WCAG 2.2 AA rules.

| State | Chrome 151.0.7922.108 | Firefox 153.0 | WebKit 26.5 | Pixel 7 emulation | iPhone 15 emulation |
| --- | --- | --- | --- | --- | --- |
| Normal motion | Pass, 0 violations | Pass, 0 violations | Pass, 0 violations | Pass, 0 violations | Pass, 0 violations |
| Reduced motion | Pass, 0 violations | Pass, 0 violations | Pass, 0 violations | Pass, 0 violations | Pass, 0 violations |

The same suite inspects the rendered accessibility tree and confirms:

- one banner, one main landmark, and one content information landmark;
- one `h1` and heading levels without a skipped level;
- three headed MyConference sections;
- useful text alternatives on all informative images;
- decorative acetate excluded with `aria-hidden="true"`;
- one semantic copy of each Verified fact;
- native link actions without custom button roles.

## Keyboard, focus, and targets

Chrome, Firefox, and WebKit desktop runs pass forward and reverse public action order, skip navigation on both public pages, native scrolling keys, native link activation, and no-trap checks. Activating the skip link moves focus to `main`.

Every public action reaches 44 by 44 CSS pixels or larger at the tested narrow viewport. Focus uses a 3 CSS pixel verification-red perimeter plus a 3 CSS pixel paper perimeter. The measured adjacent-state contrasts are:

| Surface | Indicator contrast | Result |
| --- | --- | --- |
| Coated paper | verification red, 5.82:1 | Pass |
| Cobalt acetate | coated paper, 7.26:1 | Pass |
| Carbon-black footer | coated paper, 15.66:1 | Pass |

## Responsive layouts

Chrome, Firefox, WebKit, Pixel 7 emulation, and iPhone 15 emulation pass these checks:

- 320 by 568 CSS pixels;
- 568 by 320 CSS pixels;
- 200% root text size at a 320 CSS pixel viewport;
- no horizontal document scrolling or clipped text;
- every action remains within the viewport and the final action remains visible;
- no overlapping text at the tested narrow and zoomed layouts;
- no collision between the introduction acetate copy and its working note.

The final browser inspection found no page errors. Standard and reduced-motion renders have no horizontal overflow. The reduced-motion interaction reports three static passes and no active interaction animation.

## Browser and device record

| Requirement | Result | Environment and limitation |
| --- | --- | --- |
| Stable Chrome desktop | Pass | Google Chrome 151.0.7922.108 on Ubuntu 24.04.4 LTS under WSL2 |
| Firefox desktop | Pass | Playwright Firefox 153.0 on Ubuntu 24.04.4 LTS under WSL2 |
| Stable Safari desktop | Not run | Safari is unavailable on Linux. Playwright WebKit 26.5 passed as supplementary engine evidence, but it is not the Safari application. A macOS Safari run remains required for release sign-off. |
| Chrome on Android | Physical device unavailable | Pixel 7 emulation using Chrome 151.0.7922.108 passed the automated matrix. A physical Android run was not possible in this environment. |
| Safari on iPhone | Physical device unavailable | iPhone 15 WebKit emulation passed the automated matrix. A physical iPhone run was not possible in this environment. |

## Defects, fixes, and reruns

| Defect | Fix | Rerun |
| --- | --- | --- |
| The 20rem page floor and transformed acetate widened the 320 CSS pixel document. Text zoom widened it further. | Removed the page floor, clipped decorative paint at each pass, let grid children shrink, wrapped narrow text safely, and allowed the narrow header to wrap. | Responsive tests pass in all five projects. |
| Skip navigation scrolled the page but did not move focus. | Made `main` a programmatic focus target. | Skip navigation passes in Chrome, Firefox, WebKit, and both emulated mobile projects. |
| Verification red had 1.25:1 contrast on cobalt and 2.69:1 on carbon black. | Added a coated-paper outer focus perimeter while retaining the verification-red inner perimeter. | Focus perimeter and contrast tests pass in all five projects. |
| The skip link and site-name link fell short of the 44 CSS pixel design aim. | Added a 44 CSS pixel minimum block size. | Target-size tests pass in all five projects. |
| Desktop acetate copy overlapped its working note. | Moved the note below the acetate action line while keeping the narrow layout in normal flow. | The collision test passes in desktop Chrome, Firefox, and WebKit. |
| The 404 page had no skip-link focus target. | Added the shared `main-content` target and made it programmatically focusable. | Skip navigation passes on both public pages in all five projects. |
| The MyConference attribution appeared twice in the rendered accessibility tree. | Kept the required visual safeguards attribution but marked that repeated presentation as hidden from assistive technology; the opening pass remains semantic. | Each Verified fact now has one semantic copy. |
| Firefox could report a cancelled peel completing just beyond the 500 ms motion budget. | Reduced the peel and fallback duration from 480 ms to 450 ms, leaving scheduling headroom. | All five Firefox signature interaction tests pass. |

No unresolved automated WCAG 2.2 AA violation remains. Release sign-off still needs the macOS Safari run and the physical-device checks listed above when those devices are available.
