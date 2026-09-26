// Site-wide behaviour: theme, intro, logo car, scroll progress, reveals, small widgets.
// Runs once; per-page setup hangs off Astro's `astro:page-load` (fires on first load and after each navigation).

const root = document.documentElement;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- theme ---------------- */
type Theme = 'light' | 'dark';
const currentTheme = (): Theme => (root.dataset.theme === 'dark' ? 'dark' : 'light');

function applyStoredTheme() {
  let stored: string | null = null;
  try { stored = localStorage.getItem('theme'); } catch {}
  root.dataset.theme = stored === 'light' ? 'light' : 'dark';
  root.classList.add('js');
}

function syncToggle() {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!btn) return;
  const next = currentTheme() === 'dark' ? 'Paper' : 'Asphalt';
  const label = btn.querySelector('[data-theme-label]');
  if (label) label.textContent = next;
  btn.setAttribute('aria-label', `Switch to the ${next === 'Paper' ? 'light' : 'dark'} theme`);
}

function setTheme(next: Theme) {
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
  syncToggle();
  window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
}

document.addEventListener('click', (event) => {
  const btn = (event.target as Element | null)?.closest('[data-theme-toggle]');
  if (!btn) return;
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  if (!doc.startViewTransition || reduced()) return setTheme(next);
  // The new theme spreads out from the toggle like headlights.
  const r = btn.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.classList.add('theme-vt');
  const vt = doc.startViewTransition(() => setTheme(next));
  vt.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
  vt.finished.finally(() => root.classList.remove('theme-vt'));
});

/* ---------------- nav state (the header persists across navigations) ---------------- */
function syncNav() {
  const path = location.pathname;
  document.querySelectorAll<HTMLAnchorElement>('.site-nav a[data-nav]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const match = href.endsWith('/') && href !== '/' && path.startsWith(href.replace(/\/$/, ''));
    if (match) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/* ---------------- the logo car ---------------- */
function drive(svg: SVGSVGElement | null) {
  if (!svg || reduced()) return;
  const car = svg.querySelector<SVGGElement>('.logo-car');
  const motion = svg.querySelector('animateMotion') as (SVGElement & { beginElement?: () => void }) | null;
  if (!car || !motion?.beginElement) return;
  car.getAnimations().forEach((a) => a.cancel());
  car.animate([{ opacity: 1 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], { duration: 1100, fill: 'forwards' });
  motion.beginElement();
}

let lastHoverDrive = 0;
document.addEventListener('pointerover', (event) => {
  const brand = (event.target as Element | null)?.closest('.brand');
  if (!brand || performance.now() - lastHoverDrive < 1200) return;
  lastHoverDrive = performance.now();
  drive(brand.querySelector('svg.logo'));
});

/* ---------------- lane progress ---------------- */
let progressFrame = 0;
function updateProgress() {
  progressFrame = 0;
  const bar = document.querySelector<HTMLElement>('.lane-progress');
  if (!bar) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  bar.classList.toggle('on', max > innerHeight * 0.6 && scrollY > 48);
  bar.style.setProperty('--p', p.toFixed(4));
}
addEventListener('scroll', () => { if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress); updateSideCar(); }, { passive: true });
addEventListener('resize', () => { updateProgress(); updateSideCar(); });

/* ---------------- side lane: the car drives down as you scroll down, U-turns and drives back up ---------------- */
const car = { y: 12, ty: 12, a: 0, ta: 0, lastScroll: scrollY, frame: 0 };
function updateSideCar() {
  const el = document.querySelector<HTMLElement>('.side-car');
  if (!el || !el.offsetParent) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  car.ty = 12 + p * (innerHeight - 24 - el.offsetHeight);
  const dy = scrollY - car.lastScroll;
  if (Math.abs(dy) > 2) car.ta = dy > 0 ? 0 : 180;
  car.lastScroll = scrollY;
  if (reduced()) { car.y = car.ty; car.a = car.ta; paintCar(el); return; }
  if (!car.frame) car.frame = requestAnimationFrame(stepCar);
}
function paintCar(el: HTMLElement) {
  el.style.transform = `translateY(${car.y.toFixed(1)}px) rotate(${car.a.toFixed(1)}deg)`;
}
function stepCar() {
  car.frame = 0;
  const el = document.querySelector<HTMLElement>('.side-car');
  if (!el) return;
  car.y += (car.ty - car.y) * 0.16;
  car.a += (car.ta - car.a) * 0.14;
  paintCar(el);
  if (Math.abs(car.ty - car.y) > 0.3 || Math.abs(car.ta - car.a) > 0.5) car.frame = requestAnimationFrame(stepCar);
}

/* ---------------- reveal on scroll ---------------- */
let observer: IntersectionObserver | null = null;
function setupReveal() {
  observer?.disconnect();
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)');
  if (!('IntersectionObserver' in window) || reduced()) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
  );
  els.forEach((el) => observer!.observe(el));
}

