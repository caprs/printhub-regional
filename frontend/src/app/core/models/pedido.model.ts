
export type StatusPedido =
  | 'AGUARDANDO_ACEITACAO'
  | 'ACEITO'
  | 'EM_PRODUCAO'
  | 'PRONTO_PARA_ENTREGA'
  | 'DISPONIVEL_RETIRADA'
  | 'RETIRADO'
  | 'REJEITADO'
  | 'CANCELADO';

export interface Pedido {
  id: number;
  data: string;
  produtor: string;
  produtos: string[];
  pontoRetirada: string;
  subtotal: number;
  taxaEntrega: number | null;
  status: StatusPedido;
  lote: string | null;
}
