// "Take the wheel": a small Hyderabad-style town in three.js.
// A signalled crossroads, four roundabouts that turn every road into a loop, left-hand traffic,
// and road users with their own ideas about the rules. Hand the car to the autopilot or drive it yourself.
import * as THREE from 'three';

/* ================================================================== geometry */
const A = 120;                 // junction centre to roundabout centre (m)
const LANE = 3.5;
const HALF_ROAD = 2 * LANE;    // two lanes each way
const BOX = HALF_ROAD;         // junction box half-size
const STOP = BOX + 4.5;        // stop lines, measured from the junction centre
const FOOT = HALF_ROAD + 1.6;  // footpath walking line
const ISLAND = 8.6;            // roundabout island radius
const RING_IN = 11;            // inner circulating lane radius
const RING_OUT = 14.5;         // outer circulating lane radius
const RING_EDGE = 17.3;        // outer edge of the roundabout
const ARM_END = A - RING_EDGE; // where the straight road meets the roundabout
const MAX_V = 16;              // ego top speed (m/s)
const UP = new THREE.Vector3(0, 1, 0);

type Road = 'ew' | 'ns';
type Kind = 'car' | 'auto' | 'bus' | 'bike';

/* A closed driving line (one lane of one road, round both roundabouts), sampled every ~1 m. */
class Loop {
  pts: THREE.Vector3[] = [];
  tans: THREE.Vector3[] = [];
  len = 0;
  n = 0;
  ds = 1;
  stops: number[] = [];
  vlim: number[] = [];
  sibling!: Loop;
  constructor(public road: Road, public kerb: boolean, control: THREE.Vector3[]) {
    const curve = new THREE.CatmullRomCurve3(control, true, 'centripetal');
    this.len = curve.getLength();
    this.n = Math.round(this.len);
    this.ds = this.len / this.n;
    this.pts = curve.getSpacedPoints(this.n).slice(0, this.n);
    for (let i = 0; i < this.n; i++) {
      const a = this.pts[(i - 1 + this.n) % this.n], b = this.pts[(i + 1) % this.n];
      this.tans.push(new THREE.Vector3().subVectors(b, a).setY(0).normalize());
    }
    // Curve speed: the slowest comfortable speed (2.8 m/s² sideways) over the next 15 m.
    const k: number[] = [];
    for (let i = 0; i < this.n; i++) {
      const a = this.tans[(i - 2 + this.n) % this.n], b = this.tans[(i + 2) % this.n];
      k.push(Math.acos(Math.min(1, Math.max(-1, a.dot(b)))) / (4 * this.ds));
    }
    for (let i = 0; i < this.n; i++) {
      let lim = 30;
      for (let j = 0; j < 15; j++) lim = Math.min(lim, Math.sqrt(2.8 / Math.max(1e-4, k[(i + j) % this.n])));
      this.vlim.push(lim);
    }
    // Stop lines: where the line crosses into the junction approach.
    for (let i = 0; i < this.n; i++) {
      const p = this.pts[i], q = this.pts[(i - 1 + this.n) % this.n];
      const along = road === 'ew' ? p.x : p.z, prev = road === 'ew' ? q.x : q.z, cross = road === 'ew' ? p.z : p.x;
      if (Math.abs(cross) < HALF_ROAD && Math.abs(prev) > STOP && Math.abs(along) <= STOP) this.stops.push(i * this.ds);
    }
  }
  wrap(s: number) { return ((s % this.len) + this.len) % this.len; }
  speedLimit(s: number) { return this.vlim[Math.floor(this.wrap(s) / this.ds) % this.n]; }
  private lerp<T extends THREE.Vector3>(arr: T[], s: number, out: THREE.Vector3) {
    const f = this.wrap(s) / this.ds;
    const i = Math.floor(f) % this.n, t = f - Math.floor(f);
    return out.lerpVectors(arr[i], arr[(i + 1) % this.n], t);
  }
  tan(s: number, out = new THREE.Vector3()) { return this.lerp(this.tans, s, out).normalize(); }
  pos(s: number, lat = 0, out = new THREE.Vector3()) {
    this.lerp(this.pts, s, out);
    if (lat) { const t = this.tan(s, TMP_T); out.x += -t.z * lat; out.z += t.x * lat; }
    return out;
  }
  nearest(p: THREE.Vector3, hint?: number, window = 25): number {
    let best = 0, bestD = Infinity;
    const scan = (i: number) => {
      const q = this.pts[((i % this.n) + this.n) % this.n];
      const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
      if (d < bestD) { bestD = d; best = ((i % this.n) + this.n) % this.n; }
    };
    if (hint === undefined) for (let i = 0; i < this.n; i++) scan(i);
    else { const c = Math.round(this.wrap(hint) / this.ds); for (let i = c - window; i <= c + window; i++) scan(i); }
    return best * this.ds;
  }
  nextStop(s: number) {
    let best = Infinity, at = NaN;
    for (const st of this.stops) { const d = this.wrap(st - s); if (d < best) { best = d; at = st; } }
    return { dist: best, at };
  }
}
const TMP_T = new THREE.Vector3();

function loopControl(d: number, r: number): THREE.Vector3[] {
  // Eastbound on z = -d (left-hand traffic), clockwise round the east roundabout, westbound on z = +d, round the west one.
  const pts: THREE.Vector3[] = [];
  const alpha = Math.asin(Math.min(0.9, (d + 2) / r));
  const xEnd = A - r - 6;
  for (let x = -xEnd; x <= xEnd + 0.01; x += 8) pts.push(new THREE.Vector3(x, 0, -d));
  for (let k = 0; k <= 24; k++) { const phi = -(Math.PI - alpha) + (2 * (Math.PI - alpha) * k) / 24; pts.push(new THREE.Vector3(A + r * Math.cos(phi), 0, r * Math.sin(phi))); }
  for (let x = xEnd; x >= -xEnd - 0.01; x -= 8) pts.push(new THREE.Vector3(x, 0, d));
  for (let k = 0; k <= 24; k++) { const phi = alpha + ((2 * Math.PI - 2 * alpha) * k) / 24; pts.push(new THREE.Vector3(-A + r * Math.cos(phi), 0, r * Math.sin(phi))); }
  return pts;
}
const rot90 = (pts: THREE.Vector3[]) => pts.map((p) => new THREE.Vector3(p.z, 0, -p.x)); // E-W → N-S (eastbound becomes northbound)

/* ================================================================== signal */
const PHASES: [Road | 'all', 'green' | 'amber' | 'red', number][] = [
  ['ew', 'green', 12], ['ew', 'amber', 3], ['all', 'red', 1.5], ['ns', 'green', 12], ['ns', 'amber', 3], ['all', 'red', 1.5],
];
const CYCLE = PHASES.reduce((a, p) => a + p[2], 0);
function signalAt(road: Road, t: number): { color: 'green' | 'amber' | 'red'; left: number } {
  let u = ((t % CYCLE) + CYCLE) % CYCLE;
  for (const [r, c, dur] of PHASES) {
    if (u < dur) return { color: r === road ? c : 'red', left: dur - u };
    u -= dur;
  }
  return { color: 'red', left: 0 };
}

