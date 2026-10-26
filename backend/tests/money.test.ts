import { describe, expect, it } from 'vitest';
import { maxShare, splitCents, toCents } from '../src/lib/money.js';

describe('splitCents (RN15/RN16)', () => {
  it('divide igualmente quando é exato', () => {
    expect(splitCents(1800, 3)).toEqual([600, 600, 600]);
    expect(splitCents(1800, 2)).toEqual([900, 900]);
    expect(splitCents(1800, 1)).toEqual([1800]);
  });

  it('dá a sobra de centavos aos primeiros e fecha a soma', () => {
    expect(splitCents(2000, 3)).toEqual([667, 667, 666]);
    expect(splitCents(1001, 3)).toEqual([334, 334, 333]);
    for (const total of [1, 99, 1000, 2399, 2400, 9999]) {
      for (const parts of [1, 2, 3]) {
        expect(splitCents(total, parts).reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });

  it('estimativa máxima arredonda para cima', () => {
    expect(maxShare(2000, 3)).toBe(667);
    expect(maxShare(1800, 0)).toBe(1800);
  });

  it('converte reais sem erro de ponto flutuante', () => {
    expect(toCents(29.9)).toBe(2990);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(19.99)).toBe(1999);
  });
});
