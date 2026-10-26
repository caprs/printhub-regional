// Erro esperado: vira a resposta { erro: { codigo, mensagem, detalhes } }.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (message = 'Registro não encontrado.') =>
  new AppError(404, 'NAO_ENCONTRADO', message);

export const forbidden = (message = 'Você não tem permissão para esta ação.') =>
  new AppError(403, 'SEM_PERMISSAO', message);

export const conflict = (code: string, message: string, details?: unknown) =>
  new AppError(409, code, message, details);
