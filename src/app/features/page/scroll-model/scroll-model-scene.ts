import { BufferGeometry, Color, Group, LineBasicMaterial, LineSegments, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';

import type { ModelPose } from './scroll-model.pose';

/*
 * L'anamorphose du monogramme : un nuage de tirets qui ne forme « BN » que vu d'un seul point.
 * Ce fichier n'est chargé qu'à la demande : Three.js reste hors du bundle initial.
 */

export interface ScrollModelColors {
  readonly dim: string;
  readonly lit: string;
  readonly xrayLine: string;
  readonly xrayNote: string;
}

const CAMERA_Z = 9;
const DASH = 0.075;
const GAP = 0.02;
/** WebGL ne trace que des lignes d'un pixel : chaque tiret est doublé, décalé d'environ un pixel, pour l'épaissir. */
const THICKNESS = 0.012;
/** Opacité des traits à la surface : au repos, puis quand le monogramme se forme. */
const REST_OPACITY = 0.42;
const FORMED_OPACITY = 0.95;

/** Le monogramme, en lignes brisées, dans le plan de l'écran. */
const LETTERS: readonly (readonly (readonly [number, number])[])[] = [
  [[-1.6, 1], [-1.6, -1]],
  [[-1.6, 1], [-0.65, 1], [-0.32, 0.76], [-0.32, 0.3], [-0.65, 0.05], [-1.6, 0.05]],
  [[-0.65, 0.05], [-0.2, -0.2], [-0.2, -0.75], [-0.65, -1], [-1.6, -1]],
  [[0.3, -1], [0.3, 1], [1.6, -1], [1.6, 1]],
];

/** Un nombre entre 0 et 1, toujours le même pour un même rang : les deux fenêtres dessinent la même chose. */
const noise = (i: number): number => (Math.imul(i + 11, 2654435761) >>> 0) / 4294967296;

export class ScrollModelScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 50);
  private readonly root = new Group();
  private readonly dashesMat = new LineBasicMaterial({ transparent: true });
  private readonly raysMat = new LineBasicMaterial({ transparent: true, opacity: 0.55 });
  private readonly dashes: LineSegments;
  private readonly rays: LineSegments;
  private readonly restColor = new Color();
  private readonly formedColor = new Color();
  private xray = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.set(0, 0, CAMERA_Z);
    this.scene.add(this.root);
    const { dashes, rays } = this.buildMonogram();
    this.dashes = new LineSegments(new BufferGeometry().setFromPoints(dashes), this.dashesMat);
    this.rays = new LineSegments(new BufferGeometry().setFromPoints(rays), this.raysMat);
    this.rays.visible = false;
    this.root.add(this.dashes, this.rays);
  }

  /**
   * Chaque tiret du dessin est repoussé le long du rayon qui le relie à l'œil. Vu de cet œil, rien
   * ne change ; vu de n'importe où ailleurs, il ne reste qu'un nuage de traits.
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
          for (const shift of [0, THICKNESS]) {
            dashes.push(
              place(ax + (bx - ax) * from + shift, ay + (by - ay) * from + shift, depth),
              place(ax + (bx - ax) * to + shift, ay + (by - ay) * to + shift, depth),
            );
          }
          if (rank % 5 === 0) {
            // Aux rayons X : l'amorce de la ligne de visée qui part vers l'œil.
            const start = place(ax + (bx - ax) * from, ay + (by - ay) * from, depth);
            rays.push(start, start.clone().add(eye.clone().sub(start).setLength(1.4)));
          }
        }
      }
    }
    return { dashes, rays };
  }

  setColors(colors: ScrollModelColors): void {
    this.restColor.set(colors.dim);
    this.formedColor.set(colors.lit);
    this.xrayLine.set(colors.xrayLine);
    this.raysMat.color.set(colors.xrayNote);
  }

  private readonly xrayLine = new Color();

  setXray(xray: boolean): void {
    this.xray = xray;
    this.rays.visible = xray;
  }

  resize(side: number, ratio: number): void {
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(side, side, false);
  }

  draw(pose: ModelPose): void {
    this.root.rotation.set(pose.tilt, pose.turn, 0);
    if (this.xray) {
      this.dashesMat.color.copy(this.xrayLine);
      this.dashesMat.opacity = 1;
    } else {
      // Le monogramme prend la couleur du site au moment où il se forme.
      this.dashesMat.color.copy(this.restColor).lerp(this.formedColor, pose.glow);
      this.dashesMat.opacity = REST_OPACITY + (FORMED_OPACITY - REST_OPACITY) * pose.glow;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.dashes.geometry.dispose();
    this.rays.geometry.dispose();
    this.dashesMat.dispose();
    this.raysMat.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
