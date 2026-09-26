# shailendrasekhar.github.io

Personal site of Shailendra Sekhar, PhD student at the Robotics Research Center, IIIT Hyderabad.
Built with [Astro](https://astro.build), deployed to GitHub Pages by GitHub Actions.

The previous hand-written site lives on the `legacy` branch.

## Run it

```sh
npm install
npm run dev       # http://localhost:4321
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
| Home hero overlay | `src/scripts/scene.ts` |
| Take the wheel (three.js) | `src/scripts/drive.ts` |
| CV | `public/cv.pdf` (placeholder) |

**Add a LEGO photo:** put the image in `public/lego/` and add `src: '/lego/your-photo.jpg'` to an entry in `builds` in `src/data/timeline.ts`.

**Turn on analytics:** create a free site at [goatcounter.com](https://www.goatcounter.com) and put its code in `goatcounter` in `src/data/site.ts`. No cookies, so no consent banner.

## Regenerating the home hero

The hero plays 10 seconds of real Hyderabad traffic with detector output drawn on top. The boxes are precomputed:

1. Cut a clip: `ffmpeg -ss 43 -i source.webm -t 10 -an -vf "scale=1280:720,fps=24" -c:v libx264 -crf 27 -pix_fmt yuv420p -movflags +faststart public/media/hyderabad-traffic.mp4`
2. Track it with YOLO11 + ByteTrack (`pip install ultralytics`) and write `public/media/hyderabad-traffic.tracks.json`: `{fps, w, h, classes, frames: [[[id, class, conf, x, y, w, h], …], …]}`.

Footage: [“Traffic in Hyderabad”](https://commons.wikimedia.org/wiki/File:Traffic_in_Hyderabad.webm) by Oleg Yunakov, CC BY-SA 4.0. The trimmed clip is shared under the same licence.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`. In the repository settings, Pages must use **GitHub Actions** as its source.
