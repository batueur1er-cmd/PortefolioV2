import { translateDeep, translateDom, translateText } from './translate';

describe('La traduction', () => {
  const dictionary = new Map([
    ['Bonjour le monde', 'Hello world'],
    ['Profil', 'Profile'],
  ]);

  it('garde les espaces autour du texte et ignore les retours à la ligne', () => {
    expect(translateText('  Bonjour\n  le monde ', dictionary)).toBe('  Hello world ');
    expect(translateText('Inconnu', dictionary)).toBeNull();
  });

  it('applique un motif à un texte qui varie', () => {
    expect(translateText('12 mois', dictionary, [[/^(\d+) mois$/, '$1 months']])).toBe('12 months');
  });

  it('traduit une structure sans toucher au reste', () => {
    expect(translateDeep({ id: 'a', label: 'Profil', list: ['Profil', 3] }, dictionary)).toEqual({ id: 'a', label: 'Profile', list: ['Profile', 3] });
  });

  it('traduit le DOM présent, puis ce qui change', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<h2 aria-label="Profil">Profil</h2>';
    const stop = translateDom(root, dictionary, []);
    expect(root.querySelector('h2')!.textContent).toBe('Profile');
    expect(root.querySelector('h2')!.getAttribute('aria-label')).toBe('Profile');
    root.querySelector('h2')!.firstChild!.nodeValue = 'Bonjour le monde';
    await new Promise((resolve) => setTimeout(resolve));
    expect(root.querySelector('h2')!.textContent).toBe('Hello world');
    stop();
  });
});
