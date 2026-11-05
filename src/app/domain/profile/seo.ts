import type { SeoTags } from '@core/seo/seo';

import { PROFILE } from './profile.data';
import { projectLink } from './projects';

/**
 * Adresse publique du site, sans barre finale (par exemple « https://baptiste-nodon.fr »).
 * Vide tant que le site n'est pas en ligne : les liens restent relatifs et le sitemap n'est
 * pas généré. C'est la seule ligne à remplir au moment de la mise en ligne.
 */
export const SITE_URL = '';

/** Ce qu'une page annonce aux moteurs de recherche et aux aperçus de lien (LinkedIn, Discord…). */
export interface PageMeta {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  /** Image d'aperçu, chemin depuis la racine du site (1200 × 630). */
  readonly image: string;
  readonly type: 'website' | 'article';
}

const FULL_NAME = `${PROFILE.firstName} ${PROFILE.lastName}`;

export const HOME_META: PageMeta = {
  path: '/',
  title: `${FULL_NAME} — Portfolio`,
  description:
    `Portfolio de ${FULL_NAME}, apprenti développeur et étudiant en Bachelor Coordinateur de projets ` +
    `informatiques. ${PROFILE.status}. Ce site a une face cachée : ouvrez la loupe.`,
  image: '/og/portfolio.png',
  type: 'website',
};

/** Toutes les pages du site : l'accueil, puis une par projet. */
export const PAGES: readonly PageMeta[] = [
  HOME_META,
  ...PROFILE.projects.map(
    (p): PageMeta => ({
      path: projectLink(p.id),
      title: `${p.title} — ${FULL_NAME}`,
      description: `${p.context}${p.year ? ` · ${p.year}` : ''}. ${p.summary}`,
      image: `/og/${p.id}.png`,
      type: 'article',
    }),
  ),
];

export function metaFor(path: string): PageMeta {
  return PAGES.find((p) => p.path === path) ?? HOME_META;
}

/** Les balises à poser pour une page. */
export function seoTags(meta: PageMeta): SeoTags {
  return {
    title: meta.title,
    description: meta.description,
    url: absolute(meta.path),
    image: absolute(meta.image),
    type: meta.type,
  };
}

/** Adresse absolue quand le site est en ligne, relative sinon. */
export function absolute(path: string): string {
  return SITE_URL ? `${SITE_URL}${path}` : path;
}
