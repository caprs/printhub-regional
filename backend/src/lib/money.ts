// O banco guarda centavos; a API recebe e devolve reais.

export const toReais = (cents: number) => cents / 100;

export const toCents = (reais: number) => Math.round(reais * 100);

export const toReaisOrNull = (cents: number | null) => (cents === null ? null : toReais(cents));
