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

export interface CvContent {
  readonly name: string;
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

export function cvContent(profile: Profile, today: Date): CvContent {
  const name = `${profile.firstName} ${profile.lastName}`;
  const skillLabel = new Map(profile.skills.map((s) => [s.id, s.label]));
  return {
    name,
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
    projects: profile.projects.slice(0, CV_PROJECTS).map((p) => ({
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
      skills: profile.skills.filter((s) => s.group === g.id).map((s) => s.label),
    })),
    certifications: profile.certifications.map((c) => `${c.label} : ${c.description}`),
    fileName: `CV-${profile.firstName}-${profile.lastName}.pdf`,
  };
}

const stripScheme = (url: string): string => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
