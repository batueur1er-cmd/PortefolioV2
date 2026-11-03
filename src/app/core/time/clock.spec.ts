import { LOOP_PERIOD, clockDelay, formatClock } from './clock';

describe('clockDelay', () => {
  it('donne la même phase à deux fenêtres ouvertes à des instants différents', () => {
    // Une animation de 8 s démarrée avec ce retard est à (t mod 8 s) de son cycle.
    const phase = (start: number, now: number, duration: number) =>
      (((now - start - parseFloat(clockDelay(start))) % duration) + duration) % duration;
    const now = 1_800_000_123_456;
    expect(phase(now - 3_210, now, 8000)).toBe(phase(now - 91_777, now, 8000));
    expect(phase(now - 3_210, now, 8000)).toBe(now % 8000);
  });

  it('reste dans une période', () => {
    const delay = -parseFloat(clockDelay(1_700_000_000_000));
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThan(LOOP_PERIOD);
  });
});

describe('formatClock', () => {
  it("affiche l'heure de Paris", () => {
    expect(formatClock(Date.UTC(2026, 10, 3, 13, 32, 7))).toBe('14:32:07');
  });
});
