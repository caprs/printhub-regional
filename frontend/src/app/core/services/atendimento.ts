
import { Injectable, signal } from '@angular/core';

export type StatusRetirada =
  | 'AGUARDANDO_RECEBIMENTO'
  | 'DISPONIVEL_RETIRADA'
  | 'RETIRADO';

export interface PedidoRetirada {
  id: number;
  pontoRetiradaId: number;
  cliente: string;
  produtor: string;
  produtos: string[];
  lote: string;
  status: StatusRetirada;
}

@Injectable({
  providedIn: 'root'
})
export class Atendimento {
  private readonly pedidosSignal = signal<PedidoRetirada[]>([
    {
      id: 3001,
      pontoRetiradaId: 1,
      cliente: 'Cliente Exemplo A',
      produtor: 'Produtor Exemplo A',
      produtos: ['Organizador de mesa'],
      lote: 'LOTE-001',
      status: 'AGUARDANDO_RECEBIMENTO'
    },
    {
      id: 3002,
      pontoRetiradaId: 1,
      cliente: 'Cliente Exemplo B',
      produtor: 'Produtor Exemplo B',
      produtos: ['Suporte para celular'],
      lote: 'LOTE-001',
      status: 'DISPONIVEL_RETIRADA'
    },
    {
      id: 3003,
      pontoRetiradaId: 2,
      cliente: 'Cliente Exemplo C',
      produtor: 'Produtor Exemplo C',
      produtos: ['Porta-chaves de parede'],
      lote: 'LOTE-002',
      status: 'AGUARDANDO_RECEBIMENTO'
    }
  ]);

  readonly pedidos = this.pedidosSignal.asReadonly();

  atualizarStatus(
    pedidoId: number,
    pontoRetiradaId: number,
    novoStatus: StatusRetirada
  ): boolean {
    const pedido = this.pedidosSignal().find(
      item =>
        item.id === pedidoId &&
        item.pontoRetiradaId === pontoRetiradaId
    );

    if (!pedido) {
      return false;
    }

    const transicoes: Record<StatusRetirada, StatusRetirada[]> = {
      AGUARDANDO_RECEBIMENTO: ['DISPONIVEL_RETIRADA'],
      DISPONIVEL_RETIRADA: ['RETIRADO'],
      RETIRADO: []
    };

    if (!transicoes[pedido.status].includes(novoStatus)) {
      return false;
    }

    this.pedidosSignal.update(pedidos =>
      pedidos.map(item =>
        item.id === pedidoId
          ? { ...item, status: novoStatus }
          : item
      )
    );

    return true;
  }
}
