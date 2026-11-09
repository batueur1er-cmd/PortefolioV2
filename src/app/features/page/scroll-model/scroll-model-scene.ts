import {
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

import type { StarMap } from './constellation';
import type { ModelForm, ModelPose } from './scroll-model.pose';

/*
 * Deux formes en traits fins, à l'essai : la constellation des compétences, et une anamorphose du
 * monogramme. Ce fichier n'est chargé qu'à la demande : Three.js reste hors du bundle initial.
 */

export interface ScrollModelColors {
  readonly dim: string;
  readonly lit: string;
  readonly xrayLine: string;
  readonly xrayNote: string;
  readonly xrayPink: string;
}

const CAMERA_Z = 9;
const STAR_RADIUS = 2;
const DASH = 0.075;
const GAP = 0.02;

/** Le monogramme, en lignes brisées, dans le plan de l'écran. */
const LETTERS: readonly (readonly (readonly [number, number])[])[] = [
  [[-1.6, 1], [-1.6, -1]],
  [[-1.6, 1], [-0.65, 1], [-0.32, 0.76], [-0.32, 0.3], [-0.65, 0.05], [-1.6, 0.05]],
  [[-0.65, 0.05], [-0.2, -0.2], [-0.2, -0.75], [-0.65, -1], [-1.6, -1]],
  [[0.3, -1], [0.3, 1], [1.6, -1], [1.6, 1]],
];

/** Un nombre entre 0 et 1, toujours le même pour un même rang : les deux fenêtres dessinent la même chose. */
const noise = (i: number): number => (Math.imul(i + 11, 2654435761) >>> 0) / 4294967296;

/** Les étoiles, réparties régulièrement sur une sphère. */
function spherePoints(count: number): Vector3[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - ((i + 0.5) / count) * 2;
    const r = Math.sqrt(1 - y * y);
    return new Vector3(Math.cos(i * golden) * r, y, Math.sin(i * golden) * r).multiplyScalar(STAR_RADIUS);
  });
}

