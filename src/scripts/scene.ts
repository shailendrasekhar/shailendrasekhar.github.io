// Desktop hero: plays real traffic footage and draws the detector's tracks over it, frame by frame.
// Tracks come from an offline YOLO11 + ByteTrack run (see README: "Regenerating the hero").

type Det = [id: number, cls: number, conf: number, x: number, y: number, w: number, h: number];
type Tracks = { fps: number; w: number; h: number; model: string; classes: string[]; frames: Det[][] };

const VIDEO = '/media/hyderabad-traffic.mp4';
const TRACKS = '/media/hyderabad-traffic.tracks.json';
const TWO_WHEELERS = new Set(['motorcycle', 'bicycle']);
const TRAIL = 30;

let teardown: (() => void) | null = null;
let tracksPromise: Promise<Tracks> | null = null;
const loadTracks = () => (tracksPromise ??= fetch(TRACKS).then((r) => r.json() as Promise<Tracks>));

document.addEventListener('astro:page-load', start);
document.addEventListener('astro:before-swap', () => { teardown?.(); teardown = null; });

function start() {
  teardown?.();
  teardown = null;
  const fig = document.querySelector<HTMLElement>('[data-scene]');
  if (!fig) return;
  const wide = matchMedia('(min-width: 900px)');
  if (!wide.matches) {
    const retry = () => wide.matches && start();
    wide.addEventListener('change', retry);
    teardown = () => wide.removeEventListener('change', retry);
    return;
  }
  teardown = mount(fig);
}

