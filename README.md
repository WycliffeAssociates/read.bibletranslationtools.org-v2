## Built with at a glance:

File/Folder tree below:

- [Astro](https://docs.astro.build/en/getting-started/) - SSR rendering mode with intent to host on Cloudflare (currently using cloudflare adapted)
- [Solid JS](https://www.solidjs.com/guides/getting-started) - for Javascript components.
- [Tailwind CSS](https://tailwindcss.com/)
- [Playwright](https://playwright.dev/docs/intro) - Component and E2E tests
- [Vitest](https://vitest.dev/guide/why.html) - Unit tests
- [Vite-pwa](https://vite-pwa-org.netlify.app/frameworks/astro.html) - Generates the Service Worker for PWA (along with Astro adapter)
- [Google Workbox](https://developer.chrome.com/docs/workbox/) - custom Service worker logic

## Wacs Templates supported

- Bible (bible)
- Translation Notes (tn)
- Translation Questions (tq)
- Bible Commentary (bc)
- Translation Words (tw)
- Translation Manual (tm)
  Notes, bible, questions, and commentary share a template:
  Words and Manual have their own;

## Folders

### Functions

These are [cloudflare pages functions](https://developers.cloudflare.com/pages/platform/functions/). All functions, for naming sake, are placed under the api route (file based routing). They can be tested locally using wrangler. Run the build and preview commands to fire up the functions server to run the app.

### Playwright

This is the folder that serves as the browser shell for any component testing (note )

### Public

Assets not processed by Vite. Fonts, and PWA icons etc;

### SRC

- Assets - assets (e.g. logos / images) processed by Vite
- Components - Naming convention currently is that each component gets its own folder. Supporting components (e.g. a button only used in other parent component) can also be placed in said folder. Components are put in a barrel and exported from src/components/index.tsx as named components for consistency
- Layouts - page layouts that can be used. Always astro files.
- Lib - Application code for interaction with api (i.e. serverless functions), utilities, route listing, internationalization helpers etc;
- Pages - Astro uses file based routing.
- Styles - Any non tailwind based css
- Translations - Each language gets a json file. These will be imported to application code lazily based on _consistent naming of language codes_. There should be an svg flag ([some ex. flags here](<[https://](https://github.com/OnTheGoSystems/SVG-flags-language-switcher)>)) of schema `code`.svg, and the `index.ts` file in the translations folder needs the bare minimum of its name and code added to the array as well.
- Types - common or reused types. Other types are just next to source code as needed.
- pwa.js - basic registration logic (separate from behavior) for SW.
- sw.js - The custom service worker. Name and location must be consistent as placed in Astro.config

### Tests

- e2e - uses [Playwright](https://playwright.dev/docs/intro).
- component testing - also playwright, but a few additional quirks worth readaing in docs. [Playwright Components](https://playwright.dev/docs/test-components#how-to-get-started). Vitest can also test components, and has the upper hand on speed, but playwright already ships a browser, so components can be tested under different window conditions.
- Unit - Vitest: https://vitest.dev/guide/why.html; Can theoretically be used to test anything that isn't an astro file, but currently tests primarily cover logic in the lib folder.

### Additional Files

- .dev.vars - Used as .env for cloudflare bindings.
- manifest.ts - The pwa manifest
- stats.html - There is a [Vite/Rollup plugin](https://www.npmjs.com/package/rollup-plugin-visualizer) to visualize bundle size in the vite build process. This is the output of that. Reasonable Performance budget suggests about ~100kib of HTML/CSS/Fonts (e.g. check network tab for amount loaded), and then ~300-350kib JS gzipped: Read more [here](): [text](https://infrequently.org/2021/03/the-performance-inequality-gap/)
- Config file - see respective tools for guides to their configs.

### Folder / File Tree

```
├── README.md
├── astro.config.mjs
├── functions
│   └── api/
├── manifest.ts
├── package.json
├── playwright
│   ├── index.html
│   └── index.ts
├── playwright-ct.config.ts
├── playwright.config.ts
├── pnpm-lock.yaml
├── public
│   ├── fonts/
│   ├── icons/
├── src
│   ├── assets
│   │   └── images/
│   ├── components/
│   ├── env.d.ts
│   ├── layouts/
│   ├── lib/
│   ├── pages
│   │   ├── 404.astro
│   │   ├── index.astro
│   │   └── read
│   │       ├── [user]
│   │       │   └── [repo].astro
│   │       └── index.astro
│   ├── pwa.ts
│   ├── styles/
│   ├── sw.js
│   ├── translations/
│   └── types/
├── stats.html
├── tailwind.config.cjs
├── tests
│   ├── component/
│   ├── e2e/
│   └── unit/
├── tsconfig.json
└── vitest.config.ts

```
