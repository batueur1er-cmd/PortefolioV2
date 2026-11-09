import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { Point, Size } from '../geometry/geometry';
import { PresenceChannel, PresenceState } from './presence-channel';

export type WindowRole = 'main' | 'lens';

/** Ce que toute fenêtre annonce, quel que soit son rôle. */
interface WindowBase extends PresenceState {
  /** Coin haut gauche du contenu, en coordonnées écran. */
  readonly origin: Point;
  /** Taille du contenu (innerWidth × innerHeight). */
  readonly viewport: Size;
  /** Assez petite pour servir de loupe (voir `isLensSized`). */
  readonly small: boolean;
  /** Zoom du navigateur : 1 pixel CSS de cette fenêtre vaut `pageZoom` pixels écran. */
  readonly pageZoom: number;
}

/**
 * Une fenêtre modale ouverte par-dessus le portfolio (par exemple « Tous les projets »), pour que
 * la loupe en affiche la copie. Coordonnées relatives au coin haut gauche du contenu.
 */
export interface OverlayPresence {
  readonly id: string;
  /** Rang du premier projet listé (la fenêtre liste tout, ou seulement la suite de la page). */
  readonly from: number;
  /** Centre du panneau. */
  readonly cx: number;
  readonly cy: number;
  /** Taille de mise en page du panneau, avant l'animation d'ouverture. */
  readonly w: number;
  readonly h: number;
  /** Échelle de l'animation d'ouverture (1 une fois ouverte). */
  readonly scale: number;
  readonly opacity: number;
  /** Zone qui défile dans le panneau : sa hauteur visible et son défilement. */
  readonly contentHeight: number;
  /** Haut de cette zone dans le panneau (sous l'en-tête). */
  readonly contentTop: number;
  readonly scrollTop: number;
}

export type Vec3 = readonly [number, number, number];

/**
 * Le visualiseur 3D ouvert sur le portfolio : de quoi refaire exactement la même image dans la
 * copie rayons X d'une loupe (même modèle, même caméra, mêmes réglages).
 */
export interface ViewerPresence {
  /** « demo:<id> » pour un modèle d'exemple, « file:<id> » pour un fichier importé. */
  readonly model: string;
  readonly modelName: string;
  /** Position de la caméra et point qu'elle vise, en unités de la scène. */
  readonly camera: { readonly position: Vec3; readonly target: Vec3 };
  /** Lumière principale (intensité, azimut et hauteur en degrés) et lumière d'ambiance. */
  readonly light: {
    readonly intensity: number;
    readonly azimuth: number;
    readonly elevation: number;
    readonly ambient: number;
  };
  /** Position du modèle : décalage, rotation (degrés) et échelle. */
  readonly transform: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly rotation: number;
    readonly scale: number;
  };
}

/**
 * La démo du moteur façon Doom ouverte sur le portfolio : la position du joueur et l'état du rendu,
 * de quoi redessiner exactement la même image dans la copie rayons X d'une loupe.
 */
export interface DoomPresence {
  readonly x: number;
  readonly y: number;
  /** Hauteur des yeux. */
  readonly z: number;
  /** Direction du regard, en radians (0 : l'est). */
  readonly angle: number;
  /** Champ de vision horizontal, en degrés (90 dans Doom). */
  readonly fov: number;
  /** Horloge des effets à 35 images par seconde (0 quand les animations sont coupées). */
  readonly tic: number;
  /** Rendu au ralenti : opérations de dessin déjà faites, sur le total de l'image ; null en direct. */
  readonly replay: { readonly done: number; readonly total: number; readonly playing: boolean } | null;
  /** Découpage de l'arbre BSP affiché sur la carte. */
  readonly bsp: boolean;
  /** Hauteur du plafond de chaque porte. */
  readonly doors: readonly number[];
}

/** Une fenêtre qui affiche le portfolio. */
export interface MainPresence extends WindowBase {
  readonly kind: 'main';
  /** Largeur de mise en page (sans la barre de défilement) : la loupe s'y cale. */
  readonly layoutWidth: number;
  readonly scroll: Point;
  /** Page affichée : « / » pour l'accueil, « /projets/drive » pour une page projet. */
  readonly route: string;
  /** Fenêtre modale ouverte, s'il y en a une. */
  readonly overlay?: OverlayPresence | null;
  /** Visualiseur 3D affiché, s'il y en a un. */
  readonly viewer?: ViewerPresence | null;
  /** Démo façon Doom affichée, s'il y en a une. */
  readonly doom?: DoomPresence | null;
}

