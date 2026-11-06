import { FlatTexture, ThingKind, WallTexture } from './level-data';

/*
 * Le niveau compilé, tel que le moteur le lit en jeu : les mêmes familles de données que les
 * « lumps » d'un fichier WAD de Doom (VERTEXES, LINEDEFS, SIDEDEFS, SECTORS, SEGS, SSECTORS,
 * NODES, THINGS).
 */

export interface Vertex {
  readonly x: number;
  readonly y: number;
}

export interface Box {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface Sector {
  readonly index: number;
  readonly id: string;
  readonly room: string;
  readonly floor: number;
  readonly ceiling: number;
  readonly floorFlat: FlatTexture;
  readonly ceilingFlat: FlatTexture | null;
  /** Le plafond est le ciel. */
  readonly sky: boolean;
  readonly light: number;
  readonly dimLight: number | null;
  readonly upper: WallTexture | null;
  readonly lower: WallTexture | null;
  readonly wall: WallTexture;
  /** Contours orientés : l'intérieur du secteur est toujours à droite. */
  readonly loops: readonly (readonly Vertex[])[];
  readonly things: Thing[];
}

/** Un côté de ligne, tourné vers un secteur (un « sidedef »). */
export interface Side {
  readonly sector: Sector;
  readonly upper: WallTexture | null;
  readonly mid: WallTexture | null;
  readonly lower: WallTexture | null;
}

/** Une ligne de la carte (un « linedef ») : un mur plein, ou une ouverture entre deux secteurs. */
export interface Line {
  readonly index: number;
  readonly v1: Vertex;
  readonly v2: Vertex;
  /** Le côté droit, quand on va de v1 vers v2. */
  readonly front: Side;
  readonly back: Side | null;
}

/** Un morceau de ligne vu d'un côté : l'unité que le moteur dessine. */
export interface Seg {
  index: number;
  readonly v1: Vertex;
  readonly v2: Vertex;
  readonly line: Line;
  /** 0 : le côté avant de la ligne, 1 : son côté arrière. */
  readonly side: 0 | 1;
  /** Distance depuis le début de la ligne, pour caler la texture. */
  readonly offset: number;
  readonly length: number;
  readonly front: Sector;
  readonly back: Sector | null;
  readonly sidedef: Side;
  /** Le node builder a coupé la ligne pour obtenir ce morceau. */
  readonly split: boolean;
}

/** Une zone convexe du niveau, dans un seul secteur : une feuille de l'arbre. */
export interface Subsector {
  readonly index: number;
  readonly segs: readonly Seg[];
  readonly sector: Sector;
  /** Sa zone de l'arbre, bornée par les découpes (pour la carte). */
  readonly cell: readonly Vertex[];
}

export type BspChild =
  | { readonly leaf: Subsector; readonly node?: undefined }
  | { readonly node: BspNode; readonly leaf?: undefined };

/** Un nœud de l'arbre : une droite de découpe, et ce qu'il y a de chaque côté. */
export interface BspNode {
  readonly index: number;
  readonly depth: number;
  /** La découpe passe par (x, y), dans la direction (dx, dy) ; l'avant est à droite. */
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
  /** Boîtes englobantes de l'avant (0) et de l'arrière (1). */
  readonly boxes: readonly [Box, Box];
  readonly children: readonly [BspChild, BspChild];
  /** La découpe, bornée à la zone de son nœud (pour la carte). */
  readonly cut: readonly [Vertex, Vertex];
}

export interface Thing {
  readonly index: number;
  readonly kind: ThingKind;
  readonly x: number;
  readonly y: number;
  /** En radians. */
  readonly angle: number;
  readonly sector: Sector;
  /** Hauteur du sol sous l'objet. */
  readonly z: number;
  /** Caché dans un mur : hors des listes des secteurs, peint seulement aux rayons X. */
  readonly hidden: boolean;
}

export interface LevelStats {
  readonly sectors: number;
  readonly lines: number;
  readonly twoSided: number;
  readonly segs: number;
  /** Segs nés d'une coupe par le node builder. */
  readonly splits: number;
  readonly nodes: number;
  readonly subsectors: number;
  readonly things: number;
  readonly depth: number;
}

export interface Level {
  readonly sectors: readonly Sector[];
  readonly lines: readonly Line[];
  readonly segs: readonly Seg[];
  readonly subsectors: readonly Subsector[];
  readonly nodes: readonly BspNode[];
  readonly root: BspChild;
  readonly things: readonly Thing[];
  readonly bounds: Box;
  readonly start: { readonly x: number; readonly y: number; readonly angle: number };
  /** Les pièces, dans l'ordre de la carte. */
  readonly rooms: readonly string[];
  readonly stats: LevelStats;
}
