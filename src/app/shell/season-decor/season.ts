export type Season = 'hiver' | 'halloween' | null;

/**
 * La saison décorée à une date : de la neige du 1er au 31 décembre, des chauves-souris et des
 * citrouilles du 20 octobre au 2 novembre. Le reste de l'année, rien.
 */
export function seasonOf(date: Date): Season {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 12) return 'hiver';
  if ((month === 10 && day >= 20) || (month === 11 && day <= 2)) return 'halloween';
  return null;
}

export function isSeason(value: string | null): value is Exclude<Season, null> {
  return value === 'hiver' || value === 'halloween';
}
