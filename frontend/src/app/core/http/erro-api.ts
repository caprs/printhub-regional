import { HttpErrorResponse } from '@angular/common/http';

// Transforma o erro da API ({ erro: { codigo, mensagem, detalhes } }) em texto para a tela.
export function mensagemErro(
  erro: unknown,
  padrao = 'Não foi possível concluir a operação. Tente novamente.'
): string {
  if (!(erro instanceof HttpErrorResponse)) {
    return padrao;
  }

  if (erro.status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique se a API está em execução.';
  }

  const corpo = erro.error?.erro;

  if (!corpo?.mensagem) {
    return padrao;
  }

  // Erro de validação: mostra também quais campos estão errados.
  if (corpo.codigo === 'VALIDACAO' && corpo.detalhes) {
    const campos = Object.entries(corpo.detalhes as Record<string, string>)
      .map(([campo, texto]) => `${campo}: ${texto}`)
      .join(' • ');

    return `${corpo.mensagem} ${campos}`;
  }

  return corpo.mensagem;
}

export function codigoErro(erro: unknown): string | null {
  return erro instanceof HttpErrorResponse ? erro.error?.erro?.codigo ?? null : null;
}
