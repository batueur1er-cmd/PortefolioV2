import {
  AxesHelper,
  Box3,
  Box3Helper,
  BufferGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  PCFShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  ShadowMaterial,
  SphereGeometry,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Vec3 } from '@core/sync/window-bus';

import {
  CameraState,
  DEFAULT_LIGHT,
  FOV,
  LightSettings,
  ModelTransform,
  framing,
  lightDirection,
  roundCamera,
} from '../data/viewer-state';
import { PartRole, buildDemo } from './demo-models';
import { XrayUniforms, xrayMaterial } from './xray-material';

/** Les couleurs du thème dont la scène a besoin (variables CSS lues par la page). */
export interface ViewerColors {
  readonly accent: string;
  readonly accent2: string;
  /** Rayons X : contours, notes, tampons. */
  readonly xl: string;
  readonly xn: string;
  readonly xp: string;
}

export interface ModelInfo {
  readonly objects: number;
  readonly triangles: number;
  /** Dimensions d'origine, dans les unités du fichier. */
  readonly size: Vec3;
  /** Les premières pièces, pour le graphe de scène. */
  readonly parts: readonly { readonly name: string; readonly triangles: number }[];
}

export interface ViewerSceneOptions {
  /** Vraie page : la caméra obéit à la souris, au doigt et au clavier. Copie de loupe : elle suit le portfolio. */
  readonly interactive: boolean;
  readonly reducedMotion: boolean;
  readonly colors: ViewerColors;
  /** Le visiteur prend la caméra en main (la rotation automatique s'arrête). */
  readonly onInteract?: () => void;
}

/** Plus grande dimension d'un modèle, une fois mis à l'échelle de la scène. */
const FIT = 2;
/** Au-delà, pas d'arêtes aux rayons X : leur calcul figerait la page sur un gros fichier. */
const EDGES_MAX_TRIANGLES = 300_000;
/** Pièces listées dans le graphe de scène. */
const LISTED_PARTS = 12;
/** Teintes d'un fichier importé, objet après objet. */
const ROLE_CYCLE: readonly PartRole[] = ['part', 'alt', 'shell', 'dark'];
const LOOK: Readonly<Record<PartRole, { readonly metalness: number; readonly roughness: number }>> = {
  shell: { metalness: 0.1, roughness: 0.6 },
  part: { metalness: 0.45, roughness: 0.35 },
  alt: { metalness: 0.45, roughness: 0.35 },
  dark: { metalness: 0.6, roughness: 0.32 },
  hidden: { metalness: 0.05, roughness: 0.75 },
};
const WHITE = new Color(1, 1, 1);
const BLACK = new Color(0, 0, 0);

interface Part {
  readonly mesh: Mesh;
  readonly role: PartRole;
  readonly surface: MeshStandardMaterial;
  readonly xray: ShaderMaterial;
  readonly uniforms: XrayUniforms;
  readonly edges: LineSegments<EdgesGeometry, LineBasicMaterial> | null;
}

interface Loaded {
  readonly key: string;
  readonly root: Group;
  readonly parts: readonly Part[];
  /** Hauteur et rayon englobant, en unités de la scène. */
  readonly height: number;
  readonly radius: number;
}

const trianglesOf = (geometry: BufferGeometry): number =>
  Math.floor((geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0) / 3);

const sameVec = (a: Vector3, b: Vec3): boolean => a.x === b[0] && a.y === b[1] && a.z === b[2];

/** Un quadrillage au sol, pour le plan des rayons X. */
function floorGrid(half: number, step: number): BufferGeometry {
  const points: number[] = [];
  for (let v = -half; v <= half + 1e-6; v += step) points.push(-half, 0, v, half, 0, v, v, 0, -half, v, 0, half);
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(points, 3));
}

/** Un matériau de trait pour les rayons X : couleur exacte (sans tonalité), sans profondeur. */
const xrayLine = (opacity: number): LineBasicMaterial =>
  new LineBasicMaterial({ transparent: true, opacity, depthWrite: false, toneMapped: false });

/**
 * La scène Three.js du visualiseur : un modèle (exemple ou fichier OBJ), une lumière principale
 * qui porte les ombres, une lumière d'ambiance et une caméra. Deux rendus : « surface » (matériaux
 * physiques, ombre au sol) et « rayons X » (volumes translucides, arêtes, quadrillage, et ce que la
 * scène a d'invisible : la lumière, la boîte englobante, les axes).
 *
 * Elle ne dessine que lorsque quelque chose a changé. Sans WebGL, tout se calcule sans s'afficher.
 */