function mount(fig: HTMLElement): () => void {
  const frame = fig.querySelector<HTMLElement>('.scene-frame')!;
  const poster = fig.querySelector<HTMLImageElement>('.scene-poster')!;
  const canvas = fig.querySelector<HTMLCanvasElement>('.scene-overlay')!;
  const counts = fig.querySelector<HTMLElement>('[data-counts]')!;
  const tip = fig.querySelector<HTMLElement>('[data-tip]')!;
  const ctx = canvas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

  let data: Tracks | null = null;
  let alive = true;
  let userPaused = reduced || saveData;
  let showBoxes = true;
  let showTrails = true;
  let current = 0;
  let lastDrawn = -1;
  let pointer: { x: number; y: number } | null = null;
  let hoverId: number | null = null;
  let rafId = 0;
  let vfcId = 0;
  const trails = new Map<number, { x: number; y: number }[]>();
  const firstSeen = new Map<number, number>();

  // Geometry: the video is object-fit: cover inside the frame.
  let W = 0, H = 0, scale = 1, ox = 0, oy = 0, dpr = 1;
  const layout = () => {
    const r = frame.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const vw = data?.w ?? 1280, vh = data?.h ?? 720;
    scale = Math.max(W / vw, H / vh);
    ox = (W - vw * scale) / 2;
    oy = (H - vh * scale) / 2;
    lastDrawn = -1;
    draw(current);
  };
  const ro = new ResizeObserver(layout);
  ro.observe(frame);

  // The video itself: created here so phones never download it.
  let video: HTMLVideoElement | null = null;
  if (!saveData) {
    video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.src = VIDEO;
    poster.closest('picture')!.after(video);
    video.addEventListener('loadeddata', () => { video!.classList.add('ready'); if (!userPaused) video!.play().catch(() => {}); }, { once: true });
  }

  loadTracks().then((t) => {
    if (!alive) return;
    data = t;
    layout();
    loop();
  }).catch(() => {});

  const frameAt = (seconds: number) => (data ? Math.floor(seconds * data.fps + 1e-3) % data.frames.length : 0);

  function loop() {
    if (!alive || !data) return;
    const v = video as (HTMLVideoElement & { requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number }) | null;
    if (v?.requestVideoFrameCallback) {
      const onFrame = (_: number, meta: { mediaTime: number }) => {
        if (!alive) return;
        current = frameAt(meta.mediaTime);
        draw(current);
        vfcId = v.requestVideoFrameCallback!(onFrame);
      };
      vfcId = v.requestVideoFrameCallback(onFrame);
    } else {
      const tick = () => {
        if (!alive) return;
        if (video && !video.paused) current = frameAt(video.currentTime);
        draw(current);
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }
    draw(current);
  }

  function updateTrails(f: number, dets: Det[]) {
    if (f < lastDrawn) { trails.clear(); firstSeen.clear(); }
    for (const [id, , , x, y, w, h] of dets) {
      const list = trails.get(id) ?? [];
      list.push({ x: x + w / 2, y: y + h });
      if (list.length > TRAIL) list.shift();
      trails.set(id, list);
      if (!firstSeen.has(id)) firstSeen.set(id, f);
    }
  }

  function draw(f: number) {
    if (!data) return;
    const dets = data.frames[f] ?? [];
    if (f !== lastDrawn) updateTrails(f, dets);
    lastDrawn = f;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const sx = (x: number) => ox + x * scale;
    const sy = (y: number) => oy + y * scale;

    // Which box is under the pointer (smallest wins, so riders beat their bikes).
    hoverId = null;
    if (pointer) {
      let best = Infinity;
      for (const [id, , , x, y, w, h] of dets) {
        const X = sx(x), Y = sy(y), BW = w * scale, BH = h * scale;
        if (pointer.x >= X && pointer.x <= X + BW && pointer.y >= Y && pointer.y <= Y + BH && BW * BH < best) {
          best = BW * BH;
          hoverId = id;
        }
      }
    }

    if (showTrails) {
      for (const [id] of dets) {
        const t = trails.get(id);
        if (!t || t.length < 3) continue;
        const hot = id === hoverId;
        ctx.beginPath();
        t.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y))));
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = hot ? 2.5 : 1.5;
        ctx.strokeStyle = hot ? '#f0b429' : 'rgba(245,245,241,.55)';
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    if (showBoxes) {
      // Labels scale with the video's on-screen size (11px at 1120px wide).
      const fs = Math.round(Math.min(16, Math.max(11, W / 100)));
      const chipH = fs + 5;
      ctx.font = `600 ${fs}px "Overpass Mono", ui-monospace, monospace`;
      ctx.textBaseline = 'middle';
      for (const [id, c, conf, x, y, w, h] of dets) {
        const cls = data.classes[c];
        const hot = id === hoverId;
        const person = cls === 'person';
        const X = sx(x), Y = sy(y), BW = w * scale, BH = h * scale;
        ctx.lineWidth = hot ? 2.5 : person ? 1 : 1.5;
        ctx.strokeStyle = hot ? '#f0b429' : person ? 'rgba(245,245,241,.6)' : 'rgba(245,245,241,.95)';
        ctx.setLineDash(person && !hot ? [4, 3] : []);
        ctx.strokeRect(X, Y, BW, BH);
        ctx.setLineDash([]);
        if (person && !hot) continue;
        const label = `${cls} ${conf.toFixed(2)} #${id}`;
        const tw = ctx.measureText(label).width + 10;
        const cy = Y > chipH + 2 ? Y - chipH : Y;
        ctx.fillStyle = hot ? '#f0b429' : 'rgba(245,245,241,.95)';
        ctx.fillRect(X - (hot ? 1.25 : 0.75), cy, tw, chipH);
        ctx.fillStyle = '#14161a';
        ctx.fillText(label, X + 4, cy + chipH / 2 + 0.5);
      }
    }

    // HUD counts.
    const n = { person: 0, two: 0, car: 0, truck: 0, bus: 0 };
    for (const [, c] of dets) {
      const cls = data.classes[c];
      if (cls === 'person') n.person++;
      else if (TWO_WHEELERS.has(cls)) n.two++;
      else if (cls === 'car') n.car++;
      else if (cls === 'truck') n.truck++;
      else if (cls === 'bus') n.bus++;
    }
    const plural = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
    const parts = [plural(n.person, 'person', 'people'), plural(n.two, 'two-wheeler', 'two-wheelers'), plural(n.car, 'car', 'cars')];
    if (n.truck) parts.push(plural(n.truck, '“truck”', '“trucks”'));
    if (n.bus) parts.push(plural(n.bus, 'bus', 'buses'));
    counts.textContent = parts.join(' · ');

    // Tooltip.
    const hovered = hoverId === null ? undefined : dets.find((d) => d[0] === hoverId);
    if (!hovered || !pointer) {
      tip.hidden = true;
      canvas.style.cursor = 'crosshair';
      return;
    }
    canvas.style.cursor = 'pointer';
    const [id, c, conf, x, y, w] = hovered;
    const cls = data.classes[c];
    const t = trails.get(id) ?? [];
    const seen = ((f - (firstSeen.get(id) ?? f)) / data.fps).toFixed(1);
    let heading = 'holding still';
    if (t.length > 8) {
      const dx = t[t.length - 1].x - t[t.length - 9].x;
      if (Math.abs(dx) > 6) heading = dx < 0 ? 'moving left' : 'moving right';
    }
    const note = cls === 'truck' ? '<em>Probably an auto-rickshaw. The model has no class for it.</em>' : '';
    tip.innerHTML = `<b>${cls} · track #${id}</b>confidence ${conf.toFixed(2)}<br>tracked for ${seen} s<br>${heading}${note}`;
    tip.hidden = false;
    const tx = Math.min(W - tip.offsetWidth - 8, Math.max(8, sx(x + w) + 10));
    const ty = Math.min(H - tip.offsetHeight - 8, Math.max(8, sy(y)));
    tip.style.left = `${tx}px`;
    tip.style.top = `${ty}px`;
  }

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    draw(current);
  };
  const onLeave = () => { pointer = null; draw(current); };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);

  // Controls.
  const buttons = fig.querySelectorAll<HTMLButtonElement>('[data-act]');
  const setPlay = (playing: boolean) => {
    const b = fig.querySelector<HTMLButtonElement>('[data-act="play"]')!;
    b.textContent = playing ? 'Pause' : 'Play';
    b.setAttribute('aria-pressed', String(playing));
  };
  setPlay(!userPaused);
  const onClick = (e: Event) => {
    const act = (e.currentTarget as HTMLButtonElement).dataset.act;
    if (act === 'play') {
      userPaused = !userPaused;
      if (video) userPaused ? video.pause() : video.play().catch(() => {});
      setPlay(!userPaused);
    } else if (act === 'boxes') {
      showBoxes = !showBoxes;
      (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(showBoxes));
    } else if (act === 'trails') {
      showTrails = !showTrails;
      (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(showTrails));
    }
    lastDrawn = -1;
    draw(current);
  };
  buttons.forEach((b) => b.addEventListener('click', onClick));

  // Pause when off screen or the tab is hidden.
  const io = new IntersectionObserver(([entry]) => {
    if (!video || userPaused) return;
    entry.isIntersecting ? video.play().catch(() => {}) : video.pause();
  }, { threshold: 0.1 });
  io.observe(frame);
  const onVis = () => { if (video && !userPaused) document.hidden ? video.pause() : video.play().catch(() => {}); };
  document.addEventListener('visibilitychange', onVis);

  return () => {
    alive = false;
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    buttons.forEach((b) => b.removeEventListener('click', onClick));
    cancelAnimationFrame(rafId);
    const v = video as (HTMLVideoElement & { cancelVideoFrameCallback?: (id: number) => void }) | null;
    if (v?.cancelVideoFrameCallback && vfcId) v.cancelVideoFrameCallback(vfcId);
    video?.pause();
    video?.removeAttribute('src');
    video?.load();
    video?.remove();
  };
}