/* ================================================================== colours from the design tokens */
function palette() {
  const cs = getComputedStyle(document.documentElement);
  const c = (name: string, fallback: string) => new THREE.Color((cs.getPropertyValue(name) || fallback).trim());
  return {
    paper: c('--paper', '#101214'), raised: c('--paper-raised', '#171a1d'), ink: c('--ink', '#e8e9e5'), muted: c('--ink-muted', '#9ba1a7'),
    lane: c('--lane', '#f0b429'), asphalt: c('--asphalt', '#2a2f35'), marking: c('--marking', '#d6d8d3'), agent: c('--agent', '#b4b9be'),
    css: (name: string) => (cs.getPropertyValue(name) || '').trim(),
  };
}

/* ================================================================== mount */
export function mount(host: HTMLElement): () => void {
  const stage = host.querySelector<HTMLElement>('[data-stage]')!;
  const hud = {
    speed: host.querySelector<HTMLElement>('[data-hud-speed]')!,
    mode: host.querySelector<HTMLElement>('[data-hud-mode]')!,
    signal: host.querySelector<HTMLElement>('[data-hud-signal]')!,
    you: host.querySelector<HTMLElement>('[data-hud-you]')!,
    world: host.querySelector<HTMLElement>('[data-hud-world]')!,
    toast: host.querySelector<HTMLElement>('[data-hud-toast]')!,
    start: host.querySelector<HTMLButtonElement>('[data-start]')!,
    exit: host.querySelector<HTMLButtonElement>('[data-act="exit"]')!,
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let running = false;
  let cameraMode: 'chase' | 'top' | 'hood' = 'chase';
  let snapCamera = true;
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

  /* ---------------- renderer, scene, materials ---------------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Driving simulation. Arrow keys or W A S D to drive, space to brake, P for autopilot, C to change camera, Escape to stop driving.');
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 700);
  let pal = palette();

  const mat = {
    ground: new THREE.MeshLambertMaterial(), foot: new THREE.MeshLambertMaterial(), asphalt: new THREE.MeshLambertMaterial(),
    marking: new THREE.MeshBasicMaterial(), building: new THREE.MeshLambertMaterial(),
    edge: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.45 }),
    ego: new THREE.MeshLambertMaterial(), glass: new THREE.MeshLambertMaterial(), body: new THREE.MeshLambertMaterial(),
    canopy: new THREE.MeshLambertMaterial(), wheel: new THREE.MeshLambertMaterial(), ped: new THREE.MeshLambertMaterial(),
    pedRun: new THREE.MeshLambertMaterial(), path: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85 }),
    pole: new THREE.MeshLambertMaterial(),
    wrongway: new THREE.MeshLambertMaterial(),
  };
  const lamp = {
    red: [new THREE.MeshBasicMaterial({ color: 0x3a1614 }), new THREE.MeshBasicMaterial({ color: 0xff4d40 })],
    amber: [new THREE.MeshBasicMaterial({ color: 0x3a2a0c }), new THREE.MeshBasicMaterial({ color: 0xffb020 })],
    green: [new THREE.MeshBasicMaterial({ color: 0x0f2a18 }), new THREE.MeshBasicMaterial({ color: 0x3ddc84 })],
  };

  // The roundabout islands carry the S-road mark.
  const decalCanvas = document.createElement('canvas');
  decalCanvas.width = decalCanvas.height = 256;
  const decalTex = new THREE.CanvasTexture(decalCanvas);
  decalTex.colorSpace = THREE.SRGBColorSpace;
  function drawDecal() {
    const g2 = decalCanvas.getContext('2d')!;
    g2.clearRect(0, 0, 256, 256);
    g2.save();
    g2.scale(4, 4);
    const road = new Path2D('M46 14 C 41 8, 20 8, 20 20 C 20 31, 44 29, 44 42 C 44 55, 22 56, 16 49');
    g2.lineCap = 'butt';
    g2.strokeStyle = pal.css('--ink') || '#e8e9e5';
    g2.lineWidth = 12;
    g2.stroke(road);
    g2.strokeStyle = pal.css('--paper-raised') || '#171a1d';
    g2.lineWidth = 7;
    g2.stroke(road);
    g2.strokeStyle = pal.css('--lane') || '#f0b429';
    g2.lineWidth = 1.8;
    g2.setLineDash([3, 4]);
    g2.stroke(road);
    g2.restore();
    decalTex.needsUpdate = true;
  }
  const decalMat = new THREE.MeshBasicMaterial({ map: decalTex, transparent: true });

  function applyPalette() {
    pal = palette();
    scene.background = pal.paper;
    if (scene.fog) (scene.fog as THREE.Fog).color = pal.paper;
    mat.ground.color = pal.paper; mat.foot.color = pal.raised; mat.asphalt.color = pal.asphalt; mat.marking.color = pal.marking;
    mat.building.color = pal.raised; mat.edge.color = pal.ink; mat.ego.color = pal.lane; mat.glass.color = pal.asphalt;
    mat.body.color = pal.agent; mat.canopy.color.set(0x1b1d20); mat.wheel.color = pal.asphalt; mat.ped.color = pal.muted; mat.pedRun.color = pal.ink;
    mat.path.color = pal.lane; mat.pole.color = pal.muted; mat.wrongway.color = pal.muted;
    drawDecal();
  }
  scene.fog = new THREE.Fog(pal.paper, 80, 230);
  applyPalette();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 260 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);

  const geos: THREE.BufferGeometry[] = [];
  const g = <T extends THREE.BufferGeometry>(geo: T) => (geos.push(geo), geo);
  const flatQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

  /* ---------------- ground, roads, roundabouts ---------------- */
  const ground = new THREE.Mesh(g(new THREE.PlaneGeometry(4 * A, 4 * A)), mat.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const flat = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, z: number, y: number) => {
    const mesh = new THREE.Mesh(g(geo), m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  flat(new THREE.PlaneGeometry(2 * A, 2 * HALF_ROAD), mat.asphalt, 0, 0, 0.02);
  flat(new THREE.PlaneGeometry(2 * HALF_ROAD, 2 * A), mat.asphalt, 0, 0, 0.021);
  const centres = [new THREE.Vector3(A, 0, 0), new THREE.Vector3(-A, 0, 0), new THREE.Vector3(0, 0, A), new THREE.Vector3(0, 0, -A)];
  const islandGeo = g(new THREE.CylinderGeometry(ISLAND, ISLAND, 0.35, 48));
  const islandEdges = g(new THREE.EdgesGeometry(islandGeo, 30));
  const decalGeo = g(new THREE.PlaneGeometry(ISLAND * 1.3, ISLAND * 1.3));
  for (const c of centres) {
    flat(new THREE.CircleGeometry(RING_EDGE, 64), mat.asphalt, c.x, c.z, 0.022);
    flat(new THREE.RingGeometry(RING_EDGE - 0.35, RING_EDGE - 0.2, 64), mat.marking, c.x, c.z, 0.03);
    const island = new THREE.Mesh(islandGeo, mat.foot);
    island.position.set(c.x, 0.175, c.z);
    island.receiveShadow = true;
    island.add(new THREE.LineSegments(islandEdges, mat.edge));
    scene.add(island);
    const decal = new THREE.Mesh(decalGeo, decalMat);
    decal.rotation.x = -Math.PI / 2;
    decal.position.set(c.x, 0.36, c.z);
    scene.add(decal);
  }

  // Footpath blocks between the arms.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const size = ARM_END - HALF_ROAD - 4;
    const slab = new THREE.Mesh(g(new THREE.BoxGeometry(size, 0.16, size)), mat.foot);
    slab.position.set(sx * (HALF_ROAD + size / 2), 0.08, sz * (HALF_ROAD + size / 2));
    slab.receiveShadow = true;
    scene.add(slab);
  }

  // Markings as instanced strips.
  const stripGeo = g(new THREE.PlaneGeometry(1, 1));
  const strips: THREE.Matrix4[] = [];
  const addStrip = (x: number, z: number, rotY: number, len: number, wid: number) => {
    const q = new THREE.Quaternion().setFromAxisAngle(UP, rotY).multiply(flatQ);
    strips.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.03, z), q, new THREE.Vector3(len, wid, 1)));
  };
  for (const side of [-1, 1]) {
    // Lane dashes, 3 m on 4.5 m off (IRC:35), between the stop line and the roundabout.
    for (let s = STOP + 3; s < ARM_END - 2; s += 7.5) for (const off of [-LANE, LANE]) {
      addStrip(side * s, off, 0, 3, 0.14);
      addStrip(off, side * s, Math.PI / 2, 3, 0.14);
    }
    const len = ARM_END - STOP, mid = side * (STOP + len / 2);
    for (const off of [-0.18, 0.18, -HALF_ROAD + 0.3, HALF_ROAD - 0.3]) {
      addStrip(mid, off, 0, len, 0.14);
      addStrip(off, mid, Math.PI / 2, len, 0.14);
    }
    // Zebra crossings and stop lines on each arm.
    for (let k = -HALF_ROAD + 0.8; k < HALF_ROAD; k += 1.2) {
      addStrip(side * (BOX + 2.2), k, 0, 2.4, 0.5);
      addStrip(k, side * (BOX + 2.2), Math.PI / 2, 2.4, 0.5);
    }
  }
  // Stop lines on the approach half of each arm (left-hand traffic).
  addStrip(-STOP + 0.2, -LANE, Math.PI / 2, HALF_ROAD, 0.4);
  addStrip(STOP - 0.2, LANE, Math.PI / 2, HALF_ROAD, 0.4);
  addStrip(-LANE, STOP - 0.2, 0, HALF_ROAD, 0.4);
  addStrip(LANE, -STOP + 0.2, 0, HALF_ROAD, 0.4);
  // Roundabout lane divider.
  for (const c of centres) for (let k = 0; k < 28; k++) {
    const ang = (k / 28) * Math.PI * 2, r = (RING_IN + RING_OUT) / 2;
    addStrip(c.x + r * Math.cos(ang), c.z + r * Math.sin(ang), -ang - Math.PI / 2, 1.4, 0.14);
  }
  const stripMesh = new THREE.InstancedMesh(stripGeo, mat.marking, strips.length);
  strips.forEach((m, i) => stripMesh.setMatrixAt(i, m));
  scene.add(stripMesh);

  /* ---------------- signals ---------------- */
  type Head = { road: Road; lamps: Record<'red' | 'amber' | 'green', THREE.Mesh> };
  const heads: Head[] = [];
  const poleGeo = g(new THREE.CylinderGeometry(0.12, 0.12, 4.2, 8));
  const boxGeo = g(new THREE.BoxGeometry(0.5, 1.5, 0.5));
  const lampGeo = g(new THREE.SphereGeometry(0.17, 12, 8));
  // One head per approach, on the left of the approaching lanes, facing the traffic.
  const approaches: [number, number, number, Road][] = [
    [-STOP - 0.5, -HALF_ROAD - 1.2, -Math.PI / 2, 'ew'],  // eastbound, faces west
    [STOP + 0.5, HALF_ROAD + 1.2, Math.PI / 2, 'ew'],     // westbound, faces east
    [-HALF_ROAD - 1.2, STOP + 0.5, 0, 'ns'],              // northbound, faces south
    [HALF_ROAD + 1.2, -STOP - 0.5, Math.PI, 'ns'],        // southbound, faces north
  ];
  for (const [x, z, face, road] of approaches) {
    const grp = new THREE.Group();
    const pole = new THREE.Mesh(poleGeo, mat.pole);
    pole.position.y = 2.1;
    pole.castShadow = true;
    const box = new THREE.Mesh(boxGeo, mat.canopy);
    box.position.y = 4.3;
    box.castShadow = true;
    grp.add(pole, box);
    const lamps = {} as Head['lamps'];
    (['red', 'amber', 'green'] as const).forEach((c, i) => {
      const l = new THREE.Mesh(lampGeo, lamp[c][0]);
      l.position.set(0, 4.75 - i * 0.45, 0.27);
      grp.add(l);
      lamps[c] = l;
    });
    grp.position.set(x, 0, z);
    grp.rotation.y = face;
    scene.add(grp);
    heads.push({ road, lamps });
  }

  /* ---------------- buildings ---------------- */
  type Box2 = { x0: number; x1: number; z0: number; z1: number };
  const blocks: Box2[] = [];
  const bGeo = g(new THREE.BoxGeometry(1, 1, 1));
  const bEdges = g(new THREE.EdgesGeometry(bGeo));
  const addBuilding = (cx: number, cz: number, w: number, d: number, h: number) => {
    const mesh = new THREE.Mesh(bGeo, mat.building);
    mesh.scale.set(w, h, d);
    mesh.position.set(cx, h / 2 + 0.16, cz);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.add(new THREE.LineSegments(bEdges, mat.edge));
    scene.add(mesh);
    blocks.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    for (let a = HALF_ROAD + 10; a < ARM_END - 16; a += 11 + rnd() * 5) {
      const w = 7 + rnd() * 5, d = 8 + rnd() * 7;
      addBuilding(sx * (a + w / 2), sz * (HALF_ROAD + 5 + d / 2), w, d, 5 + rnd() * rnd() * 34);
    }
    for (let a = HALF_ROAD + 27; a < ARM_END - 16; a += 11 + rnd() * 5) {
      const w = 7 + rnd() * 5, d = 8 + rnd() * 6;
      addBuilding(sx * (HALF_ROAD + 5 + d / 2), sz * (a + w / 2), d, w, 5 + rnd() * rnd() * 34);
    }
  }
  for (const c of centres) for (const ang of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const x = c.x + Math.cos(ang) * 34, z = c.z + Math.sin(ang) * 34;
    if (Math.abs(x) < A - 10 && Math.abs(z) < A - 10) continue; // leave the arms clear
    addBuilding(x, z, 12 + rnd() * 8, 12 + rnd() * 8, 6 + rnd() * 18);
  }

  /* ---------------- vehicle and pedestrian models ---------------- */
  const shapes = {
    car: { body: g(new THREE.BoxGeometry(4.3, 0.9, 1.8)), cabin: g(new THREE.BoxGeometry(2.2, 0.7, 1.6)) },
    auto: { body: g(new THREE.BoxGeometry(2.7, 1.0, 1.35)), cabin: g(new THREE.BoxGeometry(2.1, 0.55, 1.4)) },
    bus: { body: g(new THREE.BoxGeometry(11, 2.6, 2.5)), cabin: g(new THREE.BoxGeometry(10.6, 0.3, 2.3)) },
    bike: { body: g(new THREE.BoxGeometry(1.9, 0.7, 0.45)), cabin: g(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 8)) },
    wheel: g(new THREE.BoxGeometry(0.7, 0.5, 0.25)),
  };
  const edgeCache = new Map<THREE.BufferGeometry, THREE.EdgesGeometry>();
  const edgesOf = (geo: THREE.BufferGeometry) => { if (!edgeCache.has(geo)) edgeCache.set(geo, g(new THREE.EdgesGeometry(geo))); return edgeCache.get(geo)!; };
  const dims = (geo: THREE.BufferGeometry) => geo.parameters as { width: number; height: number; depth: number };
  function vehicleModel(kind: Kind | 'ego', wrongWay = false): THREE.Group {
    const grp = new THREE.Group();
    const spec = kind === 'ego' ? shapes.car : shapes[kind];
    const bh = dims(spec.body).height;
    const body = new THREE.Mesh(spec.body, kind === 'ego' ? mat.ego : wrongWay ? mat.wrongway : mat.body);
    body.position.y = 0.35 + bh / 2;
    body.castShadow = true;
    if (kind !== 'ego') body.add(new THREE.LineSegments(edgesOf(spec.body), mat.edge));
    grp.add(body);
    const cabin = new THREE.Mesh(spec.cabin, kind === 'ego' ? mat.glass : kind === 'auto' || kind === 'bike' ? mat.canopy : mat.body);
    cabin.castShadow = true;
    if (kind === 'bike') cabin.position.set(-0.2, 0.35 + bh + 0.45, 0);
    else if (kind === 'bus') cabin.position.set(0, 0.35 + bh + 0.15, 0);
    else cabin.position.set(kind === 'auto' ? -0.1 : -0.3, 0.35 + bh + dims(spec.cabin).height / 2, 0);
    if (kind !== 'ego' && kind !== 'bike') cabin.add(new THREE.LineSegments(edgesOf(spec.cabin), mat.edge));
    grp.add(cabin);
    if (kind !== 'bike') {
      const L2 = dims(spec.body).width / 2 - 0.6, W2 = dims(spec.body).depth / 2;
      const axles = kind === 'auto' ? [[L2, 0], [-L2, W2], [-L2, -W2]] : [[L2, W2], [L2, -W2], [-L2, W2], [-L2, -W2]];
      for (const [x, z] of axles) { const w = new THREE.Mesh(shapes.wheel, mat.wheel); w.position.set(x, 0.3, z); grp.add(w); }
    }
    return grp;
  }
  const pedShape = { body: g(new THREE.CylinderGeometry(0.22, 0.26, 1.2, 8)), head: g(new THREE.SphereGeometry(0.19, 10, 8)) };
  function pedModel(runner: boolean) {
    const grp = new THREE.Group();
    const inner = new THREE.Group();
    const body = new THREE.Mesh(pedShape.body, runner ? mat.pedRun : mat.ped);
    body.position.y = 0.76;
    body.castShadow = true;
    const head = new THREE.Mesh(pedShape.head, runner ? mat.pedRun : mat.ped);
    head.position.y = 1.55;
    head.castShadow = true;
    inner.add(body, head);
    grp.add(inner);
    return grp;
  }

  /* ---------------- road network ---------------- */
  const loops: Loop[] = [];
  const ewIn = new Loop('ew', false, loopControl(LANE / 2, RING_IN));
  const ewOut = new Loop('ew', true, loopControl(LANE * 1.5, RING_OUT));
  const nsIn = new Loop('ns', false, rot90(loopControl(LANE / 2, RING_IN)));
  const nsOut = new Loop('ns', true, rot90(loopControl(LANE * 1.5, RING_OUT)));
  ewIn.sibling = ewOut; ewOut.sibling = ewIn; nsIn.sibling = nsOut; nsOut.sibling = nsIn;
  loops.push(ewIn, ewOut, nsIn, nsOut);

  /* ---------------- traffic ---------------- */
  type Veh = {
    kind: Kind; loop: Loop; s: number; v: number; dir: 1 | -1; v0: number; T: number; s0: number; jumper: number;
    len: number; wide: number; obj: THREE.Group; pos: THREE.Vector3; fwd: THREE.Vector3;
    lat: number; latV: number; latTarget: number; latTimer: number; hold: number; lcTimer: number;
    approach: number; runRed: boolean; lastStopDist: number; stuck: number; ghost: number; phase: number;
  };
  const DIM: Record<Kind, [number, number]> = { car: [4.3, 1.8], auto: [2.7, 1.35], bus: [11, 2.5], bike: [1.9, 0.6] };
  const vehicles: Veh[] = [];
  function spawn(kind: Kind, loop: Loop, s: number, dir: 1 | -1 = 1) {
    const [len, wide] = DIM[kind];
    const obj = vehicleModel(kind, dir === -1);
    scene.add(obj);
    const v0 = kind === 'bike' ? 10 + rnd() * 5 : kind === 'auto' ? 7 + rnd() * 3 : kind === 'bus' ? 7 + rnd() * 2 : 9 + rnd() * 5;
    const veh: Veh = {
      kind, loop, s, v: v0 * 0.7, dir, v0, T: kind === 'bike' ? 0.5 + rnd() * 0.5 : 0.7 + rnd() * 1.0, s0: 1 + rnd() * 2,
      jumper: dir === -1 ? 1 : ({ bike: 0.5, auto: 0.4, car: 0.2, bus: 0.1 } as const)[kind],
      len, wide, obj, pos: new THREE.Vector3(), fwd: new THREE.Vector3(1, 0, 0),
      lat: dir === -1 ? -1.75 : 0, latV: 0, latTarget: dir === -1 ? -1.75 : 0, latTimer: rnd() * 2, hold: 0, lcTimer: rnd() * 2,
      approach: NaN, runRed: false, lastStopDist: Infinity, stuck: 0, ghost: 0, phase: rnd() * 10,
    };
    vehicles.push(veh);
    return veh;
  }
  for (const loop of loops) {
    const count = loop.road === 'ew' ? 8 : 6;
    for (let i = 0; i < count; i++) {
      let kind: Kind = pick(['bike', 'bike', 'bike', 'auto', 'auto', 'car', 'car', 'car', 'bus'] as Kind[]);
      if (kind === 'bus' && !loop.kerb) kind = 'car';
      spawn(kind, loop, (i + rnd() * 0.5) * (loop.len / count));
    }
  }
  // A few riders going the wrong way along the kerb.
  spawn('bike', ewOut, 40, -1);
  spawn('bike', ewOut, 300, -1);
  spawn('bike', nsOut, 180, -1);

  /* ---------------- pedestrians ---------------- */
  type Ped = {
    obj: THREE.Group; road: Road; side: 1 | -1; along: number; dir: 1 | -1; speed: number;
    state: 'walk' | 'cross' | 'freeze' | 'down'; lateral: number; target: number; timer: number; runner: boolean; pos: THREE.Vector3; hitBy: number;
  };
  const peds: Ped[] = [];
  const ALONG_MIN = BOX + 5, ALONG_MAX = ARM_END - 6;
  for (let i = 0; i < 30; i++) {
    const runner = rnd() < 0.2;
    const obj = pedModel(runner);
    scene.add(obj);
    peds.push({
      obj, road: rnd() < 0.55 ? 'ew' : 'ns', side: rnd() < 0.5 ? 1 : -1, along: (rnd() < 0.5 ? 1 : -1) * (ALONG_MIN + rnd() * (ALONG_MAX - ALONG_MIN)),
      dir: rnd() < 0.5 ? 1 : -1, speed: runner ? 2.6 : 1.1 + rnd() * 0.5, state: 'walk', lateral: FOOT, target: -FOOT, timer: 3 + rnd() * 16,
      runner, pos: new THREE.Vector3(), hitBy: -9,
    });
  }
  const pedWorld = (p: Ped, out: THREE.Vector3) => (p.road === 'ew' ? out.set(p.along, 0, p.lateral * p.side) : out.set(p.lateral * p.side, 0, p.along));

  /* ---------------- ego ---------------- */
  const ego = {
    obj: vehicleModel('ego'), pos: new THREE.Vector3(), heading: 0, v: 0, steer: 0, auto: true,
    loop: ewIn as Loop, s: 0, status: 'Clear road', wait: 0, lastAlong: Infinity,
  };
  scene.add(ego.obj);
  const egoFwd = () => new THREE.Vector3(Math.cos(ego.heading), 0, Math.sin(ego.heading));
  function placeEgoOnLoop(loop: Loop, s: number) {
    ego.loop = loop;
    ego.s = loop.wrap(s);
    loop.pos(ego.s, 0, ego.pos);
    const t = loop.tan(ego.s);
    ego.heading = Math.atan2(t.z, t.x);
    snapCamera = true;
  }
  function attachAutopilot() {
    const f = egoFwd();
    let best: Loop = ego.loop, bestS = 0, bestD = Infinity;
    for (const loop of loops) {
      const s = loop.nearest(ego.pos);
      const p = loop.pos(s), t = loop.tan(s);
      const d = p.distanceTo(ego.pos) + (t.dot(f) < 0.3 ? 30 : 0);
      if (d < bestD) { bestD = d; best = loop; bestS = s; }
    }
    ego.loop = best;
    ego.s = bestS;
  }
  const reset = () => { placeEgoOnLoop(ewIn, ewIn.nearest(new THREE.Vector3(-60, 0, -LANE / 2))); ego.v = 8; ego.steer = 0; };
  reset();

  const planDots = new THREE.InstancedMesh(g(new THREE.PlaneGeometry(1.2, 0.35)), mat.path, 16);
  planDots.visible = false;
  scene.add(planDots);

  /* ---------------- obstacle sensing (shared by traffic and the autopilot) ---------------- */
  type Seen = { gap: number; v: number; what: string };
  function sense(pos: THREE.Vector3, fwd: THREE.Vector3, halfW: number, halfL: number, self: object, range: number, ghost = false): Seen {
    let best: Seen = { gap: Infinity, v: 0, what: '' };
    const consider = (p: THREE.Vector3, oHalfW: number, oHalfL: number, oFwd: THREE.Vector3 | null, oV: number, what: string, extra = 0.25) => {
      const dx = p.x - pos.x, dz = p.z - pos.z;
      if (dx * dx + dz * dz > range * range) return;
      const long = dx * fwd.x + dz * fwd.z;
      if (long <= 0) return;
      const lat = -dx * fwd.z + dz * fwd.x;
      const align = oFwd ? Math.abs(oFwd.x * fwd.x + oFwd.z * fwd.z) : 0;
      const reach = oHalfL * align + oHalfW * (1 - align);
      if (Math.abs(lat) > halfW + (oHalfW * align + oHalfL * (1 - align)) + extra) return;
      const gap = long - halfL - reach;
      if (gap < best.gap) best = { gap: Math.max(0.1, gap), v: oFwd ? Math.max(0, oV * (oFwd.x * fwd.x + oFwd.z * fwd.z)) : 0, what };
    };
    if (!ghost) for (const o of vehicles) if (o !== self) consider(o.pos, o.wide / 2, o.len / 2, o.fwd, o.v, o.dir === -1 ? 'wrong-way rider' : o.kind === 'bike' ? 'two-wheeler' : o.kind === 'auto' ? 'auto-rickshaw' : o.kind);
    for (const p of peds) if (p.state !== 'walk') consider(p.pos, 0.3, 0.3, null, 0, 'pedestrian', 0.9);
    if (self !== ego && !ghost) consider(ego.pos, 0.9, 2.2, egoFwd(), ego.v, 'you');
    return best;
  }
  const idm = (v: number, v0: number, gap: number, vLead: number, T: number, s0: number, a = 2.2, b = 3.5) => {
    const sStar = s0 + Math.max(0, v * T + (v * (v - vLead)) / (2 * Math.sqrt(a * b)));
    return a * (1 - Math.pow(v / Math.max(0.1, v0), 4) - Math.pow(sStar / gap, 2));
  };

  /* ---------------- stats and HUD ---------------- */
  const you = { peds: 0, contacts: 0, near: 0, reds: 0 };
  const world = { reds: 0, cutins: 0, jaywalk: 0, pickups: 0, incidents: 0 };
  let toastTimer = 0;
  function toast(text: string, ms = 2800) {
    hud.toast.textContent = text;
    hud.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (hud.toast.hidden = true), ms);
  }
  const CAM_LABEL = { chase: 'Chase cam', top: "Bird's-eye", hood: 'Driver view' };
  const wrongWay = vehicles.filter((v) => v.dir === -1).length;
  function updateHud() {
    hud.speed.textContent = `${Math.round(Math.abs(ego.v) * 3.6)}`;
    hud.mode.textContent = `${ego.auto ? `Autopilot · ${ego.status}` : running ? 'You are driving' : 'Manual'} · ${CAM_LABEL[cameraMode]}`;
    const ew = signalAt('ew', clock), ns = signalAt('ns', clock);
    const [road, s] = ew.color !== 'red' ? ['E–W', ew] : ns.color !== 'red' ? ['N–S', ns] : ['All', ew];
    hud.signal.textContent = `Signal · ${road} ${s.color} · ${Math.ceil(s.left)} s`;
    hud.you.textContent = `pedestrians hit ${you.peds} · contacts ${you.contacts} · near misses ${you.near} · red lights ${you.reds}`;
    hud.world.textContent = `Around you: ${world.reds} red lights jumped · ${world.cutins} cut-ins · ${world.jaywalk} jaywalkers · ${world.pickups} sudden stops · ${wrongWay} riders on the wrong side`;
  }

  /* ---------------- input ---------------- */
  const keys = new Set<string>();
  const touch = { gas: false, brake: false, left: false, right: false };
  const cams: (typeof cameraMode)[] = ['chase', 'top', 'hood'];

  function setAuto(on: boolean, quiet = false) {
    if (on && !ego.auto) attachAutopilot();
    ego.auto = on;
    host.querySelector('[data-act="auto"]')?.setAttribute('aria-pressed', String(on));
    if (!quiet) toast(on ? 'Autopilot on. It stops for red lights and pedestrians. Nobody else does.' : 'You have the wheel. Esc to stop driving.');
  }
  function startDriving() {
    if (running) return;
    running = true;
    hud.start.hidden = true;
    hud.exit.hidden = false;
    setAuto(false);
    renderer.domElement.focus();
  }
  function stopDriving() {
    if (!running) return;
    running = false;
    keys.clear();
    Object.keys(touch).forEach((k) => (touch[k as keyof typeof touch] = false));
    hud.start.hidden = false;
    hud.exit.hidden = true;
    setAuto(true, true);
    toast('Stopped. The autopilot has the wheel again.');
  }
  const cycleCamera = () => { cameraMode = cams[(cams.indexOf(cameraMode) + 1) % cams.length]; snapCamera = true; };

  const onKey = (e: KeyboardEvent, down: boolean) => {
    if (!running) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(k)) {
      e.preventDefault();
      if (down) { keys.add(k); if (ego.auto) setAuto(false); } else keys.delete(k);
      return;
    }
    if (!down) return;
    if (k === 'escape') { e.preventDefault(); stopDriving(); }
    else if (k === 'c') cycleCamera();
    else if (k === 'p') setAuto(!ego.auto);
    else if (k === 'r') { reset(); toast('Back on the road.'); }
  };
  const kd = (e: KeyboardEvent) => onKey(e, true);
  const ku = (e: KeyboardEvent) => onKey(e, false);
  addEventListener('keydown', kd);
  addEventListener('keyup', ku);

  const touchButtons = host.querySelectorAll<HTMLButtonElement>('[data-touch]');
  const onTouch = (e: PointerEvent) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const key = btn.dataset.touch as keyof typeof touch;
    const down = e.type === 'pointerdown';
    if (down && !running) startDriving();
    touch[key] = down;
    if (down && ego.auto) setAuto(false);
    if (down) btn.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  touchButtons.forEach((b) => ['pointerdown', 'pointerup', 'pointercancel'].forEach((t) => b.addEventListener(t, onTouch as EventListener)));
  const actButtons = host.querySelectorAll<HTMLButtonElement>('[data-act]');
  const onAct = (e: Event) => {
    const act = (e.currentTarget as HTMLElement).dataset.act;
    if (act === 'auto') setAuto(!ego.auto);
    else if (act === 'cam') cycleCamera();
    else if (act === 'reset') { reset(); toast('Back on the road.'); }
    else if (act === 'exit') { stopDriving(); return; }
    if (running) renderer.domElement.focus();
  };
  actButtons.forEach((b) => b.addEventListener('click', onAct));
  hud.start.addEventListener('click', startDriving);

  /* ---------------- simulation ---------------- */
  let clock = 0;
  const tmpA = new THREE.Vector3();

  function stepSignals() {
    for (const h of heads) {
      const c = signalAt(h.road, clock).color;
      (['red', 'amber', 'green'] as const).forEach((k) => { h.lamps[k].material = lamp[k][k === c ? 1 : 0]; });
    }
  }

  function stepVehicles(dt: number) {
    for (const o of vehicles) {
      o.ghost = Math.max(0, o.ghost - dt);
      const lead = sense(o.pos, o.fwd, o.wide / 2, o.len / 2, o, 55, o.ghost > 0);
      let gap = lead.gap, vLead = lead.v;
      // Signals (loosely observed).
      if (o.dir === 1) {
        const st = o.loop.nextStop(o.s);
        if (st.dist < 45) {
          if (o.approach !== st.at) { o.approach = st.at; o.runRed = rnd() < o.jumper; }
          const sig = signalAt(o.loop.road, clock).color;
          const mustStop = sig === 'red' || (sig === 'amber' && st.dist > o.v * 1.2 + 4);
          if (mustStop && !o.runRed) {
            const g2 = st.dist - o.len / 2 - 0.5;
            if (g2 < gap) { gap = Math.max(0.1, g2); vLead = 0; }
          }
        }
        if (o.lastStopDist < 3 && st.dist > o.lastStopDist + 10 && signalAt(o.loop.road, clock - 0.5).color === 'red') world.reds++;
        o.lastStopDist = st.dist;
      }
      // Moods change: desired speed drifts with each driver.
      // Riders take bends a little faster than they should.
      const bend = o.dir === 1 ? o.loop.speedLimit(o.s) : o.loop.speedLimit(o.s - 15);
      const v0 = Math.min(bend * (o.kind === 'bike' ? 1.25 : 1.05), o.v0 * (1 + 0.18 * Math.sin(clock * 0.31 + o.phase) + 0.08 * Math.sin(clock * 1.27 + 2 * o.phase)));
      if (o.hold > 0) { o.hold -= dt; o.v = Math.max(0, o.v - 7 * dt); }
      else {
        const acc = idm(o.v, v0, gap, vLead, o.T, o.s0);
        o.v = Math.min(20, Math.max(0, o.v + acc * dt));
        // Autos stop without warning to pick someone up.
        if (o.kind === 'auto' && o.v > 3 && rnd() < 0.05 * dt) { o.hold = 2 + rnd() * 3; world.pickups++; }
      }
      // Deadlock breaker: after sitting still for a long time, squeeze through.
      o.stuck = o.v < 0.2 && gap < 8 ? o.stuck + dt : 0;
      if (o.stuck > 7) { o.ghost = 1.5; o.stuck = 0; }
      o.s = o.loop.wrap(o.s + o.dir * o.v * dt);

      // Lateral behaviour: riders weave through gaps, autos drift, everyone swerves a little.
      o.latTimer -= dt;
      if (o.latTimer <= 0) {
        o.latTimer = 1 + rnd() * 2.5;
        if (o.dir === -1) o.latTarget = -1.75;
        else if (o.kind === 'bike') o.latTarget = (o.loop.kerb ? -0.8 : -1.1) + rnd() * 2.2;
        else if (o.kind === 'auto') o.latTarget = -0.4 + rnd() * 0.8;
        else o.latTarget = -0.15 + rnd() * 0.3;
      }
      o.latV += ((o.latTarget - o.lat) * 5 - o.latV * 4) * dt;
      o.lat += o.latV * dt;

      // Lane changes and cut-ins, on the straights only.
      o.lcTimer -= dt;
      if (o.lcTimer <= 0 && o.dir === 1 && o.hold <= 0) {
        o.lcTimer = 0.8 + rnd() * 1.2;
        tryLaneChange(o, lead);
      }

      const tan = o.loop.tan(o.s, tmpA);
      o.fwd.set(tan.x * o.dir, 0, tan.z * o.dir);
      o.loop.pos(o.s, o.lat, o.pos);
      o.obj.position.copy(o.pos);
      const yaw = Math.atan2(o.fwd.z, o.fwd.x) + Math.atan2(o.latV * o.dir, Math.max(2, o.v));
      o.obj.rotation.y = -yaw;
      o.obj.rotation.x = o.kind === 'bike' ? -o.latV * 0.12 : 0;
    }
  }

  function tryLaneChange(o: Veh, lead: Seen) {
    const along = Math.abs(o.loop.road === 'ew' ? o.pos.x : o.pos.z);
    if (along < STOP + 8 || along > ARM_END - 14) return;
    const blocked = lead.gap < 18 && lead.v < o.v0 * 0.6;
    const whim = o.kind !== 'bus' && rnd() < (o.kind === 'car' ? 0.012 : o.kind === 'auto' ? 0.025 : 0.04);
    if (!blocked && !whim) return;
    const target = o.loop.sibling;
    if (o.kind === 'bus' && !target.kerb) return;
    const ts = target.nearest(o.pos);
    const need = o.kind === 'bike' || o.kind === 'auto' ? 3 : 7; // riders and autos take gaps nobody else would
    let cutOff = false;
    for (const q of vehicles) {
      if (q === o || q.loop !== target || q.dir !== 1) continue;
      let d = q.s - ts;
      if (d > target.len / 2) d -= target.len;
      if (d < -target.len / 2) d += target.len;
      if (d > -need - q.len && d < need + 6) return;
      if (d < 0 && d > -14 && q.v > 2) cutOff = true; // someone close behind has to brake
    }
    const p = target.pos(ts), t = target.tan(ts);
    o.lat = (o.pos.x - p.x) * -t.z + (o.pos.z - p.z) * t.x;
    o.latTarget = 0;
    o.loop = target;
    o.s = ts;
    o.approach = NaN;
    o.lastStopDist = Infinity;
    if (cutOff) world.cutins++;
  }

  function stepPeds(dt: number) {
    for (const p of peds) {
      p.timer -= dt;
      if (p.state === 'down') {
        if (p.timer <= 0) { p.state = 'cross'; p.obj.children[0].rotation.set(0, 0, 0); }
      } else if (p.state === 'walk') {
        p.along += p.dir * p.speed * dt;
        const a = Math.abs(p.along);
        if (a > ALONG_MAX || a < ALONG_MIN) { p.dir = (p.dir * -1) as 1 | -1; p.along = Math.sign(p.along) * Math.min(ALONG_MAX, Math.max(ALONG_MIN, a)); }
        if (p.timer <= 0) { p.state = 'cross'; p.target = -FOOT; world.jaywalk++; }
      } else if (p.state === 'cross') {
        const step = p.speed * (p.runner ? 1.4 : 1) * dt * Math.sign(p.target - p.lateral);
        p.lateral += step;
        if (!p.runner && rnd() < 0.06 * dt) { p.state = 'freeze'; p.timer = 0.6 + rnd() * 1.4; }      // stops dead in the road
        if (rnd() < 0.02 * dt && Math.abs(p.lateral) < HALF_ROAD) p.target = p.target < 0 ? FOOT : -FOOT; // changes their mind
        if ((p.target < 0 && p.lateral <= p.target) || (p.target > 0 && p.lateral >= p.target)) {
          if (p.target < 0) { p.side = (p.side * -1) as 1 | -1; }
          p.lateral = FOOT;
          p.state = 'walk';
          p.timer = 10 + rnd() * 25;
        }
      } else if (p.state === 'freeze' && p.timer <= 0) p.state = 'cross';
      pedWorld(p, p.pos);
      p.obj.position.copy(p.pos);
      p.obj.position.y = p.state === 'walk' ? 0.16 : 0;
      if (p.state !== 'down') {
        const bob = p.state === 'freeze' ? 0 : Math.abs(Math.sin(clock * (p.runner ? 12 : 7) + p.along)) * 0.06;
        p.obj.children[0].position.y = bob;
      }
    }
    // Traffic that can't stop in time: monitored like everything else.
    for (const p of peds) {
      if (p.state === 'walk' || p.state === 'down') continue;
      for (const o of vehicles) {
        const dx = p.pos.x - o.pos.x, dz = p.pos.z - o.pos.z;
        if (dx * dx + dz * dz > 36 || o.v < 1) continue;
        const long = dx * o.fwd.x + dz * o.fwd.z, lat = -dx * o.fwd.z + dz * o.fwd.x;
        if (Math.abs(long) < o.len / 2 + 0.3 && Math.abs(lat) < o.wide / 2 + 0.3) { knockDown(p); world.incidents++; o.v = 0; o.hold = 2; break; }
      }
    }
  }
  function knockDown(p: Ped) {
    p.state = 'down';
    p.timer = 3.5;
    p.obj.children[0].rotation.set(0, 0, Math.PI / 2);
    p.obj.children[0].position.y = 0.3;
  }

  function stepEgo(dt: number) {
    let f = egoFwd();
    let throttle = 0, steerTarget = 0;
    if (ego.auto) {
      ego.s = ego.loop.nearest(ego.pos, ego.s, 12);
      const look = 4 + Math.max(0, ego.v) * 0.4;
      const target = ego.loop.pos(ego.s + look);
      const alpha = Math.atan2(target.z - ego.pos.z, target.x - ego.pos.x) - ego.heading;
      const a = Math.atan2(Math.sin(alpha), Math.cos(alpha));
      steerTarget = Math.atan2(2 * 2.7 * Math.sin(a), look);
      const lead = sense(ego.pos, f, 0.9, 2.2, ego, 60);
      let gap = lead.gap, vLead = lead.v, what = lead.what;
      const st = ego.loop.nextStop(ego.s);
      const sig = signalAt(ego.loop.road, clock).color;
      if (st.dist < 45 && (sig === 'red' || (sig === 'amber' && st.dist > ego.v * 1.2 + 4))) {
        const g2 = st.dist - 2.7;
        if (g2 < gap) { gap = Math.max(0.1, g2); vLead = 0; what = `${sig} light`; }
      }
      throttle = idm(ego.v, Math.min(12, ego.loop.speedLimit(ego.s)), gap, vLead, 1.4, 2.5);
      ego.status = gap < 25 && what ? (vLead < 0.5 && ego.v < 3 ? `Waiting for ${what}` : `Following ${what}`) : 'Clear road';
      for (let i = 0; i < 16; i++) {
        const d = 3 + i * 2.2;
        if (d > gap + 2) { planDots.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); continue; }
        const p = ego.loop.pos(ego.s + d);
        p.y = 0.05;
        const t = ego.loop.tan(ego.s + d);
        const q = new THREE.Quaternion().setFromAxisAngle(UP, -Math.atan2(t.z, t.x)).multiply(flatQ);
        planDots.setMatrixAt(i, new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1)));
      }
      planDots.instanceMatrix.needsUpdate = true;
      planDots.visible = true;
    } else {
      planDots.visible = false;
      const up = keys.has('arrowup') || keys.has('w') || touch.gas;
      const down = keys.has('arrowdown') || keys.has('s') || touch.brake;
      const left = keys.has('arrowleft') || keys.has('a') || touch.left;
      const right = keys.has('arrowright') || keys.has('d') || touch.right;
      if (up) throttle = 4;
      if (down) throttle = ego.v > 0.5 ? -9 : -3;
      if (keys.has(' ')) throttle = -Math.sign(ego.v) * 12;
      if (!up && !down && !keys.has(' ')) throttle = -Math.sign(ego.v) * Math.min(1.2, Math.abs(ego.v) / Math.max(dt, 1e-3));
      steerTarget = ((left ? -1 : 0) + (right ? 1 : 0)) * 0.5 * (1 - Math.min(0.6, Math.abs(ego.v) / 30));
    }
    ego.steer += (steerTarget - ego.steer) * Math.min(1, dt * 6);
    ego.v = Math.max(-5, Math.min(MAX_V, ego.v + throttle * dt));
    ego.heading += (ego.v / 2.7) * Math.tan(ego.steer) * dt;
    const prev = ego.pos.clone();
    ego.pos.x += Math.cos(ego.heading) * ego.v * dt;
    ego.pos.z += Math.sin(ego.heading) * ego.v * dt;
    // Buildings are solid and the town has edges; roundabout islands nudge you back onto the ring.
    const inBuilding = blocks.some((b) => ego.pos.x > b.x0 - 1.1 && ego.pos.x < b.x1 + 1.1 && ego.pos.z > b.z0 - 1.1 && ego.pos.z < b.z1 + 1.1);
    if (inBuilding || Math.abs(ego.pos.x) > A + 45 || Math.abs(ego.pos.z) > A + 45) {
      ego.pos.copy(prev);
      if (Math.abs(ego.v) > 4) toast('That was a building.');
      ego.v = 0;
    }
    for (const c of centres) {
      const dx = ego.pos.x - c.x, dz = ego.pos.z - c.z, d = Math.hypot(dx, dz), rMin = ISLAND + 1;
      if (d >= rMin) continue;
      const push = rMin / Math.max(0.01, d);
      ego.pos.set(c.x + dx * push, 0, c.z + dz * push);
      if (Math.abs(ego.v) > 5 && !ego.auto) toast('That was the roundabout.');
      ego.v *= 0.6;
    }
    ego.obj.position.copy(ego.pos);
    ego.obj.rotation.y = -ego.heading;
    f = egoFwd();

    // Red lights: crossing a stop line into the junction while your road is red.
    const road: Road = Math.abs(f.x) > Math.abs(f.z) ? 'ew' : 'ns';
    const along = road === 'ew' ? ego.pos.x : ego.pos.z, cross = road === 'ew' ? ego.pos.z : ego.pos.x;
    const toward = (road === 'ew' ? f.x : f.z) * -Math.sign(along) > 0.5;
    if (Math.abs(cross) < HALF_ROAD && toward && Math.abs(ego.lastAlong) > STOP && Math.abs(along) <= STOP && signalAt(road, clock - 1).color === 'red' && ego.v > 1) {
      you.reds++;
      toast(ego.auto ? 'Red light. Even the autopilot got that one wrong.' : 'Red light. The autopilot would have waited.');
    }
    ego.lastAlong = along;

    // Contacts, pedestrian hits and near misses.
    const c = Math.cos(-ego.heading), sn = Math.sin(-ego.heading);
    for (const o of vehicles) {
      const dx = o.pos.x - ego.pos.x, dz = o.pos.z - ego.pos.z;
      if (dx * dx + dz * dz > 100) continue;
      const lx = dx * c - dz * sn, lz = dx * sn + dz * c;
      const al = Math.abs(o.fwd.x * f.x + o.fwd.z * f.z);
      const rL = o.len / 2 * al + o.wide / 2 * (1 - al), rW = o.wide / 2 * al + o.len / 2 * (1 - al);
      if (Math.abs(lx) < 2.15 + rL && Math.abs(lz) < 0.9 + rW) {
        const ours = lx > 0 ? ego.v > 0.3 : ego.v < -0.3;
        if (!ours) { o.v = 0; o.hold = Math.max(o.hold, 0.5); continue; }
        if ((hitAt.get(o) ?? -9) < clock - 2) {
          hitAt.set(o, clock);
          you.contacts++;
          toast(ego.auto ? 'Contact. Even the autopilot misjudged that one.' : 'Contact. Maybe let the autopilot drive?');
          o.hold = 1.5;
        }
        ego.v *= -0.25;
      }
    }
    for (const p of peds) {
      const dx = p.pos.x - ego.pos.x, dz = p.pos.z - ego.pos.z;
      if (dx * dx + dz * dz > 64) continue;
      const lx = dx * c - dz * sn, lz = dx * sn + dz * c;
      if (Math.abs(lx) < 2.5 && Math.abs(lz) < 1.2 && Math.abs(ego.v) > 0.5 && p.state !== 'down') {
        knockDown(p);
        you.peds++;
        toast(ego.auto ? 'Pedestrian hit. They stepped out too close even for the autopilot.' : 'Pedestrian hit. They crossed without looking, and you still have to stop.', 3400);
        ego.v *= 0.2;
      } else if (lx > 0 && lx < 7 && Math.abs(lz) < 2.4 && ego.v > 5 && p.state !== 'walk' && (hitAt.get(p) ?? -9) < clock - 3) {
        hitAt.set(p, clock);
        you.near++;
      }
    }
  }
  const hitAt = new WeakMap<object, number>();

  /* ---------------- camera ---------------- */
  const camTarget = new THREE.Vector3(), camPos = new THREE.Vector3(), lookAt = new THREE.Vector3();
  function updateCamera(dt: number) {
    const f = egoFwd();
    if (cameraMode === 'chase') { camPos.copy(ego.pos).addScaledVector(f, -9).setY(4.2); camTarget.copy(ego.pos).addScaledVector(f, 8).setY(1.2); }
    else if (cameraMode === 'top') { camPos.copy(ego.pos).addScaledVector(f, -4).setY(52); camTarget.copy(ego.pos).addScaledVector(f, 6); }
    else { camPos.copy(ego.pos).addScaledVector(f, 0.2).setY(1.35); camTarget.copy(ego.pos).addScaledVector(f, 20).setY(1.1); }
    const k = snapCamera ? 1 : 1 - Math.exp(-dt * (cameraMode === 'hood' ? 20 : 5));
    camera.position.lerp(camPos, k);
    lookAt.lerp(camTarget, snapCamera ? 1 : 1 - Math.exp(-dt * 8));
    camera.lookAt(lookAt);
    snapCamera = false;
    sun.position.set(ego.pos.x - 40, 90, ego.pos.z + 30);
    sun.target.position.copy(ego.pos);
  }

  /* ---------------- loop ---------------- */
  let visible = true, raf = 0, last = performance.now(), hudTimer = 0;
  function resize() {
    const r = stage.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  function step(dt: number) {
    clock += dt;
    stepSignals();
    stepPeds(dt);
    stepVehicles(dt);
    stepEgo(dt);
  }
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    step(dt);
    hudTimer += dt;
    if (hudTimer > 0.1) { hudTimer = 0; updateHud(); }
    updateCamera(dt);
    renderer.render(scene, camera);
  }
  // Warm up so the first frame already shows traffic in motion.
  for (let i = 0; i < 150; i++) { clock += 1 / 30; stepSignals(); stepPeds(1 / 30); stepVehicles(1 / 30); }
  Object.assign(world, { reds: 0, cutins: 0, jaywalk: 0, pickups: 0, incidents: 0 });
  updateCamera(1);
  updateHud();
  renderer.render(scene, camera);
  if (!reduced) raf = requestAnimationFrame(frame);
  else hud.start.addEventListener('click', () => { last = performance.now(); raf = requestAnimationFrame(frame); }, { once: true });

  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });
  io.observe(stage);
  const onVis = () => { if (!document.hidden) last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  const onTheme = () => applyPalette();
  addEventListener('themechange', onTheme);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(toastTimer);
    ro.disconnect();
    io.disconnect();
    removeEventListener('keydown', kd);
    removeEventListener('keyup', ku);
    removeEventListener('themechange', onTheme);
    document.removeEventListener('visibilitychange', onVis);
    touchButtons.forEach((b) => ['pointerdown', 'pointerup', 'pointercancel'].forEach((t) => b.removeEventListener(t, onTouch as EventListener)));
    actButtons.forEach((b) => b.removeEventListener('click', onAct));
    geos.forEach((geo) => geo.dispose());
    Object.values(mat).forEach((m) => m.dispose());
    Object.values(lamp).flat().forEach((m) => m.dispose());
    decalMat.dispose();
    decalTex.dispose();
    stripMesh.dispose();
    planDots.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

/* ================================================================== lifecycle */
let teardown: (() => void) | null = null;
function run() {
  const host = document.querySelector<HTMLElement>('[data-drive]');
  if (!host || host.dataset.mounted) return;
  host.dataset.mounted = '1';
  teardown?.();
  try {
    teardown = mount(host);
  } catch (err) {
    host.querySelector<HTMLElement>('[data-fallback]')?.removeAttribute('hidden');
    console.error(err);
  }
}
run();
document.addEventListener('astro:page-load', run);
document.addEventListener('astro:before-swap', () => { teardown?.(); teardown = null; });
