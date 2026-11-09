export type Lang = 'fr' | 'en';

const STORAGE_KEY = 'pv2.lang';

/** `localStorage`, s'il est disponible : il peut lever une erreur ou manquer selon le navigateur. */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function detect(): Lang {
  if (typeof location === 'undefined') return 'fr';
  try {
    const url = new URL(location.href);
    const asked = url.searchParams.get('lang');
    if (asked === 'fr' || asked === 'en') {
      storage()?.setItem(STORAGE_KEY, asked);
      // On retire le paramètre : sinon cette fenêtre imposerait sa langue aux autres à chaque rechargement.
      url.searchParams.delete('lang');
      history.replaceState(history.state, '', url);
      return asked;
    }
    return storage()?.getItem(STORAGE_KEY) === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

/**
 * La langue de cette fenêtre, fixée au chargement. Une langue qui change recharge la page : tout le
 * contenu est calculé une seule fois, et toutes les fenêtres gardent ainsi la même mise en page.
 */
export const LANG: Lang = detect();

/** Une autre fenêtre change de langue : celle-ci suit, pour que la loupe reste alignée. */
export function followLang(win: Window | null): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue || event.newValue === LANG) return;
    win?.location.reload();
  };
  win?.addEventListener('storage', onStorage);
  return () => win?.removeEventListener('storage', onStorage);
}