/* ---------------- intro: draw the road, drive it, dock top-left ---------------- */
function runIntro() {
  const overlay = document.querySelector<HTMLElement>('[data-intro-overlay]');
  const big = overlay?.querySelector<SVGSVGElement>('svg.logo') ?? null;
  const small = document.querySelector<SVGSVGElement>('.brand svg.logo');
  const word = document.querySelector<HTMLElement>('.brand-word');
  const timers: number[] = [];
  const anims: Animation[] = [];
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    removeEventListener('keydown', finish);
    removeEventListener('wheel', finish);
    const ease = 'cubic-bezier(.2,.7,.2,1)';
    const parts = [document.querySelector('.site-nav'), document.querySelector('main'), document.querySelector('.site-footer')];
    parts.forEach((el, i) => {
      (el as HTMLElement | null)?.animate(
        [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
        { duration: 700, delay: 90 * i, easing: ease, fill: 'backwards' },
      );
    });
    word?.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'backwards' });
    overlay?.remove();
    delete root.dataset.intro;
    setupReveal();
    updateProgress();
  };

  if (!overlay || !big || !small) return finish();
  overlay.addEventListener('click', finish, { once: true });
  addEventListener('keydown', finish, { once: true });
  addEventListener('wheel', finish, { once: true, passive: true });

  const road = big.querySelector('.logo-road');
  const lane = big.querySelector('.logo-lane');
  if (road) anims.push(road.animate([{ strokeDasharray: '100 100', strokeDashoffset: 100 }, { strokeDasharray: '100 100', strokeDashoffset: 0 }], { duration: 850, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'both' }));
  if (lane) anims.push(lane.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 650, fill: 'both' }));
  timers.push(window.setTimeout(() => drive(big), 750));
  timers.push(window.setTimeout(() => {
    if (done) return;
    const a = big.getBoundingClientRect();
    const b = small.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const s = b.width / a.width;
    overlay.querySelector('.intro-hint')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    const bg = getComputedStyle(overlay).backgroundColor;
    overlay.animate([{ backgroundColor: bg }, { backgroundColor: 'rgba(0,0,0,0)' }], { duration: 500, delay: 250, fill: 'forwards' });
    const fly = big.animate(
      [{ transform: 'translate(0px, 0px) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
      { duration: 750, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' },
    );
    fly.onfinish = finish;
  }, 1750));
}

/* ---------------- small widgets ---------------- */
function setupCopy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    if (btn.dataset.ready) return;
    btn.dataset.ready = '1';
    btn.addEventListener('click', async () => {
      const target = document.getElementById(btn.dataset.copy || '');
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent || '');
        btn.textContent = 'Copied';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(target);
        getSelection()?.removeAllRanges();
        getSelection()?.addRange(range);
        btn.textContent = 'Selected';
      }
      setTimeout(() => (btn.textContent = 'Copy'), 1600);
    });
  });
}

function setupLiteYouTube() {
  document.querySelectorAll<HTMLButtonElement>('[data-yt]').forEach((btn) => {
    if (btn.dataset.ready) return;
    btn.dataset.ready = '1';
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
      iframe.title = btn.getAttribute('aria-label') || 'Video';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.className = 'yt-frame';
      btn.replaceWith(iframe);
    });
  });
}

function countView() {
  const gc = (window as unknown as { goatcounter?: { count?: (o: object) => void } }).goatcounter;
  if (gc?.count) gc.count({ path: location.pathname });
  else if (document.querySelector('script[data-goatcounter]')) addEventListener('load', () => countView(), { once: true });
}

/* ---------------- lifecycle ---------------- */
let firstLoad = true;
document.addEventListener('astro:after-swap', applyStoredTheme);
document.addEventListener('astro:page-load', () => {
  syncToggle();
  syncNav();
  setupCopy();
  setupLiteYouTube();
  updateProgress();
  car.lastScroll = scrollY;
  updateSideCar();
  countView();
  if (firstLoad) {
    firstLoad = false;
    if (root.dataset.intro) runIntro();
    else setupReveal();
    return;
  }
  setupReveal();
  drive(document.querySelector('.brand svg.logo'));
});
