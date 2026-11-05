import { seasonOf } from './season';

describe('seasonOf', () => {
  it('neige en décembre', () => {
    expect(seasonOf(new Date(2026, 11, 1))).toBe('hiver');
    expect(seasonOf(new Date(2026, 11, 31))).toBe('hiver');
  });

  it('Halloween du 20 octobre au 2 novembre', () => {
    expect(seasonOf(new Date(2026, 9, 19))).toBeNull();
    expect(seasonOf(new Date(2026, 9, 31))).toBe('halloween');
    expect(seasonOf(new Date(2026, 10, 2))).toBe('halloween');
    expect(seasonOf(new Date(2026, 10, 3))).toBeNull();
  });
});
