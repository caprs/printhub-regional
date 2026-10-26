import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { Carrinho } from './carrinho';
import { Produto } from '../models/produto.model';

const produto = (id: number, produtorId: number, estoque = 5): Produto => ({
  id,
  produtorId,
  nome: `Produto ${id}`,
  descricao: '',
  categoria: 'Utilidades',
  material: 'PLA',
  cor: null,
  preco: 10.5,
  produtor: `Produtor ${produtorId}`,
  imagem: 'https://placehold.co/600x400',
  estoque,
  prazoProducao: 2,
  ativo: true,
  notaMedia: null,
  totalAvaliacoes: 0
});

describe('Carrinho', () => {
  let service: Carrinho;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(Carrinho);
  });

  it('soma quantidades e subtotal', () => {
    expect(service.adicionar(produto(1, 1), 2)).toBeNull();
    expect(service.adicionar(produto(2, 1), 1)).toBeNull();

    expect(service.quantidadeTotal()).toBe(3);
    expect(service.subtotal()).toBeCloseTo(31.5);
  });

  it('RN11: não mistura produtores no mesmo pedido', () => {
    service.adicionar(produto(1, 1));

    expect(service.adicionar(produto(2, 2))).toContain('mesmo produtor');
    expect(service.itens()).toHaveLength(1);
  });

  it('RN03: não passa do estoque', () => {
    expect(service.adicionar(produto(1, 1, 2), 3)).toContain('estoque');
    expect(service.adicionar(produto(1, 1, 0))).toContain('indisponível');
  });
});