/** Une fenêtre loupe. */
export interface LensPresence extends WindowBase {
  readonly kind: 'lens';
  readonly zoom: number;
  /** Fenêtre portfolio actuellement sous la loupe. */
  readonly target: string | null;
  /** Section du portfolio sous le réticule. */
  readonly section: string | null;
  /** Secret en cours d'analyse et son avancement (0 à 1) : le portfolio y fait briller des paillettes. */
  readonly scan?: { readonly id: string; readonly progress: number } | null;
}

export type WindowPresence = MainPresence | LensPresence;

/** Un trou noir du mode singularité, centré sur sa fenêtre (coordonnées écran). */
export interface HolePresence extends PresenceState {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly hue: number;
  readonly rot: number;
  readonly spin: number;
}

export type BusCommand =
  | { readonly type: 'scroll'; readonly target: string; readonly dy: number }
  | { readonly type: 'found'; readonly ids: readonly string[] }
  | { readonly type: 'reset' }
  /** Une fenêtre qui s'ouvre demande aux autres les secrets déjà trouvés. */
  | { readonly type: 'secrets-sync' }
  | { readonly type: 'singularity'; readonly open: boolean }
  | { readonly type: 'theme'; readonly id: string }
  /** Version simple, sans effets, activée ou coupée. */
  | { readonly type: 'simple'; readonly on: boolean }
  /** Un succès caché vient d'être débloqué. */
  | { readonly type: 'achievement'; readonly id: string }
  /** Les succès ont été oubliés (commande « oublier succes »). */
  | { readonly type: 'achievements-reset' }
  /** Code Konami tapé dans la loupe : le portfolio bascule tout entier en rayons X. */
  | { readonly type: 'xray-all'; readonly on: boolean }
  /** Un fichier OBJ importé dans le visualiseur 3D, envoyé aux loupes pour leur copie. */
  | { readonly type: 'viewer-model'; readonly key: string; readonly name: string; readonly text: string }
  /** Une loupe qui n'a pas encore le fichier affiché par le visualiseur le demande. */
  | { readonly type: 'viewer-model-request'; readonly key: string };

export const isMain = (p: WindowPresence): p is MainPresence => p.kind === 'main';
export const isLens = (p: WindowPresence): p is LensPresence => p.kind === 'lens';

/** Le bus qui relie toutes les fenêtres ouvertes sur le site. */
@Injectable({ providedIn: 'root' })
export class WindowBus {
  readonly id = createId();
  /** Rôle actuel de cette fenêtre, tenu à jour par la fonctionnalité loupe. */
  readonly role = signal<WindowRole>('main');
  readonly windows = new PresenceChannel<WindowPresence>('pv2:windows', {
    // Le roster ne bouge que si une fenêtre change de rôle, de taille ou de cible.
    key: (p) => (isLens(p) ? `lens:${p.small}:${p.target}` : `main:${p.small}`),
  });
  readonly holes = new PresenceChannel<HolePresence>('pv2:holes');

  /** Autres fenêtres, par rôle. */
  readonly otherMains = computed(() => this.windows.roster().filter(isMain).length);
  readonly otherLenses = computed(() => this.windows.roster().filter(isLens).length);

  private readonly commandChannel =
    typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('pv2:commands');
  private readonly commandStream = new Subject<BusCommand>();
  readonly commands$ = this.commandStream.asObservable();

  constructor() {
    if (this.commandChannel) {
      this.commandChannel.onmessage = (event: MessageEvent<BusCommand>) => this.commandStream.next(event.data);
    }
    const win = inject(DOCUMENT).defaultView;
    const leave = () => {
      this.windows.leave(this.id);
      this.holes.leave(this.id);
    };
    // Onglet caché : la fenêtre ne se voit plus, elle quitte le roster sans attendre son délai
    // d'oubli. Elle y revient d'elle-même à sa prochaine image, une fois visible.
    const onVisibility = () => {
      if (win?.document.visibilityState === 'hidden') leave();
    };
    win?.addEventListener('pagehide', leave);
    win?.document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => {
      win?.removeEventListener('pagehide', leave);
      win?.document.removeEventListener('visibilitychange', onVisibility);
      leave();
      this.windows.close();
      this.holes.close();
      this.commandChannel?.close();
      this.commandStream.complete();
    });
  }

  send(command: BusCommand): void {
    this.commandChannel?.postMessage(command);
  }
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}
