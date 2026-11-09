import {
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

import { PartRole, buildDemo } from '@features/viewer/scene/demo-models';
import { XrayUniforms, xrayMaterial } from '@features/viewer/scene/xray-material';

import type { ModelPose } from './scroll-model.pose';

/*
 * La boîte de vitesses du visualiseur, recyclée : elle s'ouvre à mesure qu'on descend, et ses
 * engrenages tournent. Ce fichier n'est chargé qu'à la demande, pour garder Three.js hors du bundle initial.
 */

export interface ScrollModelColors {
  readonly shell: string;
  readonly part: string;
  readonly alt: string;
  readonly dark: string;
  readonly xrayLine: string;
  readonly xrayNote: string;
  readonly xrayPink: string;
}

/** Où chaque pièce part quand la boîte s'ouvre : vers le haut (y) et le long des arbres (z). */
const OPENING: Readonly<Record<string, readonly [y: number, z: number]>> = {
  couvercle: [2.4, 0],
  vis: [2.8, 0],
  'arbre-primaire': [1.25, 0],
  'arbre-secondaire': [1.25, 0],
  roulements: [1.25, 0],
  'pignon-1': [1.25, -0.35],
  'roue-1': [1.25, -0.35],
  'pignon-2': [1.25, 0.35],
  'roue-2': [1.25, 0.35],
  poulie: [1.25, -0.8],
  flasque: [1.25, 0.8],
};

/** L'axe de chaque engrenage (x, y) et sa vitesse : une roue deux fois plus grande tourne deux fois moins vite. */
const GEARS: Readonly<Record<string, readonly [x: number, y: number, speed: number]>> = {
  'pignon-1': [-0.56, 1, 1],
  'roue-1': [0.56, 1, -0.5],
  'roue-2': [-0.56, 1, 1],
  'pignon-2': [0.56, 1, -1.2],
};

interface Piece {
  readonly mesh: Mesh;
  readonly role: PartRole;
  readonly surface: MeshStandardMaterial;
  readonly xray: Material;
  readonly uniforms: XrayUniforms;
  readonly baseX: number;
  readonly baseY: number;
  readonly opening: readonly [number, number];
  readonly speed: number;
}

export class ScrollModelScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 50);
  private readonly root = new Group();
  private readonly model: Group;
  private readonly pieces: Piece[] = [];
  private xray = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.set(0, 0, 11);
    this.scene.add(new HemisphereLight(0xffffff, 0xbbbbbb, 1.1));
    const sun = new DirectionalLight(0xffffff, 2.2);
    sun.position.set(4, 7, 6);
    this.scene.add(sun, this.root);
    this.model = buildDemo('boite-de-vitesses');
    this.root.add(this.model);
    this.model.traverse((node) => {
      if (node instanceof Mesh) this.pieces.push(this.piece(node));
    });
  }

  private piece(mesh: Mesh): Piece {
    const gear = GEARS[mesh.name];
    if (gear) {
      // Autour de son propre axe : le centre de la géométrie passe à l'origine.
      mesh.geometry.translate(-gear[0], -gear[1], 0);
      mesh.position.set(gear[0], gear[1], 0);
    }
    const role = (mesh.userData['role'] as PartRole | undefined) ?? 'part';
    const surface = new MeshStandardMaterial({ metalness: role === 'shell' ? 0.1 : 0.55, roughness: 0.5, transparent: role === 'shell' });
    const { material, uniforms } = xrayMaterial();
    return { mesh, role, surface, xray: material, uniforms, baseX: mesh.position.x, baseY: mesh.position.y, opening: OPENING[mesh.name] ?? [0, 0], speed: gear?.[2] ?? 0 };
  }

  setColors(colors: ScrollModelColors): void {
    for (const { role, surface, uniforms } of this.pieces) {
      surface.color.set(role === 'shell' ? colors.shell : role === 'alt' ? colors.alt : role === 'dark' ? colors.dark : colors.part);
      uniforms.uColor.value = new Color(role === 'alt' ? colors.xrayPink : role === 'part' ? colors.xrayNote : colors.xrayLine);
      uniforms.uOpacity.value = role === 'shell' ? 0.45 : 1;
    }
  }

  setXray(xray: boolean): void {
    this.xray = xray;
    for (const piece of this.pieces) piece.mesh.material = xray ? piece.xray : piece.surface;
  }

  resize(side: number, ratio: number): void {
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(side, side, false);
  }

  draw(pose: ModelPose): void {
    const open = pose.explode;
    this.root.rotation.set(pose.tilt, pose.turn, 0);
    this.model.position.y = -1 - open * 1.1;
    for (const piece of this.pieces) {
      piece.mesh.position.set(piece.baseX, piece.baseY + piece.opening[0] * open, piece.opening[1] * open);
      if (piece.speed) piece.mesh.rotation.z = pose.spin * piece.speed;
      // Le carter s'efface quand les pièces en sortent.
      if (piece.role === 'shell' && !this.xray) piece.surface.opacity = 1 - open * 0.7;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const { mesh, surface, xray } of this.pieces) {
      mesh.geometry.dispose();
      surface.dispose();
      xray.dispose();
    }
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
