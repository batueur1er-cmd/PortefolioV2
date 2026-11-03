/*
 * Rendu « singularité » : le portage de l'Effet 1. Chaque fenêtre dessine toute la scène en
 * coordonnées écran puis la décale de sa propre position ; les particules sont des fonctions
 * déterministes de l'horloge partagée, donc les faisceaux se raccordent d'une fenêtre à l'autre.
 */

const TAU = Math.PI * 2;
const TILT = 0.27; // aplatissement du disque d'accrétion
const NP = 520; // particules de lumière par sens
const NB = 16; // lots de couleur le long du faisceau
const UB = 0.86; // part du trajet en arc, le reste spirale dans le disque
const CELL = 110; // grille d'étoiles (coordonnées écran)

export const HOLE_PALETTE = [28, 198, 292, 150, 350];

const STAR_COLORS = ['hsl(220,40%,92%)', 'hsl(38,70%,86%)', 'hsl(195,90%,82%)'];
const NEBULAE: readonly (readonly [number, number, number, number])[] = [
  [0.28, 0.35, 262, 0.07],
  [0.78, 0.62, 205, 0.06],
  [0.52, 0.9, 330, 0.04],
];

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const frac = (x: number): number => x - Math.floor(x);
const lerpHue = (a: number, b: number, t: number): number => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

export function hash(n: number): number {
  n = (n | 0) ^ 0x5bd1e995;
  n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d);
  n = Math.imul(n ^ (n >>> 12), 0x297a2d39);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}

export function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** État affiché d'un trou noir (lissé et en fondu, d'où les champs modifiables). */
export interface HoleView {
  readonly id: string;
  x: number;
  y: number;
  r: number;
  hue: number;
  rot: number;
  spin: number;
  vis: number;
  flash: number;
}

export interface RenderView {
  readonly ox: number;
  readonly oy: number;
  readonly w: number;
  readonly h: number;
  readonly dpr: number;
}

interface DiskParticle {
  readonly rf: number;
  readonly a0: number;
  readonly w: number;
  readonly s: number;
  readonly br: number;
}

interface StreamParticle {
  readonly sp: number;
  readonly ph: number;
  readonly j: number;
  readonly strand: boolean;
  readonly sph: number;
  readonly head: boolean;
  readonly w: number;
}

