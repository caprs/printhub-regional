// O banco guarda centavos; a API recebe e devolve reais.

export const toReais = (cents: number) => cents / 100;

export const toCents = (reais: number) => Math.round(reais * 100);

export const toReaisOrNull = (cents: number | null) => (cents === null ? null : toReais(cents));

// RN15/RN16: divide em partes iguais; a sobra de centavos vai para as primeiras partes.
// Ex.: 2000 em 3 → [667, 667, 666]. A soma é sempre igual ao total.
export function splitCents(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

// Maior parte possível ao dividir o total: é o "no máximo" mostrado como estimativa.
export const maxShare = (total: number, parts: number) => Math.ceil(total / Math.max(parts, 1));