export class ScrollModelScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 50);
  private readonly root = new Group();
  private readonly stars = new Group();
  private readonly monogram = new Group();

  private readonly stations: Vector3[];
  private readonly baseLinksMat = new LineBasicMaterial({ transparent: true });
  private readonly basePointsMat = new PointsMaterial({ size: 2.5, sizeAttenuation: false, transparent: true });
  private readonly litLinksMat = new LineBasicMaterial({ transparent: true });
  private readonly litPointsMat = new PointsMaterial({ size: 5, sizeAttenuation: false, transparent: true });
  private readonly litLinks = new LineSegments(new BufferGeometry(), this.litLinksMat);
  private readonly litPoints = new Points(new BufferGeometry(), this.litPointsMat);
  private litKey = '';

  private readonly dashesMat = new LineBasicMaterial({ transparent: true });
  private readonly raysMat = new LineBasicMaterial({ transparent: true, opacity: 0.55 });
  private readonly rays: LineSegments;

  private colors: ScrollModelColors | null = null;
  private xray = false;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly map: StarMap,
  ) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.set(0, 0, CAMERA_Z);
    this.scene.add(this.root);
    this.root.add(this.stars, this.monogram);

    this.stations = spherePoints(map.ids.length);
    this.stars.add(
      new LineSegments(new BufferGeometry().setFromPoints(map.links.flatMap(([a, b]) => [this.stations[a], this.stations[b]])), this.baseLinksMat),
      new Points(new BufferGeometry().setFromPoints(this.stations), this.basePointsMat),
      this.litLinks,
      this.litPoints,
    );

    const { dashes, rays } = this.buildMonogram();
    this.monogram.add(new LineSegments(new BufferGeometry().setFromPoints(dashes), this.dashesMat));
    this.rays = new LineSegments(new BufferGeometry().setFromPoints(rays), this.raysMat);
    this.monogram.add(this.rays);
  }

  /**
   * L'anamorphose : chaque tiret du dessin est repoussé le long du rayon qui le relie à l'œil. Vu
   * de cet œil, rien ne change ; vu de n'importe où ailleurs, il ne reste qu'un nuage de traits.
   */
  private buildMonogram(): { dashes: Vector3[]; rays: Vector3[] } {
    const eye = new Vector3(0, 0, CAMERA_Z);
    const dashes: Vector3[] = [];
    const rays: Vector3[] = [];
    let rank = 0;
    const place = (x: number, y: number, depth: number) => eye.clone().add(new Vector3(x, y, 0).sub(eye).multiplyScalar(depth));
    for (const line of LETTERS) {
      for (let i = 0; i + 1 < line.length; i++) {
        const [ax, ay] = line[i];
        const [bx, by] = line[i + 1];
        const length = Math.hypot(bx - ax, by - ay);
        for (let d = 0; d + DASH <= length; d += DASH + GAP) {
          const from = d / length;
          const to = (d + DASH) / length;
          const depth = 0.75 + noise(rank++) * 0.5;
          const start = place(ax + (bx - ax) * from, ay + (by - ay) * from, depth);
          const end = place(ax + (bx - ax) * to, ay + (by - ay) * to, depth);
          dashes.push(start, end);
          if (rank % 5 === 0) {
            // Aux rayons X : l'amorce de la ligne de visée qui part vers l'œil.
            rays.push(start, start.clone().add(eye.clone().sub(start).setLength(1.4)));
          }
        }
      }
    }
    return { dashes, rays };
  }

  setColors(colors: ScrollModelColors): void {
    this.colors = colors;
    this.paint();
  }

  setXray(xray: boolean): void {
    this.xray = xray;
    this.paint();
  }

  private paint(): void {
    const c = this.colors;
    if (!c) return;
    const x = this.xray;
    this.baseLinksMat.color.set(x ? c.xrayLine : c.dim);
    this.baseLinksMat.opacity = x ? 0.5 : 0.16;
    this.basePointsMat.color.set(x ? c.xrayLine : c.dim);
    this.basePointsMat.opacity = x ? 0.9 : 0.4;
    this.litLinksMat.color.set(x ? c.xrayNote : c.lit);
    this.litLinksMat.opacity = x ? 1 : 0.55;
    this.litPointsMat.color.set(x ? c.xrayPink : c.lit);
    this.litPointsMat.opacity = x ? 1 : 0.85;
    this.dashesMat.color.set(x ? c.xrayLine : c.dim);
    this.raysMat.color.set(c.xrayNote);
    this.rays.visible = x;
  }

  resize(side: number, ratio: number): void {
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(side, side, false);
  }

  draw(form: ModelForm, pose: ModelPose, lit: ReadonlySet<string>): void {
    this.stars.visible = form === 'constellation';
    this.monogram.visible = form === 'bn';
    this.root.rotation.set(pose.tilt, pose.turn, 0);
    if (form === 'bn') this.dashesMat.opacity = this.xray ? 1 : 0.2 + pose.glow * 0.45;
    else this.light(lit);
    this.renderer.render(this.scene, this.camera);
  }

  /** Les géométries des étoiles allumées ne changent que quand la liste change. */
  private light(lit: ReadonlySet<string>): void {
    const key = [...lit].sort().join('|');
    if (key === this.litKey) return;
    this.litKey = key;
    const on = (i: number) => lit.has(this.map.ids[i]);
    this.litPoints.geometry.setFromPoints(this.stations.filter((_, i) => on(i)));
    this.litLinks.geometry.setFromPoints(this.map.links.filter(([a, b]) => on(a) && on(b)).flatMap(([a, b]) => [this.stations[a], this.stations[b]]));
  }

  dispose(): void {
    this.root.traverse((node) => {
      if (node instanceof LineSegments || node instanceof Points) node.geometry.dispose();
    });
    for (const material of [this.baseLinksMat, this.basePointsMat, this.litLinksMat, this.litPointsMat, this.dashesMat, this.raysMat]) material.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
