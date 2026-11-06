import { Vec3, ViewerPresence } from '@core/sync/window-bus';

/** Adresse de la démo : la même que dans `profile.data.ts` (projet « visu3d ») et `app.routes.ts`. */
export const VIEWER_PATH = '/projets/visu3d/demo';

export type LightSettings = ViewerPresence['light'];
export type ModelTransform = ViewerPresence['transform'];
export type CameraState = ViewerPresence['camera'];

/** Le modèle affiché : un exemple (« demo:<id> ») ou un fichier importé (« file:<id> »). */
export interface ModelRef {
  readonly key: string;
  readonly name: string;
}

export const DEFAULT_LIGHT: LightSettings = { intensity: 2.4, azimuth: 40, elevation: 50, ambient: 0.7 };
export const DEFAULT_TRANSFORM: ModelTransform = { x: 0, y: 0, z: 0, rotation: 0, scale: 1 };

/** Un curseur du panneau de réglages. */
export interface SliderDef<K extends string> {
  readonly key: K;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** Valeur lisible, à côté du curseur. */
  readonly format: (value: number) => string;
}

/** Nombre à la française, avec `digits` décimales. */
export const decimal = (value: number, digits: number): string =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const degrees = (value: number): string => `${Math.round(value)}°`;

export const LIGHT_SLIDERS: readonly SliderDef<keyof LightSettings>[] = [
  { key: 'intensity', label: 'Intensité', min: 0, max: 5, step: 0.1, format: (v) => decimal(v, 1) },
  { key: 'azimuth', label: 'Orientation', min: 0, max: 360, step: 1, format: degrees },
  { key: 'elevation', label: 'Hauteur', min: 5, max: 85, step: 1, format: degrees },
  { key: 'ambient', label: 'Ambiance', min: 0, max: 2, step: 0.05, format: (v) => decimal(v, 2) },
];

export const TRANSFORM_SLIDERS: readonly SliderDef<keyof ModelTransform>[] = [
  { key: 'x', label: 'Gauche · droite', min: -1.5, max: 1.5, step: 0.05, format: (v) => decimal(v, 2) },
  { key: 'y', label: 'Hauteur', min: 0, max: 1.5, step: 0.05, format: (v) => decimal(v, 2) },
  { key: 'z', label: 'Avant · arrière', min: -1.5, max: 1.5, step: 0.05, format: (v) => decimal(v, 2) },
  { key: 'rotation', label: 'Rotation', min: -180, max: 180, step: 1, format: degrees },
  { key: 'scale', label: 'Échelle', min: 0.5, max: 2, step: 0.05, format: (v) => `×${decimal(v, 2)}` },
];

/** Ramène une valeur dans les bornes d'un curseur (une saisie hors bornes, un état reçu abîmé). */
export function clampSlider<K extends string>(def: SliderDef<K>, value: number): number {
  if (!Number.isFinite(value)) return def.min;
  return Math.min(def.max, Math.max(def.min, value));
}

/** Direction (vecteur unitaire) vers une lumière donnée par son azimut et sa hauteur, en degrés. */
export function lightDirection(azimuth: number, elevation: number): Vec3 {
  const az = (azimuth * Math.PI) / 180;
  const el = (elevation * Math.PI) / 180;
  return [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
}

const round = (value: number, digits: number): number => {
  const k = 10 ** digits;
  return Math.round(value * k) / k;
};

/** Caméra arrondie : un état qui ne bouge plus ne se renvoie plus aux autres fenêtres. */
export function roundCamera(position: Vec3, target: Vec3, digits = 4): CameraState {
  return {
    position: [round(position[0], digits), round(position[1], digits), round(position[2], digits)],
    target: [round(target[0], digits), round(target[1], digits), round(target[2], digits)],
  };
}

/** Champ de vision vertical de la caméra, en degrés. */
export const FOV = 40;

/**
 * Cadrage d'un modèle posé au sol et centré, de hauteur `height` et de rayon englobant `radius` :
 * la caméra le regarde de trois quarts, d'un peu haut, avec une marge.
 */
export function framing(height: number, radius: number): CameraState {
  const distance = (radius / Math.sin(((FOV / 2) * Math.PI) / 180)) * 1.08;
  const direction: Vec3 = [0.62, 0.42, 0.66];
  const norm = Math.hypot(...direction);
  const target: Vec3 = [0, height / 2, 0];
  return roundCamera(
    [
      (direction[0] / norm) * distance,
      target[1] + (direction[1] / norm) * distance,
      (direction[2] / norm) * distance,
    ],
    target,
  );
}

export const demoKey = (id: string): string => `demo:${id}`;

/** Identifiant d'un exemple, ou null pour un fichier importé. */
export function demoIdOf(key: string): string | null {
  return key.startsWith('demo:') ? key.slice(5) : null;
}

/** Deux états de réglages identiques (la caméra, elle, est comparée à part). */
export function sameSettings(a: ViewerSettings | null, b: ViewerSettings | null): boolean {
  return a === b || (!!a && !!b && JSON.stringify(a) === JSON.stringify(b));
}

/** Les réglages d'un visualiseur, sans la caméra (qui bouge à chaque image). */
export type ViewerSettings = Omit<ViewerPresence, 'camera'>;
