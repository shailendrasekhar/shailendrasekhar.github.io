# shailendrasekhar.github.io

Personal site of Shailendra Sekhar, PhD student at the Robotics Research Center, IIIT Hyderabad.
Built with [Astro](https://astro.build), deployed to GitHub Pages by GitHub Actions.

The previous hand-written site lives on the `legacy` branch.

## Run it

```sh
npm install
npm run dev       # http://localhost:4321
npm run check     # type-check the .astro and .ts files
npm run build     # static site in dist/
npm run preview   # serve dist/
```

## Where things live

| What | Where |
| --- | --- |
| News items | `src/data/news.ts` |
| Publications | `src/data/publications.ts` |
| Projects | `src/data/projects.ts` |
| Timeline and LEGO builds | `src/data/timeline.ts` |
| Email, links, analytics code | `src/data/site.ts` |
| Colours, type, spacing | `src/styles/tokens.css` (mirrors the "Shailendra Sekhar" design system in Claude Design) |
| Intro, theme, scroll effects | `src/scripts/ui.ts` |
| The home hero town and "Take the wheel" (three.js) | `src/scripts/drive.ts` |
| About page photos | `src/assets/about/` (resized at build time), listed in `src/data/timeline.ts` |
| CV | `public/cv.pdf` (placeholder) |

**Add a LEGO photo:** put the image in `public/lego/` and add `src: '/lego/your-photo.jpg'` to an entry in `builds` in `src/data/timeline.ts`.

**Turn on analytics:** create a free site at [goatcounter.com](https://www.goatcounter.com) and put its code in `goatcounter` in `src/data/site.ts`. No cookies, so no consent banner.

## The home hero

On screens 900px and wider, a live 3D town plays behind the home hero: the autopilot drives, a slow drone camera follows it and drifts with the pointer. "Take the wheel" drives it in place: the copy steps aside, the HUD and controls come up, and Esc (or scrolling away) hands it back to the autopilot. three.js loads after the page (and the intro) is on screen, and not at all on phones or with Save-Data on; phones get the line-drawn dashcam in `src/components/HeroDashcam.astro`. The "Take the wheel" button only appears once the town is running, so Save-Data or a browser without WebGL never shows a dead button. Until someone takes the wheel the town renders at 30 fps. Under reduced motion it holds one still frame, and only moves while someone is driving. The old `/drive` page redirects to the home page.

`public/og.jpg`, the link-preview image, is a 1200×630 screenshot of the home page with the town running. Paper pages can pass their own 1200×630 image to `Base` (see `public/research/imitation-bt/og.jpg`).

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`: type-check, build, deploy. Pull requests run the type-check and build only. In the repository settings, Pages must use **GitHub Actions** as its source.
