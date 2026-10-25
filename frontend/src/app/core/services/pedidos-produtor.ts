
import { Injectable, signal } from '@angular/core';

export type StatusPedidoProdutor =
  | 'AGUARDANDO_ACEITACAO'
  | 'ACEITO'
  | 'EM_PRODUCAO'
  | 'PRONTO_PARA_ENTREGA'
  | 'REJEITADO';

export interface PedidoProdutor {
  id: number;
  produtorId: number;
  cliente: string;
  data: string;
  produtos: string[];
  subtotal: number;
  pontoRetirada: string;
  status: StatusPedidoProdutor;
}

@Injectable({
  providedIn: 'root'
})
export class PedidosProdutor {
  private readonly pedidosSignal = signal<PedidoProdutor[]>([
    {
      id: 2001,
      produtorId: 1,
      cliente: 'Cliente Exemplo A',
      data: '2026-10-25',
      produtos: ['Organizador de mesa'],
      subtotal: 35,
      pontoRetirada: 'Ponto Centro',
      status: 'AGUARDANDO_ACEITACAO'
    },
    {
      id: 2002,
      produtorId: 1,
      cliente: 'Cliente Exemplo B',
      data: '2026-10-25',
      produtos: ['Vaso geométrico'],
      subtotal: 48,
      pontoRetirada: 'Ponto Bairro',
      status: 'ACEITO'
    },
    {
      id: 2003,
      produtorId: 1,
      cliente: 'Cliente Exemplo C',
      data: '2026-10-25',
      produtos: ['Organizador de mesa', 'Vaso geométrico'],
      subtotal: 83,
      pontoRetirada: 'Ponto Centro',
      status: 'EM_PRODUCAO'
    }
  ]);

  readonly pedidos = this.pedidosSignal.asReadonly();

  atualizarStatus(
    pedidoId: number,
    produtorId: number,
    novoStatus: StatusPedidoProdutor
  ): boolean {
    const pedido = this.pedidosSignal().find(
      item => item.id === pedidoId && item.produtorId === produtorId
    );

    if (!pedido) {
      return false;
    }

    const transicoes: Record<StatusPedidoProdutor, StatusPedidoProdutor[]> = {
      AGUARDANDO_ACEITACAO: ['ACEITO', 'REJEITADO'],
      ACEITO: ['EM_PRODUCAO'],
      EM_PRODUCAO: ['PRONTO_PARA_ENTREGA'],
      PRONTO_PARA_ENTREGA: [],
      REJEITADO: []
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