export class ViewerScene {
  /** Null quand WebGL est indisponible. */
  readonly renderer: WebGLRenderer | null;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.05, 100);
  private readonly target = new Vector3();
  private readonly controls: OrbitControls | null;
  private readonly hemi = new HemisphereLight(0xffffff, 0xffffff, 0.7);
  private readonly sun = new DirectionalLight(0xffffff, 2.4);
  /** Reçoit la position réglée par le visiteur ; le modèle, mis à l'échelle, est dedans. */
  private readonly holder = new Group();
  private readonly ground = new Mesh(new PlaneGeometry(16, 16), new ShadowMaterial({ opacity: 0.2 }));
  private readonly grid = new LineSegments(floorGrid(4, 0.5), xrayLine(0.18));
  private readonly helpers = new Group();
  private readonly sunMarker = new Mesh(
    new SphereGeometry(0.06, 10, 6),
    new MeshBasicMaterial({ wireframe: true, transparent: true, depthWrite: false, toneMapped: false }),
  );
  private readonly sunRay = new LineSegments(new BufferGeometry(), xrayLine(0.7));
  private readonly box = new Box3();
  private readonly bounds = new Box3Helper(this.box);
  private readonly axes = new AxesHelper(0.7);
  private readonly environment: Texture | null = null;
  private loaded: Loaded | null = null;
  private mode: 'surface' | 'xray' = 'surface';
  private colors: ViewerColors;
  private lightKey = '';
  private transformKey = '';
  private size = { w: 0, h: 0, ratio: 0 };
  private dirty = true;

  constructor(canvas: HTMLCanvasElement, options: ViewerSceneOptions) {
    this.colors = options.colors;
    let renderer: WebGLRenderer | null = null;
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      renderer = null;
    }
    this.renderer = renderer;
    if (renderer) {
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = NeutralToneMapping;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFShadowMap;
      // Des reflets doux de studio pour les matériaux métalliques.
      const pmrem = new PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      this.environment = pmrem.fromScene(room, 0.04).texture;
      room.dispose();
      pmrem.dispose();
      this.scene.environment = this.environment;
    }

    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const shadow = this.sun.shadow.camera;
    shadow.left = shadow.bottom = -3.5;
    shadow.right = shadow.top = 3.5;
    shadow.near = 0.5;
    shadow.far = 20;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 4;
    this.hemi.position.set(0, 4, 0);

    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.grid.position.y = 0.002;
    this.helpers.add(this.sunMarker, this.sunRay, this.bounds, this.axes);
    for (const material of [this.bounds.material, this.axes.material] as Material[]) {
      Object.assign(material, { transparent: true, opacity: 0.6, depthWrite: false });
    }
    this.scene.add(this.hemi, this.sun, this.sun.target, this.ground, this.grid, this.helpers, this.holder);

    if (options.interactive) {
      const controls = new OrbitControls(this.camera, canvas);
      controls.enableDamping = !options.reducedMotion;
      controls.dampingFactor = 0.08;
      controls.minDistance = 1.5;
      controls.maxDistance = 14;
      // La caméra reste au-dessus du sol.
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.autoRotateSpeed = 1.6;
      controls.keyPanSpeed = 14;
      controls.listenToKeyEvents(canvas);
      controls.addEventListener('change', () => (this.dirty = true));
      controls.addEventListener('start', () => options.onInteract?.());
      this.controls = controls;
    } else {
      this.controls = null;
    }

    this.applyColors();
    this.applyMode();
    this.setLight(DEFAULT_LIGHT);
    this.resetCamera();
  }

  /** Clé du modèle affiché, ou null. */
  get modelKey(): string | null {
    return this.loaded?.key ?? null;
  }

  showDemo(key: string, id: string): ModelInfo {
    return this.show(key, buildDemo(id));
  }

  /** Lit un fichier OBJ ; lève une erreur s'il ne contient aucune face. */
  showObj(key: string, text: string): ModelInfo {
    return this.show(key, new OBJLoader().parse(text));
  }

  /** Retire le modèle (une copie qui attend son fichier). */
  clear(): void {
    this.disposeModel();
    this.updateBounds();
    this.dirty = true;
  }

  setMode(mode: 'surface' | 'xray'): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.applyMode();
  }

  setColors(colors: ViewerColors): void {
    if (JSON.stringify(colors) === JSON.stringify(this.colors)) return;
    this.colors = colors;
    this.applyColors();
  }

  setLight(light: LightSettings): void {
    const key = `${light.intensity}|${light.azimuth}|${light.elevation}|${light.ambient}`;
    if (key === this.lightKey) return;
    this.lightKey = key;
    const [x, y, z] = lightDirection(light.azimuth, light.elevation);
    this.sun.position.set(x * 7, y * 7, z * 7);
    this.sun.intensity = light.intensity;
    this.hemi.intensity = light.ambient;
    this.scene.environmentIntensity = 0.2 + light.ambient * 0.3;
    // Aux rayons X, la lumière se montre : une sphère là d'où elle vient, un rayon vers le modèle.
    this.sunMarker.position.set(x * 2.5, y * 2.5, z * 2.5);
    this.updateRay();
    this.dirty = true;
  }

  setTransform(transform: ModelTransform): void {
    const key = `${transform.x}|${transform.y}|${transform.z}|${transform.rotation}|${transform.scale}`;
    if (key === this.transformKey) return;
    this.transformKey = key;
    this.holder.position.set(transform.x, transform.y, transform.z);
    this.holder.rotation.y = (transform.rotation * Math.PI) / 180;
    this.holder.scale.setScalar(transform.scale);
    this.updateBounds();
    this.dirty = true;
  }

  setAutoRotate(on: boolean): void {
    if (this.controls) this.controls.autoRotate = on;
  }

  /** Copie de loupe : la caméra du portfolio. */
  setCamera(camera: CameraState): void {
    if (sameVec(this.camera.position, camera.position) && sameVec(this.target, camera.target)) return;
    this.camera.position.set(...camera.position);
    this.target.set(...camera.target);
    this.camera.lookAt(this.target);
    this.dirty = true;
  }

  cameraState(): CameraState {
    const p = this.camera.position;
    const t = this.controls?.target ?? this.target;
    return roundCamera([p.x, p.y, p.z], [t.x, t.y, t.z]);
  }

  /** Cadre le modèle de trois quarts. */
  resetCamera(): void {
    const view = framing(this.loaded?.height ?? FIT / 2, this.loaded?.radius ?? FIT / 2);
    this.camera.position.set(...view.position);
    this.target.set(...view.target);
    if (this.controls) {
      this.controls.target.copy(this.target);
      this.controls.update();
    }
    this.camera.lookAt(this.target);
    this.dirty = true;
  }

  resize(width: number, height: number, ratio: number): void {
    if (width === this.size.w && height === this.size.h && ratio === this.size.ratio) return;
    this.size = { w: width, h: height, ratio };
    this.renderer?.setPixelRatio(ratio);
    this.renderer?.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  /** Une image : la caméra avance (inertie, rotation automatique), et la scène se redessine si besoin. */
  tick(dt: number): void {
    if (this.controls?.update(dt / 1000)) this.dirty = true;
    if (!this.dirty || !this.renderer || !this.size.w) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.controls?.dispose();
    this.disposeModel();
    this.scene.traverse((object) => {
      const { geometry, material } = object as Partial<Mesh>;
      geometry?.dispose();
      for (const m of Array.isArray(material) ? material : material ? [material] : []) m.dispose();
    });
    this.environment?.dispose();
    // Une loupe ouvre et ferme des copies : on rend le contexte WebGL tout de suite.
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
  }

  private show(key: string, source: Group): ModelInfo {
    const meshes: Mesh[] = [];
    const strays: Object3D[] = [];
    source.traverse((object) => {
      if ((object as Mesh).isMesh) meshes.push(object as Mesh);
      else if (object !== source && !(object as Group).isGroup) strays.push(object);
    });
    // Lignes et nuages de points d'un fichier OBJ : le visualiseur ne montre que les faces.
    for (const stray of strays) stray.removeFromParent();
    if (!meshes.length) throw new Error('Aucune face dans ce modèle.');

    source.updateMatrixWorld(true);
    const box = new Box3().setFromObject(source);
    if (box.isEmpty()) throw new Error('Modèle vide.');
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = FIT / (Math.max(size.x, size.y, size.z) || 1);
    // Posé au sol, centré, à la taille de la scène.
    const offset = new Group();
    offset.position.set(-center.x, -box.min.y, -center.z);
    offset.add(source);
    const root = new Group();
    root.scale.setScalar(scale);
    root.add(offset);

    const triangles = meshes.reduce((sum, mesh) => sum + trianglesOf(mesh.geometry), 0);
    const parts = meshes.map((mesh, i) => this.preparePart(mesh, i, triangles <= EDGES_MAX_TRIANGLES));

    this.disposeModel();
    this.holder.add(root);
    this.loaded = {
      key,
      root,
      parts,
      height: size.y * scale,
      radius: (Math.hypot(size.x, size.y, size.z) * scale) / 2,
    };
    this.applyColors();
    this.applyMode();
    this.updateBounds();
    this.updateRay();
    this.dirty = true;
    return {
      objects: meshes.length,
      triangles,
      size: [size.x, size.y, size.z],
      parts: meshes.slice(0, LISTED_PARTS).map((mesh, i) => ({
        name: mesh.name || `objet-${i + 1}`,
        triangles: trianglesOf(mesh.geometry),
      })),
    };
  }

  private preparePart(mesh: Mesh, index: number, withEdges: boolean): Part {
    const geometry = mesh.geometry;
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
    const old = mesh.material;
    for (const m of Array.isArray(old) ? old : [old]) m.dispose();
    const role = (mesh.userData['role'] as PartRole | undefined) ?? ROLE_CYCLE[index % ROLE_CYCLE.length];
    const surface = new MeshStandardMaterial({ ...LOOK[role] });
    const { material: xray, uniforms } = xrayMaterial();
    mesh.material = surface;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    let edges: Part['edges'] = null;
    if (withEdges) {
      edges = new LineSegments(new EdgesGeometry(geometry, 30), xrayLine(0.5));
      mesh.add(edges);
    }
    return { mesh, role, surface, xray, uniforms, edges };
  }

  private disposeModel(): void {
    const loaded = this.loaded;
    if (!loaded) return;
    this.holder.remove(loaded.root);
    for (const part of loaded.parts) {
      part.mesh.geometry.dispose();
      part.surface.dispose();
      part.xray.dispose();
      part.edges?.geometry.dispose();
      part.edges?.material.dispose();
    }
    this.loaded = null;
  }

  private surfaceColor(role: PartRole): Color {
    const accent = new Color(this.colors.accent);
    const accent2 = new Color(this.colors.accent2);
    switch (role) {
      case 'shell':
        return accent.lerp(WHITE, 0.82);
      case 'part':
        return accent;
      case 'alt':
        return accent2;
      case 'dark':
        return accent.lerp(BLACK, 0.72);
      case 'hidden':
        return accent2.lerp(WHITE, 0.35);
    }
  }

  private applyColors(): void {
    const xl = new Color(this.colors.xl);
    const xn = new Color(this.colors.xn);
    for (const part of this.loaded?.parts ?? []) {
      const hidden = part.role === 'hidden';
      const shell = part.role === 'shell';
      part.surface.color.copy(this.surfaceColor(part.role));
      part.uniforms.uColor.value.copy(hidden ? xn : xl);
      part.uniforms.uOpacity.value = shell ? 0.5 : hidden ? 1.4 : 0.95;
      if (part.edges) {
        part.edges.material.color.copy(hidden ? xn : xl);
        part.edges.material.opacity = shell ? 0.32 : hidden ? 0.85 : 0.5;
      }
    }
    this.grid.material.color.copy(xl);
    (this.sunMarker.material as MeshBasicMaterial).color.copy(xn);
    this.sunRay.material.color.copy(xn);
    (this.bounds.material as LineBasicMaterial).color.set(this.colors.xp);
    this.axes.setColors(this.colors.xp, this.colors.xn, this.colors.xl);
    this.dirty = true;
  }

  private applyMode(): void {
    const xray = this.mode === 'xray';
    for (const part of this.loaded?.parts ?? []) {
      part.mesh.material = xray ? part.xray : part.surface;
      part.mesh.castShadow = !xray;
      if (part.edges) part.edges.visible = xray;
    }
    this.ground.visible = !xray;
    this.grid.visible = xray;
    this.helpers.visible = xray;
    this.sun.castShadow = !xray;
    this.dirty = true;
  }

  private updateBounds(): void {
    if (!this.loaded) {
      this.bounds.visible = false;
      return;
    }
    this.holder.updateMatrixWorld(true);
    this.box.setFromObject(this.loaded.root);
    this.bounds.visible = true;
  }

  /** Le rayon de lumière, de la sphère qui la montre jusqu'au cœur du modèle. */
  private updateRay(): void {
    const from = this.sunMarker.position;
    const to = new Vector3(0, (this.loaded?.height ?? 1) / 2, 0);
    this.sunRay.geometry.dispose();
    this.sunRay.geometry = new BufferGeometry().setFromPoints([from, to]);
  }
}
