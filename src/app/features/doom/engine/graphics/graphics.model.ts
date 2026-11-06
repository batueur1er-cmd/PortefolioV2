import { FlatTexture, ThingKind, WallTexture } from '../level/level-data';

/*
 * Les images du niveau, rangées comme dans Doom : les murs par colonnes (le moteur les lit colonne
 * par colonne), les sols en carrés de 64 × 64 lus en lignes, les objets en « patches » dont seules
 * les parties opaques sont stockées. Toutes sont en indices de la palette.
 */

/** Une texture de mur, rangée colonne par colonne : data[x * height + y]. Largeur et hauteur en puissances de 2. */
export interface WallTex {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

/** Un morceau opaque d'une colonne de sprite (un « post »). */
export interface Post {
  readonly top: number;
  readonly pixels: Uint8Array;
}

/** Une image de sprite : ses colonnes de posts, et son point d'ancrage (le pied de l'objet). */
export interface Patch {
  readonly width: number;
  readonly height: number;
  readonly leftOffset: number;
  readonly topOffset: number;
  readonly columns: readonly (readonly Post[])[];
}

export interface SpriteDef {
  /** Les images de l'animation, chacune vue d'un seul angle ou de 8. */
  readonly frames: readonly (readonly Patch[])[];
  /** Durée de chaque image, en tics (0 : pas d'animation). */
  readonly ticsPerFrame: number;
  /** Toujours en pleine lumière (une lampe, une flamme). */
  readonly fullbright: boolean;
  /** Encombrement au sol. */
  readonly radius: number;
}

export interface Graphics {
  readonly walls: Readonly<Record<WallTexture, WallTex>>;
  /** Sols et plafonds de 64 × 64, en lignes ; plusieurs images pour un sol animé (une toutes les 8 tics). */
  readonly flats: Readonly<Record<FlatTexture, readonly Uint8Array[]>>;
  readonly sky: WallTex;
  readonly sprites: Readonly<Record<ThingKind, SpriteDef>>;
}
