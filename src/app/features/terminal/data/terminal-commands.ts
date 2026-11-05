import { currentPosition, timeline } from '@domain/career/career';
import { formatYearMonth } from '@core/time/time';
import { Profile } from '@domain/profile/profile.model';
import { projectLink, skillLabelsOf } from '@domain/profile/projects';

/** Une ligne de sortie ; `kind` règle sa couleur. */
export interface TermLine {
  readonly text: string;
  readonly kind?: 'out' | 'cmd' | 'err' | 'ok' | 'dim';
}

/** Ce dont les commandes ont besoin : des données à lire et quelques actions sur le site. */
export interface TerminalContext {
  readonly profile: Profile;
  readonly today: Date;
  readonly secrets: {
    readonly found: number;
    readonly total: number;
    /** « 02:14 », vide avant le premier secret. */
    readonly elapsed: string;
    readonly best: string;
    readonly hint: () => string | null;
  };
  readonly achievements: readonly { readonly label: string; readonly hint: string; readonly unlocked: boolean }[];
  readonly navigate: (path: string, fragment?: string) => void;
  readonly downloadCv: (focus: string | null) => void;
  readonly setTheme: (id: 'clair' | 'nuit') => void;
  readonly toggleSimple: () => boolean;
  readonly clear: () => void;
  readonly summonCat: () => void;
  readonly close: () => void;
}

interface Command {
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly help: string;
  readonly run: (args: readonly string[], ctx: TerminalContext) => readonly TermLine[];
}

const out = (text: string): TermLine => ({ text });
const dim = (text: string): TermLine => ({ text, kind: 'dim' });
const ok = (text: string): TermLine => ({ text, kind: 'ok' });
const err = (text: string): TermLine => ({ text, kind: 'err' });

const SECTIONS = ['profil', 'parcours', 'realisations', 'competences', 'formation', 'contact'];

