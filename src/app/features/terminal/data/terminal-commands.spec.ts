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
    stats: () => ({ visitMs: 252_000, mains: 1, lenses: 1, projectsSeen: 3, schemasSeen: 2, schemasTotal: 7, maxZoom: 2.4 }),
    clearRecord: () => undefined,
    startMatrix: () => true,
    clear: () => undefined,
    close: () => undefined,
    ...overrides,
  };
}

describe('commandes du terminal', () => {
  it('stats résume la visite', () => {
    const text = runCommand('stats', context()).map((l) => l.text).join('\n');
    expect(text).toContain('04:12');
    expect(text).toContain('2 (1 portfolio · 1 loupe)');
    expect(text).toContain('×2,4');
    expect(text).toContain('2/7');
  });

  it('record efface le meilleur temps sur demande', () => {
    let cleared = false;
    const ctx = context({ secrets: { found: 1, total: 20, elapsed: '00:30', best: '05:00', hint: () => null }, clearRecord: () => (cleared = true) });
    expect(runCommand('record', ctx)[0].text).toBe('Record : 05:00');
    runCommand('record effacer', ctx);
    expect(cleared).toBe(true);
  });

  it('neofetch aligne le logo et le profil', () => {
    const lines = runCommand('neofetch', context()).map((l) => l.text);
    expect(lines[0]).toMatch(/^ ____ .*baptiste@portfolio$/);
    // La colonne d'information commence au même endroit, sous le logo comme à côté.
    expect(lines[1].indexOf('─')).toBe(lines[0].indexOf('baptiste'));
    expect(lines[3].indexOf('Lieu')).toBe(lines[0].indexOf('baptiste'));
    expect(lines.join('\n')).toContain('Uptime    04:12');
  });

  it('matrix respecte les animations réduites', () => {
    expect(runCommand('matrix', context({ startMatrix: () => false }))[0].text).toContain('réduites');
  });

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
