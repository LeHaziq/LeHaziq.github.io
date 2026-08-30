# Release contract acceptance

- Validation date: 30 August 2026
- Candidate: the Portfolio source in this commit
- Environment: Ubuntu 24.04.4 on WSL2, Linux 6.6.87.1
- Tooling: Node.js 22.22.0, npm 11.18.0, Lighthouse 13.4.1, Headless Chrome 151

## Result

All locally executable checks for issue 24 pass. Production indexing is available only through an explicit build mode or manual Pages input. Pushes to `main` remain validation builds until Haziq grants cutover approval.

## Mobile performance

`npm run measure:performance` builds the static Portfolio, serves `dist`, and runs Lighthouse three times with its simulated mobile profile. The command retains the full reports in this directory and fails when any run exceeds the Release specification.

| Run | LCP | CLS | TBT | Transfer | Requests | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 1,655 ms | 0.038 | 0 ms | 149,257 bytes | 6 | Pass |
| 2 | 1,654 ms | 0.038 | 0 ms | 149,257 bytes | 6 | Pass |
| 3 | 1,654 ms | 0.038 | 0 ms | 149,257 bytes | 6 | Pass |

The limits are LCP at most 2,500 ms, CLS at most 0.1, and TBT below 200 ms. Each run scored 1.00 in the Lighthouse performance category.

## Assets and JavaScript

The first viewport contains no image. The introduction text is the LCP candidate, so no image is marked eager or high priority. All three content images begin below the first viewport. They use lazy loading, asynchronous decoding, reserved dimensions, and responsive source sets where raster variants apply.

The initial browser inspection requested the document, one stylesheet, two self-hosted variable fonts, and the favicon. Scrolling to the footer then loaded the desktop capture, phone capture, and tenant-isolation diagram. Every request used the Portfolio origin and returned successfully.

The built page contains one 3,149-byte inline module for the signature interaction. It has no third-party runtime or external script source. Generated JavaScript contains no analytics, action measurement, pixel, beacon, fetch, cookie, persistent storage, or fingerprinting code.

## Privacy

The production-output browser check found:

- no cookie;
- no `localStorage` entry;
- one `sessionStorage` entry, `portfolio:myconference-signature:v1=3`;
- no third-party network request.

The session value is a visit-local completion count. It contains no visitor identifier and the Portfolio never transmits it.

## Metadata and indexing

The rendered root uses the approved title, description, `https://haziqaiman.my/` canonical URL, and matching Open Graph and Twitter values. Social-image URLs use the custom HTTPS origin. The built HTML has no structured data.

| Build | Root metadata | `404.html` metadata | `robots.txt` | Sitemap |
| --- | --- | --- | --- | --- |
| Validation, `npm run build` | `noindex,nofollow` | `noindex,nofollow` | Disallow `/` | Root custom-domain URL only |
| Production, `npm run build:production` | `index,follow` | `noindex,nofollow` | Allow `/`, advertise sitemap | Root custom-domain URL only |

The Pages workflow defaults to validation on pushes. A manual dispatch exposes a required `validation` or `production` choice. Selecting production is the explicit post-approval cutover step.

## Static delivery and disclosure

The frozen build emits `index.html`, custom `404.html`, `robots.txt`, `sitemap.xml`, `favicon.svg`, `social-card.svg`, the Downloadable resume, self-hosted fonts, responsive image variants, and the tenant-isolation diagram. Primary Portfolio content appears in the HTML before the signature script.

Automated checks resolve every root-relative document and asset path, validate in-page fragments, and direct-load the built Portfolio in Chromium. `npm run audit` rejects secret formats, private paths, private-source references, ungoverned project assets, and planning material. The final clean-checkout run uses `npm ci`, `npm run check`, `npm test`, and `npm run build:production`.

## Reports

- `lighthouse-mobile-run-1.json`
- `lighthouse-mobile-run-2.json`
- `lighthouse-mobile-run-3.json`
