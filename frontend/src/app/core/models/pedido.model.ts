import { StatusLote } from './lote.model';

export type StatusPedido =
  | 'AGUARDANDO_ACEITACAO'
  | 'ACEITO'
  | 'EM_PRODUCAO'
  | 'PRONTO_PARA_ENTREGA'
  | 'DISPONIVEL_RETIRADA'
  | 'RETIRADO'
  | 'REJEITADO'
  | 'CANCELADO';

export interface ItemPedido {
  produtoId: number;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  avaliado: boolean;
}

export interface Pedido {
  id: number;
  data: string;
  status: StatusPedido;
  produtor: string;
  produtorId: number;
  cliente: string;
  clienteId: number;
  clienteTelefone: string | null;
  produtos: string[];
  itens: ItemPedido[];
  pontoRetirada: string;
  pontoRetiradaId: number;
  lote: string | null;
  loteId: number | null;
  loteStatus: StatusLote | null;
  subtotal: number;
  // null até o lote fechar
  taxaEntrega: number | null;
  taxaEstimada: number | null;
  total: number;
  taxaDefinitiva: boolean;
  prazoAceite: string;
  aceitoEm: string | null;
  motivoRecusa: string | null;
  motivoCancelamento: 'CONSUMIDOR' | 'PRAZO_EXPIRADO' | null;
  avaliado: boolean;
}

export const NOMES_STATUS_PEDIDO: Record<StatusPedido, string> = {
  AGUARDANDO_ACEITACAO: 'Aguardando aceitação',
  ACEITO: 'Pedido aceito',
  EM_PRODUCAO: 'Em produção',
  PRONTO_PARA_ENTREGA: 'Pronto para entrega',
  DISPONIVEL_RETIRADA: 'Disponível para retirada',
  RETIRADO: 'Retirado',
  REJEITADO: 'Rejeitado',
  CANCELADO: 'Cancelado'
};