export class BlackHoleRenderer {
  private readonly sprites = new Map<string, HTMLCanvasElement>();
  private readonly disks = new Map<string, DiskParticle[]>();
  private readonly streams = new Map<number, StreamParticle[]>();
  private readonly buckets: number[][] = Array.from({ length: NB * 2 }, () => []);
  private readonly p0: [number, number] = [0, 0];
  private readonly p1: [number, number] = [0, 0];
  private view: RenderView = { ox: 0, oy: 0, w: 0, h: 0, dpr: 1 };

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly doc: Document,
  ) {}

  forget(id: string): void {
    this.disks.delete(id);
  }

  render(view: RenderView, holes: readonly HoleView[], T: number): void {
    this.view = view;
    const { ctx } = this;
    const { ox, oy, w, h, dpr } = view;
    for (const hole of holes) hole.flash = 0;

    ctx.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#03020a';
    ctx.fillRect(ox, oy, w, h);

    ctx.globalCompositeOperation = 'lighter';
    this.nebula();
    this.stars(holes, T);

    const shown = holes.filter((hole) => {
      const m = hole.r * 9;
      return hole.x + m > ox && hole.x - m < ox + w && hole.y + m > oy && hole.y - m < oy + h;
    });
    for (const hole of shown) {
      this.holeGlow(hole);
      this.jets(hole, T);
      this.diskGlow(hole, -1);
      this.diskParticles(hole, 0, T);
    }
    for (let i = 0; i < holes.length; i++) {
      for (let j = i + 1; j < holes.length; j++) this.pair(holes[i], holes[j], T);
    }

    ctx.globalCompositeOperation = 'source-over';
    for (const hole of shown) this.horizon(hole);

    ctx.globalCompositeOperation = 'lighter';
    for (const hole of shown) {
      this.diskParticles(hole, 2, T);
      this.photonRing(hole, T);
      this.diskGlow(hole, 1);
      this.diskParticles(hole, 1, T);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // ---------- Sprites lumineux ----------

  private sprite(hue: number, sat: number, light: number): HTMLCanvasElement {
    const h = Math.round(hue);
    const l = Math.round(light);
    const key = `${h}|${sat}|${l}`;
    const cached = this.sprites.get(key);
    if (cached) return cached;
    const canvas = this.doc.createElement('canvas');
    canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d');
    if (g) {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `hsla(${h},${sat}%,${Math.min(100, l + 35)}%,1)`);
      gr.addColorStop(0.22, `hsla(${h},${sat}%,${l}%,0.6)`);
      gr.addColorStop(0.55, `hsla(${h},${sat}%,${l}%,0.12)`);
      gr.addColorStop(1, `hsla(${h},${sat}%,${l}%,0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
    }
    this.sprites.set(key, canvas);
    return canvas;
  }

  private blit(img: CanvasImageSource, x: number, y: number, s: number, a: number): void {
    if (a <= 0.003) return;
    this.ctx.globalAlpha = a > 1 ? 1 : a;
    this.ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
  }

  // ---------- Fond : nébuleuses et étoiles lentillées ----------

  private nebula(): void {
    const { ctx } = this;
    const screen = this.doc.defaultView?.screen as (Screen & { availLeft?: number; availTop?: number }) | undefined;
    const sw = screen?.width ?? this.view.w;
    const sh = screen?.height ?? this.view.h;
    const sl = screen?.availLeft ?? 0;
    const st = screen?.availTop ?? 0;
    for (const [fx, fy, hue, a] of NEBULAE) {
      const x = sl + sw * fx;
      const y = st + sh * fy;
      const r = sw * 0.55;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `hsla(${hue},70%,35%,${a})`);
      g.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  private stars(holes: readonly HoleView[], T: number): void {
    const { ctx } = this;
    const { ox, oy, w, h } = this.view;
    const cx0 = Math.floor((ox - CELL) / CELL);
    const cx1 = Math.floor((ox + w + CELL) / CELL);
    const cy0 = Math.floor((oy - CELL) / CELL);
    const cy1 = Math.floor((oy + h + CELL) / CELL);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const base = (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) >>> 0;
        const n = 2 + (hash(base) > 0.55 ? 1 : 0) + (hash(base + 9) > 0.92 ? 2 : 0);
        for (let i = 0; i < n; i++) {
          const b = base + i * 5;
          const sx = (cx + hash(b + 1)) * CELL;
          const sy = (cy + hash(b + 2)) * CELL;
          const mag = Math.pow(hash(b + 3), 4);
          const tint = hash(b + 4);
          const col = STAR_COLORS[tint < 0.6 ? 0 : tint < 0.85 ? 1 : 2];
          const tw = 0.75 + 0.25 * Math.sin(T * (1 + tint * 3) + b);
          let px = sx;
          let py = sy;
          let mu = 1;
          for (const hole of holes) {
            const dx = px - hole.x;
            const dy = py - hole.y;
            const r = Math.hypot(dx, dy) + 0.01;
            const E = hole.r * 2.4 * hole.vis + 0.01; // rayon d'Einstein
            const s = Math.sqrt(r * r + 4 * E * E);
            const u = r / E;
            mu *= Math.min(5, (u * u + 2) / (2 * u * Math.sqrt(u * u + 4)) + 0.5);
            const rm = (s - r) / 2; // image secondaire, de l'autre côté
            if (rm > hole.r * 1.05) {
              ctx.globalAlpha = clamp((0.15 + 0.85 * mag) * 0.45 * tw, 0, 1);
              ctx.fillStyle = col;
              ctx.fillRect(hole.x - (dx / r) * rm - 0.6, hole.y - (dy / r) * rm - 0.6, 1.2, 1.2);
            }
            const rp = (r + s) / 2; // image principale, repoussée vers l'extérieur
            px = hole.x + (dx / r) * rp;
            py = hole.y + (dy / r) * rp;
          }
          if (px < ox - 4 || px > ox + w + 4 || py < oy - 4 || py > oy + h + 4) continue;
          const bright = (0.15 + 0.85 * mag) * Math.min(mu, 4) * tw;
          const size = 0.7 + mag * 1.6 + Math.min(mu - 1, 3) * 0.35;
          ctx.globalAlpha = clamp(bright, 0, 1);
          ctx.fillStyle = col;
          ctx.fillRect(px - size / 2, py - size / 2, size, size);
          if (mag > 0.45 || mu > 2.2) {
            this.blit(this.sprite(tint < 0.85 ? 220 : 195, 60, 70), px, py, 10 + mag * 14, bright * 0.35);
          }
        }
      }
    }
  }

  // ---------- Trou noir ----------

  private diskFor(hole: HoleView): DiskParticle[] {
    const cached = this.disks.get(hole.id);
    if (cached) return cached;
    const seed = strHash(hole.id);
    const disk: DiskParticle[] = [];
    for (let i = 0; i < 900; i++) {
      const b = seed + i * 7;
      const rf = 1.45 + 3.0 * Math.pow(hash(b + 1), 1.7);
      disk.push({ rf, a0: hash(b + 2) * TAU, w: 2.4 * Math.pow(rf, -1.5), s: hash(b + 3), br: 0.35 + 0.65 * hash(b + 4) });
    }
    this.disks.set(hole.id, disk);
    return disk;
  }

  private holeGlow(hole: HoleView): void {
    const { ctx } = this;
    const r = hole.r * 9;
    const g = ctx.createRadialGradient(hole.x, hole.y, hole.r, hole.x, hole.y, r);
    g.addColorStop(0, `hsla(${hole.hue},90%,60%,${0.22 * hole.vis})`);
    g.addColorStop(0.3, `hsla(${hole.hue},90%,45%,${0.07 * hole.vis})`);
    g.addColorStop(1, 'hsla(0,0%,0%,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(hole.x - r, hole.y - r, r * 2, r * 2);
  }

  private jets(hole: HoleView, T: number): void {
    const { ctx } = this;
    const jx = Math.sin(hole.rot);
    const jy = -Math.cos(hole.rot);
    const px = -jy;
    const py = jx;
    ctx.globalAlpha = 1;
    for (const s of [1, -1]) {
      const len = hole.r * (7 + 0.9 * Math.sin(T * 1.3 + s));
      const ex = hole.x + jx * s * len;
      const ey = hole.y + jy * s * len;
      const g = ctx.createLinearGradient(hole.x, hole.y, ex, ey);
      g.addColorStop(0, `hsla(${hole.hue},100%,82%,${0.3 * hole.vis * (0.8 + 0.2 * Math.sin(T * 9 + s))})`);
      g.addColorStop(1, `hsla(${hole.hue},100%,60%,0)`);
      ctx.fillStyle = g;
      const w0 = hole.r * 0.16;
      const w1 = hole.r * 0.75;
      ctx.beginPath();
      ctx.moveTo(hole.x + px * w0, hole.y + py * w0);
      ctx.lineTo(ex + px * w1, ey + py * w1);
      ctx.lineTo(ex - px * w1, ey - py * w1);
      ctx.lineTo(hole.x - px * w0, hole.y - py * w0);
      ctx.fill();
    }
  }

  /** `half` : -1 pour la moitié arrière du disque, +1 pour la moitié avant. */
  private diskGlow(hole: HoleView, half: -1 | 1): void {
    const { ctx } = this;
    const R = hole.r;
    const big = R * 6;
    ctx.save();
    ctx.translate(hole.x, hole.y);
    ctx.rotate(hole.rot);
    ctx.scale(1, TILT);
    ctx.beginPath();
    ctx.rect(-big, half < 0 ? -big : 0, big * 2, big);
    ctx.clip();
    const g = ctx.createRadialGradient(0, 0, R * 1.3, 0, 0, R * 4.7);
    g.addColorStop(0, `hsla(${hole.hue},100%,80%,0)`);
    g.addColorStop(0.06, `hsla(${hole.hue},100%,78%,${0.55 * hole.vis})`);
    g.addColorStop(0.3, `hsla(${hole.hue},95%,55%,${0.2 * hole.vis})`);
    g.addColorStop(1, `hsla(${hole.hue},90%,40%,0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R * 4.7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /** `part` : 0 arrière, 1 avant, 2 halo lentillé autour de l'horizon. */
  private diskParticles(hole: HoleView, part: 0 | 1 | 2, T: number): void {
    const R = hole.r;
    const cr = Math.cos(hole.rot);
    const sr = Math.sin(hole.rot);
    const haloBoost = 1 + hole.flash * 0.8;
    for (const p of this.diskFor(hole)) {
      const a = p.a0 + p.w * T * hole.spin;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const back = sa < 0;
      let lx: number;
      let ly: number;
      let am = 1;
      let sm = 1;
      if (part === 0) {
        if (!back) continue;
        lx = ca * p.rf * R;
        ly = sa * p.rf * R * TILT;
      } else if (part === 1) {
        if (back) continue;
        lx = ca * p.rf * R;
        ly = sa * p.rf * R * TILT;
      } else if (back) {
        const rr = R * (1.1 + (p.rf - 1.45) * 0.22);
        lx = ca * rr;
        ly = sa * rr;
        am = 0.55 * haloBoost;
        sm = 0.6;
      } else {
        const rr = R * (1.03 + (p.rf - 1.45) * 0.07);
        lx = ca * rr;
        ly = sa * rr;
        am = 0.25 * haloBoost;
        sm = 0.4;
      }
      const x = hole.x + lx * cr - ly * sr;
      const y = hole.y + lx * sr + ly * cr;
      const D = 1 + 0.7 * ca * hole.spin; // effet Doppler : un côté plus brillant
      const heat = 1 - (p.rf - 1.45) / 3; // 1 au bord interne, 0 à l'extérieur
      const L = clamp(Math.round((38 + heat * 32 + (D - 1) * 20) / 6) * 6, 18, 90);
      const alpha = p.br * Math.pow(D, 2.2) * (0.3 + heat * 0.7) * am * hole.vis;
      const s = R * (0.16 + 0.24 * p.s * p.s) * sm * (0.8 + 0.3 * D);
      this.blit(this.sprite(hole.hue, 95, L), x, y, s, alpha);
    }
    this.ctx.globalAlpha = 1;
  }

  private horizon(hole: HoleView): void {
    const { ctx } = this;
    const r = hole.r * 1.35;
    const g = ctx.createRadialGradient(hole.x, hole.y, 0, hole.x, hole.y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.72, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = hole.vis;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private photonRing(hole: HoleView, T: number): void {
    const { ctx } = this;
    const f = 1 + hole.flash * 1.6;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.r * 1.01, 0, TAU);
    ctx.lineWidth = hole.r * 0.28;
    ctx.strokeStyle = `hsla(${hole.hue},100%,60%,${clamp(0.1 * f * hole.vis, 0, 1)})`;
    ctx.stroke();
    ctx.lineWidth = Math.max(1.2, hole.r * 0.045);
    ctx.strokeStyle = `hsla(${hole.hue},100%,88%,${clamp((0.7 + 0.15 * Math.sin(T * 2.3)) * f * hole.vis, 0, 1)})`;
    ctx.stroke();
  }

  // ---------- Faisceaux de lumière entre deux trous ----------

  private particlesFor(seed: number): StreamParticle[] {
    const cached = this.streams.get(seed);
    if (cached) return cached;
    const particles: StreamParticle[] = [];
    for (let i = 0; i < NP; i++) {
      const b = seed + i * 11;
      particles.push({
        sp: 0.16 + 0.12 * hash(b + 1),
        ph: hash(b + 2),
        j: hash(b + 3) - 0.5,
        strand: hash(b + 4) < 0.66,
        sph: hash(b + 5) < 0.5 ? 0 : Math.PI,
        head: hash(b + 6) > 0.86,
        w: hash(b + 7),
      });
    }
    this.streams.set(seed, particles);
    return particles;
  }

  private pair(a: HoleView, b: HoleView, T: number): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    if (L < (a.r + b.r) * 2.2) return;
    const nx = -dy / L;
    const ny = dx / L;
    const k = clamp(1100 / L, 0.45, 1.6) * Math.min(a.vis, b.vis);
    const seed = strHash(a.id + b.id);
    this.flow(a, b, nx, ny, L, 1, seed, T, k);
    this.flow(b, a, nx, ny, L, -1, (seed ^ 0x9e3779b9) >>> 0, T, k);
  }

  private flow(
    src: HoleView,
    dst: HoleView,
    nx: number,
    ny: number,
    L: number,
    side: 1 | -1,
    seed: number,
    T: number,
    k: number,
  ): void {
    const { ctx } = this;
    const { ox, oy, w, h } = this.view;
    const ux = (dst.x - src.x) / L;
    const uy = (dst.y - src.y) / L;
    const Sx = src.x + ux * src.r * 2.3 + nx * side * src.r * 0.8;
    const Sy = src.y + uy * src.r * 2.3 + ny * side * src.r * 0.8;
    const Ex = dst.x - ux * dst.r * 2.1 + nx * side * dst.r * 1.5;
    const Ey = dst.y - uy * dst.r * 2.1 + ny * side * dst.r * 1.5;
    const bend = Math.min(L * 0.2, 360) * side;
    const Cx = (Sx + Ex) / 2 + nx * bend;
    const Cy = (Sy + Ey) / 2 + ny * bend;

    // L'éclat d'arrivée compte même si le faisceau sort du champ de cette fenêtre.
    for (let i = 0; i < 3; i++) {
      const t = frac(T * 0.21 + i / 3 + (seed % 997) / 997);
      dst.flash += (smooth(0.85, 1, t) + Math.exp(-t * 22)) * 0.35 * k;
    }

    const m = 80 + dst.r * 3;
    const minX = Math.min(Sx, Cx, Ex, dst.x) - m;
    const maxX = Math.max(Sx, Cx, Ex, dst.x) + m;
    const minY = Math.min(Sy, Cy, Ey, dst.y) - m;
    const maxY = Math.max(Sy, Cy, Ey, dst.y) + m;
    if (maxX < ox || minX > ox + w || maxY < oy || minY > oy + h) return;

    const midHue = lerpHue(src.hue, dst.hue, 0.5);

    // Cœur du faisceau.
    const g = ctx.createLinearGradient(Sx, Sy, Ex, Ey);
    g.addColorStop(0, `hsla(${src.hue},100%,70%,0)`);
    g.addColorStop(0.12, `hsla(${src.hue},100%,70%,1)`);
    g.addColorStop(0.5, `hsla(${midHue | 0},100%,82%,1)`);
    g.addColorStop(0.88, `hsla(${dst.hue},100%,70%,1)`);
    g.addColorStop(1, `hsla(${dst.hue},100%,70%,0)`);
    ctx.strokeStyle = g;
    ctx.lineCap = 'round';
    const pulse = 0.75 + 0.25 * Math.sin(T * 4 + side * 1.7);
    for (const [lw, a] of [
      [38, 0.028],
      [16, 0.05],
      [6, 0.11],
      [1.8, 0.42],
    ] as const) {
      ctx.lineWidth = lw;
      ctx.globalAlpha = clamp(a * k * pulse, 0, 1);
      ctx.beginPath();
      ctx.moveTo(Sx, Sy);
      ctx.quadraticCurveTo(Cx, Cy, Ex, Ey);
      ctx.stroke();
    }

    // Paquets de lumière qui voyagent d'un trou à l'autre.
    for (let i = 0; i < 3; i++) {
      const t = frac(T * 0.21 + i / 3 + (seed % 997) / 997);
      const v = 1 - t;
      const x = v * v * Sx + 2 * v * t * Cx + t * t * Ex;
      const y = v * v * Sy + 2 * v * t * Cy + t * t * Ey;
      const f = Math.sin(Math.PI * t);
      const hq = Math.round(lerpHue(src.hue, dst.hue, t) / 8) * 8;
      const s = src.r * (1.1 + 0.8 * f);
      this.blit(this.sprite(hq, 100, 62), x, y, s * 2.2, 0.35 * k * f);
      this.blit(this.sprite(hq, 70, 85), x, y, s * 0.5, 0.95 * k * f);
    }

    // Éclat à l'injection.
    this.blit(this.sprite(src.hue, 100, 65), Sx, Sy, src.r * (2.2 + 0.4 * Math.sin(T * 6 + seed)), 0.4 * k);

    // Particules : deux brins en hélice et de la poussière lumineuse.
    const a0 = Math.atan2(Ey - dst.y, Ex - dst.x);
    const rad0 = Math.hypot(Ex - dst.x, Ey - dst.y);
    const spinDir = (Ex - dst.x) * (Ey - Cy) - (Ey - dst.y) * (Ex - Cx) > 0 ? 1 : -1;
    const amp = clamp(L * 0.022, 8, 30) * (0.7 + 0.3 * Math.min(k, 1.4));
    const turns = clamp(L / 240, 1.5, 9);
    const pos = (u: number, p: StreamParticle, out: [number, number]): void => {
      if (u < UB) {
        const t = u / UB;
        const v = 1 - t;
        const x = v * v * Sx + 2 * v * t * Cx + t * t * Ex;
        const y = v * v * Sy + 2 * v * t * Cy + t * t * Ey;
        const tx = 2 * v * (Cx - Sx) + 2 * t * (Ex - Cx);
        const ty = 2 * v * (Cy - Sy) + 2 * t * (Ey - Cy);
        const tl = Math.hypot(tx, ty) || 1;
        const env = Math.pow(Math.sin(Math.PI * t), 0.75);
        const off =
          env *
          (p.strand
            ? amp * Math.sin(t * turns * TAU - T * 3 + p.sph) + p.j * amp * 0.35
            : p.j * amp * 2.6 * (0.7 + 0.3 * Math.sin(T * 0.8 + p.w * TAU)));
        out[0] = x - (ty / tl) * off;
        out[1] = y + (tx / tl) * off;
      } else {
        const t = (u - UB) / (1 - UB);
        const e = t * (2 - t);
        const ang = a0 + spinDir * e * 2.0;
        const rad = rad0 + (dst.r * 1.08 - rad0) * e;
        out[0] = dst.x + Math.cos(ang) * rad;
        out[1] = dst.y + Math.sin(ang) * rad;
      }
    };

    const { p0, p1, buckets } = this;
    for (const p of this.particlesFor(seed)) {
      const u = frac(T * p.sp + p.ph);
      const u2 = u - 0.016;
      if (u2 < 0) continue;
      pos(u, p, p0);
      pos(u2, p, p1);
      const bi = Math.min(NB - 1, (u * NB) | 0) + (p.strand ? 0 : NB);
      buckets[bi].push(p1[0], p1[1], p0[0], p0[1]);
      if (p.head) {
        const fade = smooth(0, 0.07, u) * (1 - smooth(0.9, 1, u));
        const hq = Math.round(lerpHue(src.hue, dst.hue, u) / 8) * 8;
        this.blit(this.sprite(hq, 100, 72), p0[0], p0[1], 9, 0.8 * k * fade);
      }
    }
    for (let b = 0; b < NB * 2; b++) {
      const segments = buckets[b];
      if (!segments.length) continue;
      const uMid = ((b % NB) + 0.5) / NB;
      const strand = b < NB;
      const fade = smooth(0, 0.07, uMid) * (1 - smooth(0.9, 1, uMid));
      const hue = lerpHue(src.hue, dst.hue, uMid) | 0;
      ctx.strokeStyle = `hsl(${hue},100%,${(62 + 20 * Math.sin(Math.PI * uMid)) | 0}%)`;
      ctx.globalAlpha = clamp((strand ? 0.8 : 0.4) * k * (0.25 + 0.75 * fade), 0, 1);
      ctx.lineWidth = strand ? 1.6 : 1;
      ctx.beginPath();
      for (let i = 0; i < segments.length; i += 4) {
        ctx.moveTo(segments[i], segments[i + 1]);
        ctx.lineTo(segments[i + 2], segments[i + 3]);
      }
      ctx.stroke();
      segments.length = 0;
    }
    ctx.globalAlpha = 1;
  }
}
