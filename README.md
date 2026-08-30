# Muhammad Haziq Aiman Anuar's Portfolio

This repository contains the static Astro foundation for
[haziqaiman.my](https://haziqaiman.my/).

## Local development

Use Node.js 22.12 or later and npm 9.6.5 or later.

```sh
npm ci
npm run dev
```

## Checks

```sh
npm run check
npm test
npm run measure:performance
```

`npm test` builds the site, checks the generated routes and Downloadable resume,
tests the built site in the browser, and scans the repository and generated files
for disclosure risks. The performance command retains three mobile Lighthouse
reports under `tests/artifacts/performance` and enforces the release thresholds.

## Project authoring

Projects live in `src/content/projects` as one Markdown record per project. Add a
record and any approved files under `src/assets/projects`; routine additions do
not require edits to Astro components or TypeScript.

The content model validates shared project data, Academic project content,
Featured project blocks, evidence, links, and assets. Run `npm run check` while
authoring. The production build also rejects duplicate slugs and broken evidence
or asset references, and it omits draft projects and draft evidence.

## Indexing

`npm run build` blocks indexing for validation. After cutover approval,
`npm run build:production` emits `index,follow`, an index-allowing `robots.txt`,
and the root-only sitemap. The Pages workflow exposes the same choice on manual
dispatch; pushes to `main` always use validation indexing.
