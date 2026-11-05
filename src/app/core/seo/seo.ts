import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoTags {
  readonly title: string;
  readonly description: string;
  /** Adresse de la page, absolue si possible. */
  readonly url: string;
  /** Image d'aperçu, absolue si possible. */
  readonly image: string;
  readonly type: string;
}

/**
 * Pose le titre, la description, les balises Open Graph et Twitter et le lien canonique de la page
 * affichée. Les robots qui n'exécutent pas JavaScript lisent les mêmes balises, écrites dans le
 * HTML de chaque page au moment du build (scripts/seo.mjs).
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  apply(tags: SeoTags): void {
    this.title.setTitle(tags.title);
    const named: Record<string, string> = {
      description: tags.description,
      'twitter:card': 'summary_large_image',
      'twitter:title': tags.title,
      'twitter:description': tags.description,
      'twitter:image': tags.image,
    };
    const properties: Record<string, string> = {
      'og:title': tags.title,
      'og:description': tags.description,
      'og:type': tags.type,
      'og:url': tags.url,
      'og:image': tags.image,
      'og:locale': 'fr_FR',
    };
    for (const [name, content] of Object.entries(named)) this.meta.updateTag({ name, content });
    for (const [property, content] of Object.entries(properties)) this.meta.updateTag({ property, content });

    let canonical = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.doc.createElement('link');
      canonical.rel = 'canonical';
      this.doc.head.appendChild(canonical);
    }
    canonical.href = tags.url;
  }
}
