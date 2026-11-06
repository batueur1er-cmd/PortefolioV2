import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ViewerPresence, WindowBus } from '@core/sync/window-bus';

/** Un fichier OBJ importé, tel que les fenêtres se le passent. */
export interface SharedModel {
  readonly key: string;
  readonly name: string;
  readonly text: string;
}

/** Délai avant de redemander un fichier resté sans réponse (le portfolio s'ouvrait peut-être encore). */
const RETRY_MS = 1500;

/**
 * Le lien entre le visualiseur 3D du portfolio et les copies des loupes. Côté portfolio : l'état à
 * annoncer avec la présence de la fenêtre, et le fichier importé, envoyé à qui le demande. Côté
 * loupe : le dernier fichier reçu. Le fichier ne quitte pas le navigateur : il passe d'une fenêtre à
 * l'autre par le BroadcastChannel.
 */
@Injectable({ providedIn: 'root' })
export class ViewerSession {
  private readonly bus = inject(WindowBus);
  private state: ViewerPresence | null = null;
  private file: SharedModel | null = null;
  private readonly receivedModel = signal<SharedModel | null>(null);
  /** Dernier fichier reçu d'un portfolio (dans une loupe). */
  readonly received = this.receivedModel.asReadonly();
  private requested = { key: '', at: 0 };

  constructor() {
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
      if (command.type === 'viewer-model-request') {
        if (this.file && this.file.key === command.key) this.bus.send({ type: 'viewer-model', ...this.file });
      } else if (command.type === 'viewer-model' && this.bus.role() === 'lens') {
        this.receivedModel.set({ key: command.key, name: command.name, text: command.text });
      }
    });
  }

  /** L'état du visualiseur affiché par cette fenêtre (null s'il n'y en a pas). */
  publish(state: ViewerPresence | null): void {
    this.state = state;
  }

  snapshot(): ViewerPresence | null {
    return this.state;
  }

  /** Un fichier vient d'être importé : les loupes déjà ouvertes le reçoivent tout de suite. */
  share(model: SharedModel): void {
    this.file = model;
    this.bus.send({ type: 'viewer-model', key: model.key, name: model.name, text: model.text });
  }

  /** Demande au portfolio le fichier qu'il affiche ; sans réponse, la demande est refaite plus tard. */
  request(key: string, now: number): void {
    if (this.requested.key === key && now - this.requested.at < RETRY_MS) return;
    this.requested = { key, at: now };
    this.bus.send({ type: 'viewer-model-request', key });
  }
}
