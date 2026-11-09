import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  OctahedronGeometry,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import type { BufferGeometry } from 'three';

import { XrayUniforms, xrayMaterial } from '@features/viewer/scene/xray-material';

import type { ModelPose } from './scroll-model.pose';

/*
 * À la surface, une simple forme en fil de fer, discrète, qui tourne avec le défilement. Aux rayons X,
 * elle contient le coffre de la démo façon Doom, en volume : mêmes proportions que son sprite
 * (80 × 48 × 52, divisé par 40), et un trésor qui se révèle quand il s'ouvre. Ce fichier n'est chargé qu'à la demande : Three.js reste hors du bundle initial.
 */

export interface ScrollModelColors {
  readonly wire: string;
  readonly wood: string;
  readonly iron: string;
  readonly lock: string;
  readonly inner: string;
  readonly xrayLine: string;
  readonly xrayNote: string;
  readonly xrayPink: string;
}

type Role = 'wood' | 'iron' | 'lock' | 'inner' | 'treasure';

const LENGTH = 2;
const DEPTH = 1.2;
const BODY = 0.85;
const LID = 0.45;
const WALL = 0.06;
const STRAPS = [-0.72, 0.72];
/** Le couvercle bascule autour de ses charnières, jusqu'à passer un peu la verticale. */
const LID_OPEN = 1.85;

interface Piece {
  readonly mesh: Mesh;
  readonly role: Role;
  readonly surface: MeshStandardMaterial;
  readonly xray: Material;
  readonly uniforms: XrayUniforms;
}

