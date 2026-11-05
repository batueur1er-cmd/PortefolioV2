import { formatDuration, formatPeriod, formatYearMonth, monthsInclusive } from '@core/time/time';

import { Profile } from './profile.model';

/* Le contenu du CV, tiré des mêmes données que le site : il reste à jour tout seul. */

export interface CvEntry {
  readonly title: string;
  readonly meta: string;
  readonly text?: string;
}

export interface CvSkillGroup {
  readonly label: string;
  readonly skills: readonly string[];
}

/** Les postes visés : `?poste=web` met en avant les projets et compétences de ce métier. */
export const CV_FOCUS = {
  web: { label: 'Développeur web', skills: ['angular', 'typescript', 'html-css', 'javascript', 'nestjs', 'php-laravel', 'api-rest', 'sql', 'threejs'] },
  mobile: { label: 'Développeur mobile', skills: ['kotlin', 'compose', 'api-rest', 'dotnet', 'clean-archi'] },
  backend: { label: 'Développeur back-end', skills: ['dotnet', 'api-rest', 'nestjs', 'sql', 'docker', 'clean-archi', 'gitlab-ci', 'php-laravel'] },
  infra: { label: 'Infrastructure et DevOps', skills: ['infra', 'serveurs', 'reseau', 'windows', 'linux', 'ad-ldap', 'zabbix', 'docker', 'gitlab-ci'] },
} as const;

export type CvFocus = keyof typeof CV_FOCUS;

export function isCvFocus(value: string | null | undefined): value is CvFocus {
  return !!value && value in CV_FOCUS;
}

export interface CvOptions {
  readonly focus?: CvFocus | null;
  /** Adresse du portfolio, pour le QR code ; aucun QR code sans elle. */
  readonly siteUrl?: string | null;
}

export interface CvContent {
  readonly name: string;
  /** Poste visé, quand le CV est orienté. */
  readonly focus: string | null;
  readonly qrUrl: string | null;
  readonly kicker: string;
  readonly lead: string;
  readonly status: string;
  readonly contact: readonly { readonly label: string; readonly value: string; readonly url?: string }[];
  readonly experiences: readonly CvEntry[];
  readonly projects: readonly CvEntry[];
  readonly education: readonly CvEntry[];
  readonly skills: readonly CvSkillGroup[];
  readonly certifications: readonly string[];
  readonly fileName: string;
}

/** Nombre de projets repris sur le CV : les mêmes que ceux affichés en premier sur le site. */
export const CV_PROJECTS = 4;

export function cvContent(profile: Profile, today: Date, options: CvOptions = {}): CvContent {
  const name = `${profile.firstName} ${profile.lastName}`;
  const skillLabel = new Map(profile.skills.map((s) => [s.id, s.label]));
  const focus = options.focus ? CV_FOCUS[options.focus] : null;
  const wanted: ReadonlySet<string> = new Set(focus?.skills ?? []);
  const score = (skills: readonly string[]) => skills.filter((id) => wanted.has(id)).length;
  // Orienté : les projets les plus proches du poste d'abord (ordre du site à égalité).
  const projects = focus
    ? profile.projects
        .map((p, i) => ({ p, i }))
        .sort((a, b) => score(b.p.skills) - score(a.p.skills) || a.i - b.i)
        .map((x) => x.p)
    : profile.projects;
  return {
    name,
    focus: focus?.label ?? null,
    qrUrl: options.siteUrl || null,
    kicker: profile.kicker,
    lead: profile.lead,
    status: profile.status,
    contact: [
      { label: 'E-mail', value: profile.contact.email, url: `mailto:${profile.contact.email}` },
      { label: 'LinkedIn', value: stripScheme(profile.contact.linkedin), url: profile.contact.linkedin },
      { label: 'GitHub', value: stripScheme(profile.contact.github), url: profile.contact.github },
      { label: 'Ville', value: `${profile.city}, ${profile.location}` },
    ],
    experiences: profile.experiences.map((e) => ({
      title: `${e.role} · ${e.company}`,
      meta: `${formatPeriod(e.start, e.end)} (${formatDuration(monthsInclusive(e.start, e.end, today))}) · ${e.contract} · ${e.place.city}`,
      text: e.summary,
    })),
    projects: projects.slice(0, CV_PROJECTS).map((p) => ({
      title: p.title,
      meta: [p.context, p.year, p.skills.map((id) => skillLabel.get(id) ?? id).join(', ')].filter(Boolean).join(' · '),
      text: p.summary,
    })),
    education: profile.education.map((e) => ({
      title: e.acronym ? `${e.degree} (${e.acronym})` : e.degree,
      meta: `${e.school} · ${formatYearMonth(e.start)} — ${formatYearMonth(e.end)}`,
      text: e.field,
    })),
    skills: profile.skillGroups.map((g) => ({
      label: g.label,
      // Orienté : les compétences du poste en tête de chaque groupe.
      skills: profile.skills
        .filter((s) => s.group === g.id)
        .sort((a, b) => Number(wanted.has(b.id)) - Number(wanted.has(a.id)))
        .map((s) => s.label),
    })),
    certifications: profile.certifications.map((c) => `${c.label} : ${c.description}`),
    fileName: `CV-${profile.firstName}-${profile.lastName}${options.focus ? `-${options.focus}` : ''}.pdf`,
  };
}

const stripScheme = (url: string): string => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
