import { PROFILE } from '@domain/profile/profile.data';

import { TerminalContext, complete, runCommand } from './terminal-commands';

function context(overrides: Partial<TerminalContext> = {}): TerminalContext {
  return {
    profile: PROFILE,
    today: new Date(2026, 10, 5),
    secrets: { found: 2, total: 20, elapsed: '01:00', best: '', hint: () => 'Section « Profil » : L_ r_s_m_' },
    achievements: [
      { label: 'A', hint: 'a', unlocked: true },
      { label: 'B', hint: 'b', unlocked: false },
    ],
    navigate: () => undefined,
    downloadCv: () => undefined,
    setTheme: () => undefined,
    toggleSimple: () => true,
    openSingularity: () => undefined,
    forgetSecrets: () => undefined,
    forgetAchievements: () => undefined,
    clear: () => undefined,
    close: () => undefined,
    ...overrides,
  };
}

describe('commandes du terminal', () => {
  it('whoami donne le nom et le poste en cours', () => {
    const text = runCommand('whoami', context()).map((l) => l.text).join('\n');
    expect(text).toContain('Baptiste Nodon');
    expect(text).toContain('Quercy Réfrigération');
  });

  it('projet <id> ouvre la page du projet', () => {
    const visited: string[] = [];
    runCommand('projet argus', context({ navigate: (path) => visited.push(path) }));
    expect(visited).toEqual(['/projets/argus']);
  });

  it('signale une commande inconnue', () => {
    expect(runCommand('rm -rf /', context())[0].kind).toBe('err');
  });

  it('cache les succès non débloqués', () => {
    const text = runCommand('succes', context()).map((l) => l.text);
    expect(text).toContain('  ★ A — a');
    expect(text).toContain('  ☆ ???');
  });

  it('indice donne une piste', () => {
    expect(runCommand('indice', context())[0].text).toContain('Profil');
  });

  it('complète le nom d’une commande', () => {
    expect(complete('who')).toBe('whoami ');
    expect(complete('pro')).toBe('pro');
  });
});
