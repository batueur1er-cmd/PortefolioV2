import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  Path,
  Shape,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Rôle d'une pièce : il choisit sa teinte. `shell` est une enveloppe (carter, carton), que les
 * rayons X rendent presque transparente ; `hidden` est ce qu'elle cache, qui s'y illumine.
 */
export type PartRole = 'shell' | 'part' | 'alt' | 'dark' | 'hidden';

/** Une pièce nommée (son nom apparaît dans le graphe de scène), faite d'une ou plusieurs géométries. */
function part(name: string, role: PartRole, ...geometries: BufferGeometry[]): Mesh {
  let geometry = geometries[0];
  if (geometries.length > 1) {
    // Toutes indexées ou aucune : sinon la fusion échoue.
    const indexed = geometries.every((g) => g.index !== null);
    geometry = mergeGeometries(indexed ? geometries : geometries.map((g) => (g.index ? g.toNonIndexed() : g)));
  }
  const mesh = new Mesh(geometry);
  mesh.name = name;
  mesh.userData['role'] = role;
  return mesh;
}

const group = (...meshes: Mesh[]): Group => new Group().add(...meshes);

/** Un cylindre couché le long de l'axe Z (arbres, poulies). */
const axle = (radius: number, length: number, x: number, y: number, z: number, segments = 20): BufferGeometry =>
  new CylinderGeometry(radius, radius, length, segments).rotateX(Math.PI / 2).translate(x, y, z);

/** Un engrenage droit, extrudé le long de Z et centré sur son axe. */
function gear(teeth: number, radius: number, thickness: number, bore: number): BufferGeometry {
  const depth = Math.min(0.1, radius * 0.22);
  const root = radius - depth;
  const step = (Math.PI * 2) / teeth;
  // Profil d'une dent : pied, flanc montant, sommet, flanc descendant.
  const profile: readonly (readonly [number, number])[] = [
    [root, 0],
    [root, 0.12],
    [radius, 0.3],
    [radius, 0.52],
    [root, 0.7],
  ];
  const shape = new Shape();
  for (let i = 0; i < teeth; i++) {
    profile.forEach(([r, f], j) => {
      const a = (i + f) * step;
      if (i === 0 && j === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    });
  }
  shape.closePath();
  const hole = new Path();
  hole.absarc(0, 0, bore, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 10 }).translate(
    0,
    0,
    -thickness / 2,
  );
}

/** Un réducteur à deux paires d'engrenages, enfermé dans son carter. */
function gearbox(): Group {
  const y = 1;
  const left = -0.56;
  const right = 0.56;
  const bolts = [-1.35, 0.05, 1.45].flatMap((x) =>
    [-0.55, 0.55].map((z) => new CylinderGeometry(0.07, 0.07, 0.06, 12).translate(x, 2.09, z)),
  );
  const bearings = [left, right].flatMap((x) =>
    [-0.66, 0.66].map((z) => new TorusGeometry(0.16, 0.045, 8, 24).translate(x, y, z)),
  );
  return group(
    part('carter', 'shell', new RoundedBoxGeometry(3.1, 1.85, 1.3, 3, 0.12).translate(0.05, 1.025, 0)),
    part('couvercle', 'shell', new RoundedBoxGeometry(3.24, 0.12, 1.44, 2, 0.04).translate(0.05, 2.01, 0)),
    part('vis', 'dark', ...bolts),
    part('pattes', 'dark', new BoxGeometry(0.5, 0.12, 1.5).translate(-1.0, 0.06, 0), new BoxGeometry(0.5, 0.12, 1.5).translate(1.1, 0.06, 0)),
    part('arbre-primaire', 'dark', axle(0.09, 1.8, left, y, -0.3, 16)),
    part('arbre-secondaire', 'dark', axle(0.09, 1.85, right, y, 0.325, 16)),
    part('pignon-1', 'part', gear(11, 0.42, 0.22, 0.09).translate(left, y, -0.3)),
    part('roue-1', 'alt', gear(22, 0.8, 0.22, 0.09).rotateZ(Math.PI / 22).translate(right, y, -0.3)),
    part('pignon-2', 'part', gear(15, 0.56, 0.2, 0.09).translate(right, y, 0.32)),
    part('roue-2', 'alt', gear(18, 0.66, 0.2, 0.09).rotateZ(Math.PI / 18).translate(left, y, 0.32)),
    part('roulements', 'alt', ...bearings),
    part('poulie', 'part', axle(0.26, 0.14, left, y, -1.08, 28)),
    part('flasque', 'part', axle(0.3, 0.07, right, y, 1.12, 28)),
  );
}

/** Un carton fermé et scotché. Ce qu'il contient ne se voit qu'aux rayons X. */
function parcel(): Group {
  const w = 2.2;
  const h = 1.4;
  const d = 1.6;
  const flap = () => new BoxGeometry(w + 0.02, 0.03, d / 2 - 0.01);
  const strip = (x: number) => new BoxGeometry(0.012, 0.5, 0.26).translate(x, h - 0.22, 0);
  return group(
    part('carton', 'shell', new BoxGeometry(w, h, d).translate(0, h / 2, 0)),
    part('rabats', 'shell', flap().translate(0, h + 0.015, -d / 4), flap().translate(0, h + 0.015, d / 4)),
    part(
      'scotch',
      'alt',
      new BoxGeometry(w + 0.06, 0.012, 0.26).translate(0, h + 0.036, 0),
      strip(w / 2 + 0.03),
      strip(-w / 2 - 0.03),
    ),
    part('etiquette', 'part', new BoxGeometry(0.7, 0.45, 0.012).translate(-0.45, h * 0.45, d / 2 + 0.006)),
    // Ce que le carton cache : une simple sphère, posée au fond.
    part('contenu', 'hidden', new SphereGeometry(0.5, 32, 20).translate(0, 0.5, 0)),
  );
}

/** La théière de l'Utah (Martin Newell, 1975), avec son couvercle à part. */
function teapot(): Group {
  return group(
    part('theiere', 'part', new TeapotGeometry(1, 8, true, false, true, true, true)),
    part('couvercle', 'alt', new TeapotGeometry(1, 8, false, true, false, true, true)),
  );
}

const BUILDERS: Readonly<Record<string, () => Group>> = {
  'boite-de-vitesses': gearbox,
  colis: parcel,
  theiere: teapot,
};

/** Construit un modèle d'exemple (le même, au sommet près, dans toutes les fenêtres). */
export function buildDemo(id: string): Group {
  const build = BUILDERS[id];
  if (!build) throw new Error(`Modèle d'exemple inconnu : ${id}`);
  return build();
}
