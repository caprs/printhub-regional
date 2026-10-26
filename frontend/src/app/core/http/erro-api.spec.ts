import { HttpErrorResponse } from '@angular/common/http';

import { codigoErro, mensagemErro } from './erro-api';

describe('mensagemErro', () => {
  it('usa a mensagem enviada pela API', () => {
    const erro = new HttpErrorResponse({
      status: 409,
      error: { erro: { codigo: 'ESTOQUE_INSUFICIENTE', mensagem: 'A quantidade solicitada ultrapassa o estoque disponível.' } }
    });

    expect(mensagemErro(erro)).toBe('A quantidade solicitada ultrapassa o estoque disponível.');
    expect(codigoErro(erro)).toBe('ESTOQUE_INSUFICIENTE');
  });

  it('lista os campos em erro de validação', () => {
    const erro = new HttpErrorResponse({
      status: 400,
      error: { erro: { codigo: 'VALIDACAO', mensagem: 'Verifique os campos informados.', detalhes: { preco: 'Obrigatório' } } }
    });

    expect(mensagemErro(erro)).toBe('Verifique os campos informados. preco: Obrigatório');
  });

  it('avisa quando a API está fora do ar', () => {
    expect(mensagemErro(new HttpErrorResponse({ status: 0 }))).toContain('Não foi possível conectar');
  });

  it('usa o texto padrão para erros sem corpo', () => {
    expect(mensagemErro(new HttpErrorResponse({ status: 500 }), 'Padrão')).toBe('Padrão');
    expect(mensagemErro(new Error('x'), 'Padrão')).toBe('Padrão');
  });
});
