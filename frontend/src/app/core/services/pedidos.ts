
import { Injectable } from '@angular/core';
import { Pedido } from '../models/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class Pedidos {
  private readonly pedidos: Pedido[] = [
    {
      id: 1001,
      data: '2026-10-23',
      produtor: 'Produtor Exemplo A',
      produtos: ['Organizador de mesa', 'Vaso geométrico'],
      pontoRetirada: 'Ponto Centro',
      subtotal: 83,
      taxaEntrega: 6,
      status: 'DISPONIVEL_RETIRADA',
      lote: 'LOTE-001'
    },
    {
      id: 1002,
      data: '2026-10-24',
      produtor: 'Produtor Exemplo B',
      produtos: ['Suporte para celular'],
      pontoRetirada: 'Ponto Bairro',
      subtotal: 22,
      taxaEntrega: null,
      status: 'EM_PRODUCAO',
      lote: 'LOTE-002'
    },
    {
      id: 1003,
      data: '2026-10-25',
      produtor: 'Produtor Exemplo C',
      produtos: ['Porta-chaves de parede'],
      pontoRetirada: 'Ponto Centro',
      subtotal: 29.90,
      taxaEntrega: null,
      status: 'AGUARDANDO_ACEITACAO',
      lote: null
    }
  ];

  listarMeusPedidos(): Pedido[] {
    return this.pedidos;
  }
}