export const COMMANDS: readonly Command[] = [
  {
    name: 'aide',
    aliases: ['help', '?'],
    help: 'liste des commandes',
    run: () => [
      out('Commandes disponibles :'),
      ...COMMANDS.map((c) => dim(`  ${c.name.padEnd(12)} ${c.help}`)),
      dim('  ↑ ↓ : historique · Tab : complétion · Échap : fermer'),
    ],
  },
  {
    name: 'whoami',
    help: 'qui suis-je',
    run: (_, { profile, today }) => {
      const now = currentPosition(profile, today);
      return [
        ok(`${profile.firstName} ${profile.lastName}`),
        out(profile.kicker),
        out(profile.lead),
        ...(now ? [dim(`${now.role} · ${now.company} · depuis ${now.since} (${now.duration})`)] : []),
        dim(`${profile.city} · ${profile.location}`),
      ];
    },
  },
  {
    name: 'parcours',
    help: 'expériences professionnelles',
    run: (_, { profile, today }) =>
      timeline(profile, today).flatMap((item) => [
        ok(`${item.exp.role} · ${item.exp.company}`),
        dim(`  ${item.period} · ${item.duration} · ${item.exp.contract} · ${item.exp.place.city}`),
      ]),
  },
  {
    name: 'projets',
    aliases: ['ls'],
    help: 'liste des projets',
    run: (_, { profile }) => [
      ...profile.projects.map((p) => out(`  ${p.id.padEnd(10)} ${p.title} — ${p.context}${p.year ? ` · ${p.year}` : ''}`)),
      dim('Tapez « projet <id> » pour ouvrir sa page.'),
    ],
  },
  {
    name: 'projet',
    aliases: ['cd', 'open'],
    help: '<id> ouvre la page d’un projet',
    run: ([id], ctx) => {
      const project = ctx.profile.projects.find((p) => p.id === id?.toLowerCase());
      if (!id) return [err('Quel projet ? Exemple : projet argus'), dim(`ids : ${ctx.profile.projects.map((p) => p.id).join(', ')}`)];
      if (!project) return [err(`Projet inconnu : ${id}`), dim('Tapez « projets » pour la liste.')];
      ctx.navigate(projectLink(project.id));
      return [ok(`→ ${project.title}`), dim(skillLabelsOf(project.skills).join(' · '))];
    },
  },
  {
    name: 'competences',
    aliases: ['skills'],
    help: 'compétences par domaine',
    run: (_, { profile }) =>
      profile.skillGroups.flatMap((g) => [
        ok(g.label),
        dim(`  ${profile.skills.filter((s) => s.group === g.id).map((s) => s.label).join(' · ')}`),
      ]),
  },
  {
    name: 'formation',
    help: 'diplômes et écoles',
    run: (_, { profile }) =>
      profile.education.flatMap((e) => [
        ok(e.acronym ? `${e.degree} (${e.acronym})` : e.degree),
        dim(`  ${e.school} · ${formatYearMonth(e.start)} — ${formatYearMonth(e.end)}`),
      ]),
  },
  {
    name: 'contact',
    help: 'me joindre',
    run: (_, { profile }) => [
      out(`e-mail    ${profile.contact.email}`),
      out(`linkedin  ${profile.contact.linkedin}`),
      out(`github    ${profile.contact.github}`),
    ],
  },
  {
    name: 'cv',
    help: '[web|mobile|backend|infra] télécharge le CV, orienté ou non',
    run: ([focus], ctx) => {
      const postes = ['web', 'mobile', 'backend', 'infra'];
      if (focus && !postes.includes(focus)) return [err(`Poste inconnu : ${focus}`), dim(`postes : ${postes.join(', ')}`)];
      ctx.downloadCv(focus ?? null);
      return [ok(focus ? `Génération du CV orienté « ${focus} »…` : 'Génération du CV en PDF…')];
    },
  },
  {
    name: 'aller',
    aliases: ['goto'],
    help: '<section> fait défiler jusqu’à une section',
    run: ([section], ctx) => {
      const id = section?.toLowerCase();
      if (!id || !SECTIONS.includes(id)) return [err('Section inconnue.'), dim(`sections : ${SECTIONS.join(', ')}`)];
      ctx.navigate('/', id);
      return [ok(`→ ${id}`)];
    },
  },
  {
    name: 'secrets',
    help: 'avancement de la chasse',
    run: (_, { secrets }) => [
      out(`${secrets.found}/${secrets.total} secrets trouvés${secrets.elapsed ? ` · ${secrets.elapsed}` : ''}`),
      ...(secrets.best ? [dim(`Record : ${secrets.best}`)] : []),
      dim(secrets.found ? 'Continuez avec la loupe.' : 'Indice : une seconde fenêtre, rétrécie, voit à travers.'),
    ],
  },
  {
    name: 'indice',
    aliases: ['hint'],
    help: 'un indice sur un secret pas encore trouvé',
    run: (_, { secrets }) => {
      const hint = secrets.hint();
      return hint ? [ok(hint), dim('Il se révèle sous la loupe, après 4 secondes d’analyse.')] : [ok('Tous les secrets sont trouvés.')];
    },
  },
  {
    name: 'succes',
    aliases: ['succès', 'achievements'],
    help: 'succès cachés débloqués',
    run: (_, { achievements }) => [
      out(`${achievements.filter((a) => a.unlocked).length}/${achievements.length} succès`),
      ...achievements.map((a) => (a.unlocked ? ok(`  ★ ${a.label} — ${a.hint}`) : dim('  ☆ ???'))),
    ],
  },
  {
    name: 'theme',
    help: '<clair|nuit> change de thème',
    run: ([id], ctx) => {
      if (id !== 'clair' && id !== 'nuit') return [err('Usage : theme clair, ou theme nuit')];
      ctx.setTheme(id);
      return [ok(`Thème ${id}.`)];
    },
  },
  {
    name: 'simple',
    help: 'active ou coupe la version simple',
    run: (_, ctx) => [ok(ctx.toggleSimple() ? 'Version simple activée.' : 'Version simple coupée.')],
  },
  {
    name: 'chat',
    aliases: ['cat', 'miaou'],
    help: 'le chat de la maison',
    run: (_, ctx) => {
      ctx.summonCat();
      return [out(' /\\_/\\'), out('( o.o )  miaou.'), out(' > ^ <'), dim('Regardez en bas de l’écran.')];
    },
  },
  {
    name: 'date',
    help: 'la date du jour',
    run: (_, { today }) => [out(today.toLocaleDateString('fr-FR', { dateStyle: 'full' }))],
  },
  {
    name: 'sudo',
    help: 'essayez toujours',
    run: () => [err('Permission refusée : ce portfolio ne se laisse pas administrer.')],
  },
  {
    name: 'effacer',
    aliases: ['clear', 'cls'],
    help: 'vide l’écran',
    run: (_, ctx) => {
      ctx.clear();
      return [];
    },
  },
  {
    name: 'quitter',
    aliases: ['exit', 'q'],
    help: 'ferme le terminal',
    run: (_, ctx) => {
      ctx.close();
      return [];
    },
  },
];

const BY_NAME = new Map(COMMANDS.flatMap((c) => [c.name, ...(c.aliases ?? [])].map((n) => [n, c] as const)));

/** Exécute une ligne tapée et renvoie la sortie à afficher. */
export function runCommand(input: string, ctx: TerminalContext): readonly TermLine[] {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return [];
  const command = BY_NAME.get(name.toLowerCase());
  if (!command) return [err(`Commande inconnue : ${name}`), dim('Tapez « aide » pour la liste.')];
  return command.run(args, ctx);
}

/** Complète le premier mot tapé, s'il n'y a qu'une commande possible. */
export function complete(input: string): string {
  if (/\s/.test(input.trim()) || !input.trim()) return input;
  const matches = COMMANDS.map((c) => c.name).filter((n) => n.startsWith(input.trim().toLowerCase()));
  return matches.length === 1 ? `${matches[0]} ` : input;
}
