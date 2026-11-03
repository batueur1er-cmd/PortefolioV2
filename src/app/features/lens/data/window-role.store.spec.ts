import { MainPresence } from '@core/sync/window-bus';
import { LENS_WINDOW, isLensSized } from '@core/sync/window-size';

import { decideRole, forcedRole } from './window-role.store';

const peer = (small: boolean): MainPresence => ({
  kind: 'main',
  id: small ? 'petite' : 'grande',
  t: 0,
  origin: { x: 0, y: 0 },
  viewport: small ? { w: 480, h: 380 } : { w: 1440, h: 900 },
  small,
  layoutWidth: small ? 480 : 1440,
  scroll: { x: 0, y: 0 },
});

describe('rôle de la fenêtre', () => {
  it('fait une loupe d’une petite fenêtre quand une grande est ouverte', () => {
    expect(decideRole(true, [peer(false)])).toBe('lens');
  });

  it('laisse le portfolio à une petite fenêtre seule, ou entourée de petites', () => {
    expect(decideRole(true, [])).toBe('main');
    expect(decideRole(true, [peer(true)])).toBe('main');
  });

  it('ne fait jamais une loupe d’une grande fenêtre', () => {
    expect(decideRole(false, [peer(false)])).toBe('main');
  });

  it('demande les deux dimensions sous le seuil, avec une marge de sortie', () => {
    const { maxWidth: w, maxHeight: h, hysteresis } = LENS_WINDOW;
    expect(isLensSized({ w, h })).toBe(true);
    expect(isLensSized({ w: w + 1, h: 300 })).toBe(false);
    expect(isLensSized({ w: 300, h: h + 1 })).toBe(false);
    // Déjà loupe : il faut dépasser la marge pour redevenir grande.
    expect(isLensSized({ w: w + hysteresis - 1, h }, true)).toBe(true);
    expect(isLensSized({ w: w + hysteresis + 1, h }, true)).toBe(false);
  });

  it('accepte un rôle imposé par l’URL', () => {
    expect(forcedRole('?loupe')).toBe('lens');
    expect(forcedRole('?portfolio')).toBe('main');
    expect(forcedRole('')).toBeNull();
  });
});
