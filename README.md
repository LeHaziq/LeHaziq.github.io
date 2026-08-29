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
```

`npm test` builds the site, checks the generated routes and Downloadable resume,
and scans the repository and generated files for disclosure risks.

## Indexing

Builds block search indexing during validation. Production indexing remains a
separate release step after the custom domain is ready.