/** Des planches en gris, à gros pixels comme le sprite : la teinte vient du thème. Aucun aléa, pour que la loupe voie la même chose. */
function planksTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 40;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 80; x++) {
        const seam = y % 10 === 0 || (x + (Math.floor(y / 10) % 2) * 20) % 40 === 0;
        const grain = ((x * 7 + y * 13) % 5) * 5;
        const value = seam ? 120 : 215 + grain;
        ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const box = (w: number, h: number, d: number, x: number, y: number, z: number): BufferGeometry => new BoxGeometry(w, h, d).translate(x, y, z);

export class ScrollModelScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 50);
  private readonly root = new Group();
  private readonly model = new Group();
  private readonly wireMaterial = new LineBasicMaterial();
  private readonly wire = new LineSegments(new EdgesGeometry(new IcosahedronGeometry(1.8, 1)), this.wireMaterial);
  private wireColors: { surface: string; xray: string } | null = null;
  /** Pivote sur les charnières, à l'arrière du coffre. */
  private readonly lid = new Group();
  private readonly treasure = new Group();
  private readonly planks = planksTexture();
  private readonly pieces: Piece[] = [];
  private xray = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.set(0, 0, 7);
    this.scene.add(new HemisphereLight(0xffffff, 0xbbbbbb, 1.1));
    const sun = new DirectionalLight(0xffffff, 2.2);
    sun.position.set(3, 7, 6);
    this.scene.add(sun, this.root);
    this.root.add(this.wire, this.model);
    this.model.visible = false;
    this.lid.position.set(0, BODY, -DEPTH / 2);
    this.model.add(this.lid, this.treasure);
    this.buildBody();
    this.buildLid();
    this.buildTreasure();
  }

  /** Une caisse creuse : on doit pouvoir regarder dedans. */
  private buildBody(): void {
    const add = (role: Role, geometry: BufferGeometry) => this.add(this.model, role, geometry);
    add('inner', box(LENGTH - WALL * 2, WALL, DEPTH - WALL * 2, 0, WALL / 2, 0));
    add('wood', box(LENGTH, BODY, WALL, 0, BODY / 2, DEPTH / 2 - WALL / 2));
    add('wood', box(LENGTH, BODY, WALL, 0, BODY / 2, -DEPTH / 2 + WALL / 2));
    add('wood', box(WALL, BODY, DEPTH, -LENGTH / 2 + WALL / 2, BODY / 2, 0));
    add('wood', box(WALL, BODY, DEPTH, LENGTH / 2 - WALL / 2, BODY / 2, 0));
    for (const x of STRAPS) {
      add('iron', box(0.12, BODY + 0.02, DEPTH + 0.03, x, BODY / 2, 0));
    }
    // La gâche de la serrure et les deux poignées.
    add('lock', box(0.3, 0.26, 0.05, 0, BODY - 0.13, DEPTH / 2 + 0.02));
    for (const side of [-1, 1]) {
      add('iron', new TorusGeometry(0.13, 0.03, 8, 20).rotateY(Math.PI / 2).translate(side * (LENGTH / 2 + 0.02), BODY * 0.6, 0));
    }
  }

  /** Le couvercle, dessiné depuis ses charnières : l'origine est l'arête arrière. */
  private buildLid(): void {
    const add = (role: Role, geometry: BufferGeometry) => this.add(this.lid, role, geometry);
    add('wood', box(LENGTH, LID, DEPTH, 0, LID / 2, DEPTH / 2));
    add('inner', box(LENGTH - 0.02, 0.01, DEPTH - 0.02, 0, -0.005, DEPTH / 2));
    for (const x of STRAPS) add('iron', box(0.12, LID + 0.03, DEPTH + 0.03, x, LID / 2, DEPTH / 2));
    add('lock', box(0.2, 0.18, 0.05, 0, 0.09, DEPTH + 0.02));
    for (const x of [-0.45, 0.45]) add('lock', new CylinderGeometry(0.05, 0.05, 0.2, 12).rotateZ(Math.PI / 2).translate(x, 0, -0.01));
  }

  /** Ce qu'il cache : des piles de pièces et une gemme. */
  private buildTreasure(): void {
    const piles: readonly (readonly [number, number, number])[] = [
      [-0.5, 0.1, 6],
      [0.45, -0.15, 4],
      [0.1, 0.25, 3],
    ];
    for (const [x, z, count] of piles) {
      for (let i = 0; i < count; i++) {
        this.add(this.treasure, 'treasure', new CylinderGeometry(0.17, 0.17, 0.05, 16).translate(x + (i % 2) * 0.03, i * 0.055, z));
      }
    }
    this.add(this.treasure, 'treasure', new OctahedronGeometry(0.28).translate(0, 0.42, -0.1));
    this.treasure.position.y = WALL;
  }

  private add(parent: Group, role: Role, geometry: BufferGeometry): void {
    const surface = new MeshStandardMaterial({
      map: role === 'wood' ? this.planks : null,
      metalness: role === 'iron' || role === 'lock' ? 0.6 : 0.05,
      roughness: role === 'wood' ? 0.85 : 0.45,
    });
    const { material, uniforms } = xrayMaterial();
    const mesh = new Mesh(geometry, surface);
    parent.add(mesh);
    this.pieces.push({ mesh, role, surface, xray: material, uniforms });
  }

  setColors(colors: ScrollModelColors): void {
    this.wireColors = { surface: colors.wire, xray: colors.xrayLine };
    this.paintWire();
    const surface: Record<Role, string> = { wood: colors.wood, iron: colors.iron, lock: colors.lock, inner: colors.inner, treasure: colors.wood };
    const xray: Record<Role, string> = { wood: colors.xrayLine, iron: colors.xrayLine, lock: colors.xrayNote, inner: colors.xrayLine, treasure: colors.xrayPink };
    for (const piece of this.pieces) {
      piece.surface.color.set(surface[piece.role]);
      piece.uniforms.uColor.value = new Color(xray[piece.role]);
      piece.uniforms.uOpacity.value = piece.role === 'treasure' ? 1 : piece.role === 'wood' || piece.role === 'inner' ? 0.4 : 0.8;
    }
  }

  setXray(xray: boolean): void {
    this.xray = xray;
    // Le coffre et son trésor n'existent qu'aux rayons X.
    this.model.visible = xray;
    for (const piece of this.pieces) piece.mesh.material = xray ? piece.xray : piece.surface;
    this.paintWire();
  }

  private paintWire(): void {
    if (this.wireColors) this.wireMaterial.color.set(this.xray ? this.wireColors.xray : this.wireColors.surface);
  }

  resize(side: number, ratio: number): void {
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(side, side, false);
  }

  draw(pose: ModelPose): void {
    // Penché vers le spectateur quand il s'ouvre, pour montrer l'intérieur.
    this.root.rotation.set(pose.tilt, pose.turn, 0);
    this.model.rotation.x = pose.open * 0.3;
    this.model.position.y = -0.65 - pose.open * 0.25;
    this.lid.rotation.x = -pose.open * LID_OPEN;
    this.treasure.position.y = WALL + pose.open * 0.35;
    this.treasure.rotation.y = pose.spin;
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const { mesh, surface, xray } of this.pieces) {
      mesh.geometry.dispose();
      surface.dispose();
      xray.dispose();
    }
    this.wire.geometry.dispose();
    this.wireMaterial.dispose();
    this.planks.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
