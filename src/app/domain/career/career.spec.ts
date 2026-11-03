import { PROFILE } from '../profile/profile.data';
import { acronymDecoder, careerMap, careerTotals, educationRuler, educationSpan, timeline } from './career';

const TODAY = new Date(2026, 10, 3);

describe('career', () => {
  it('compte les mois et les jours en direct', () => {
    const items = timeline(PROFILE, TODAY);
    expect(items[0].current).toBe(true);
    expect(items[0].secretText).toContain('J+337');
    expect(Math.max(...items.map((i) => i.barWidth))).toBe(1);
    expect(careerTotals(PROFILE, TODAY).breakdown).toBe('12 + 2 + 2 = 16 mois');
  });

  it('trace la carte du plus ancien au plus récent', () => {
    const map = careerMap(PROFILE, { w: 300, h: 210 }, { id: 'lyon', label: 'Lyon', geo: { lat: 45.764, lon: 4.8357 } });
    expect(map.legs.map((l) => l.key)).toEqual(['ccsb-celere', 'celere-quercy']);
    expect(map.totalKm).toBeGreaterThan(55);
    expect(map.totalKm).toBeLessThan(80);
  });

  it('place les formations sur une frise graduée par année', () => {
    const ruler = educationRuler(PROFILE.education);
    expect(ruler.years[0].year).toBe(2020);
    expect(ruler.years.at(-1)?.year).toBe(2027);
    expect(ruler.bars.map((b) => b.id)).toEqual(['aiguerande', 'lamartine', 'diiage']);
    for (const bar of ruler.bars) expect(bar.start + bar.width).toBeLessThanOrEqual(1);
  });

  it('décode les sigles et résume les années de formation', () => {
    expect(acronymDecoder(PROFILE)).toContain('CPI = Coordinateur de projets informatiques');
    expect(educationSpan(PROFILE.education, TODAY)).toBe('sept. 2020 → août 2026 · 6 ans de formation en ligne droite');
  });
});
