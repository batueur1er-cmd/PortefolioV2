/**
 * Les thèmes disponibles. Chaque identifiant correspond à un bloc
 * `:root[data-theme='…']` dans `src/styles/themes/` ; le premier est le thème par défaut
 * et n'a pas besoin d'attribut.
 */
export const THEMES = [
  { id: 'papier', label: 'Papier' },
  { id: 'nuit', label: 'Nuit' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export type ThemeDef = (typeof THEMES)[number];

export const DEFAULT_THEME: ThemeId = THEMES[0].id;

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}
