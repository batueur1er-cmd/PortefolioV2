import { formatYearMonth } from '@core/time/time';
import { currentPosition, timeline } from '@domain/career/career';
import { Profile } from '@domain/profile/profile.model';
import { projectLink, skillLabelsOf } from '@domain/profile/projects';

/** Une ligne de sortie ; `kind` règle sa couleur. */
export interface TermLine {
  readonly text: string;
  readonly kind?: 'out' | 'cmd' | 'err' | 'ok' | 'dim';
}

/** Les chiffres de la visite, pour « stats » et « neofetch ». */
export interface VisitStats {
  /** Temps passé sur cette page depuis son ouverture, en ms. */
  readonly visitMs: number;
  /** Fenêtres du site ouvertes en ce moment, celle-ci comprise. */
  readonly mains: number;
  readonly lenses: number;
  readonly projectsSeen: number;
  readonly schemasSeen: number;
  readonly schemasTotal: number;
  /** Plus fort grossissement atteint avec la loupe, s'il y en a eu un. */
  readonly maxZoom: number | null;
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
  /** Ouvre la singularité, sur ce portfolio et sur les autres fenêtres ouvertes. */
  readonly openSingularity: () => void;
  readonly forgetSecrets: () => void;
  readonly forgetAchievements: () => void;
  readonly stats: () => VisitStats;
  readonly clearRecord: () => void;
  /** Lance la pluie de caractères ; faux si les animations sont réduites. */
  readonly startMatrix: () => boolean;
  readonly clear: () => void;
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

/** « 04:12 », ou « 1:02:14 » au-delà d'une heure. */
function duration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  const rest = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return h ? `${h}:${rest}` : rest;
}

const zoomLabel = (zoom: number | null): string => (zoom === null ? 'pas encore de loupe' : `×${zoom.toFixed(1).replace('.', ',')}`);

const plural = (n: number, word: string): string => `${n} ${word}${n > 1 ? 's' : ''}`;

/** Le monogramme « BN » de neofetch, en ASCII : les blocs pleins n'ont pas la largeur d'une espace. */
const LOGO = [
  ' ____  _   _ ',
  String.raw`| __ )| \ | |`,
  String.raw`|  _ \|  \| |`,
  String.raw`| |_) | |\  |`,
  String.raw`|____/|_| \_|`,
];

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
    name: 'singularite',
    aliases: ['singularité', 'singularity'],
    help: 'ouvre la singularité, sur toutes les fenêtres',
    run: (_, ctx) => {
      ctx.openSingularity();
      return [ok('Ouverture de la singularité…'), dim('Échap ou le bouton « Revenir » pour en sortir.')];
    },
  },
  {
    name: 'oublier',
    aliases: ['forget'],
    help: '<secrets|succes|tout> efface la progression gardée',
    run: ([what], ctx) => {
      const target = what?.toLowerCase().replace('succès', 'succes');
      if (target === 'secrets') {
        ctx.forgetSecrets();
        return [ok('Secrets oubliés : la chasse repart de zéro.')];
      }
      if (target === 'succes') {
        ctx.forgetAchievements();
        return [ok('Succès oubliés.')];
      }
      if (target === 'tout') {
        ctx.forgetSecrets();
        ctx.forgetAchievements();
        return [ok('Secrets et succès oubliés.')];
      }
      return [err('Oublier quoi ?'), dim('Usage : oublier secrets, oublier succes, ou oublier tout')];
    },
  },
  {
    name: 'stats',
    help: 'les chiffres de votre visite',
    run: (_, ctx) => {
      const s = ctx.stats();
      const unlocked = ctx.achievements.filter((a) => a.unlocked).length;
      const row = (label: string, value: string) => out(`  ${label.padEnd(20)} ${value}`);
      return [
        ok('Statistiques de visite'),
        row('cette visite', duration(s.visitMs)),
        row('fenêtres ouvertes', `${s.mains + s.lenses} (${plural(s.mains, 'portfolio')} · ${plural(s.lenses, 'loupe')})`),
        row('secrets', `${ctx.secrets.found}/${ctx.secrets.total}`),
        row('succès', `${unlocked}/${ctx.achievements.length}`),
        row('pages projet vues', `${s.projectsSeen}/${ctx.profile.projects.length}`),
        row('schémas vus', `${s.schemasSeen}/${s.schemasTotal}`),
        row('zoom max de loupe', zoomLabel(s.maxZoom)),
      ];
    },
  },
  {
    name: 'record',
    help: '[effacer] votre meilleur temps de chasse aux secrets',
    run: ([action], ctx) => {
      const { best, elapsed, found, total } = ctx.secrets;
      if (action === 'effacer' || action === 'reset') {
        if (!best) return [dim('Aucun record à effacer.')];
        ctx.clearRecord();
        return [ok('Record effacé.')];
      }
      if (action) return [err(`Action inconnue : ${action}`), dim('Usage : record, ou record effacer')];
      const current = elapsed ? `${elapsed} · ${found}/${total} secrets` : 'pas commencée';
      return [
        best ? ok(`Record : ${best}`) : dim('Pas encore de record : trouvez tous les secrets pour en poser un.'),
        dim(`Chasse en cours : ${current}`),
      ];
    },
  },
  {
    name: 'neofetch',
    aliases: ['fetch'],
    help: 'le profil, façon terminal Linux',
    run: (_, ctx) => {
      const { profile, today } = ctx;
      const s = ctx.stats();
      const now = currentPosition(profile, today);
      const unlocked = ctx.achievements.filter((a) => a.unlocked).length;
      const user = `${profile.firstName.toLowerCase()}@portfolio`;
      const info = [
        user,
        '─'.repeat(user.length),
        ...(now ? [`Poste     ${now.role} · ${now.company}`] : []),
        `Lieu      ${profile.city}`,
        `Stack     ${profile.skills.slice(0, 5).map((k) => k.label).join(', ')}`,
        `Projets   ${profile.projects.length}`,
        `Secrets   ${ctx.secrets.found}/${ctx.secrets.total}`,
        `Succès    ${unlocked}/${ctx.achievements.length}`,
        `Uptime    ${duration(s.visitMs)}`,
        `Shell     angular 21 · zoneless`,
      ];
      const width = LOGO[0].length + 3;
      return Array.from({ length: Math.max(LOGO.length, info.length) }, (_, i) => {
        const text = `${(LOGO[i] ?? '').padEnd(width)}${info[i] ?? ''}`;
        return i === 0 ? ok(text) : out(text);
      });
    },
  },
  {
    name: 'matrix',
    help: 'suivez le lapin blanc',
    run: (_, ctx) =>
      ctx.startMatrix()
        ? [ok('Réveille-toi…'), dim('Échap pour sortir de la matrice.')]
        : [dim('Les animations sont réduites sur cet appareil : la matrice reste fermée.')],
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
