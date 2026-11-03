import { daysSince, formatDuration, formatPeriod, formatYearMonth, monthsInclusive, parseYearMonth } from './time';

describe('time', () => {
  const today = new Date(2026, 10, 3); // 3 novembre 2026

  it('lit les dates AAAA et AAAA-MM', () => {
    expect(parseYearMonth('2025-03')).toEqual({ year: 2025, month: 3 });
    expect(parseYearMonth('2023')).toEqual({ year: 2023, month: 1 });
    expect(() => parseYearMonth('mars 2025')).toThrow();
  });

  it('compte les mois bornes incluses, comme LinkedIn', () => {
    expect(monthsInclusive('2025-03', '2025-04', today)).toBe(2);
    expect(monthsInclusive('2024-05', '2024-06', today)).toBe(2);
    expect(monthsInclusive('2025-12', null, today)).toBe(12);
  });

  it('compte les jours depuis le début du mois de départ', () => {
    expect(daysSince('2026-11', today)).toBe(2);
    expect(daysSince('2025-12', today)).toBe(337);
  });

  it('formate durées et périodes en français', () => {
    expect(formatDuration(2)).toBe('2 mois');
    expect(formatDuration(12)).toBe('1 an');
    expect(formatDuration(27)).toBe('2 ans et 3 mois');
    expect(formatYearMonth('2025-12')).toBe('déc. 2025');
    expect(formatYearMonth('2023')).toBe('2023');
    expect(formatPeriod('2025-12', null)).toBe("déc. 2025 — aujourd'hui");
  });
});
