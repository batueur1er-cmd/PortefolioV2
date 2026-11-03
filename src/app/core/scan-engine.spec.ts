import { ScanEngine } from './scan-engine';

describe('ScanEngine', () => {
  it('ne valide un secret qu’après le temps d’analyse', () => {
    const engine = new ScanEngine(500);
    const candidates = new Set(['a']);
    expect(engine.step(candidates, 200).completed).toEqual([]);
    expect(engine.step(candidates, 200).progress).toBeCloseTo(0.8);
    expect(engine.step(candidates, 200).completed).toEqual(['a']);
  });

  it('fait retomber l’analyse quand la loupe s’éloigne', () => {
    const engine = new ScanEngine(500);
    engine.step(new Set(['a']), 400);
    engine.step(new Set(), 100); // -200 ms
    const result = engine.step(new Set(['a']), 200);
    expect(result.completed).toEqual([]);
    expect(result.progress).toBeCloseTo(0.8);
  });

  it('suit le secret le plus avancé', () => {
    const engine = new ScanEngine(500);
    engine.step(new Set(['a']), 300);
    const result = engine.step(new Set(['a', 'b']), 50);
    expect(result.focus).toBe('a');
    expect(result.progress).toBeCloseTo(0.7);
  });
});
