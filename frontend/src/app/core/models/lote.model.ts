export type StatusLote =
  | 'EM_FORMACAO'
  | 'FECHADO'
  | 'AGUARDANDO_PRODUCAO'
  | 'PRONTO_PARA_ENTREGA'
  | 'CONCLUIDO';

export interface Lote {
  id: number;
  codigo: string;
  pontoRetiradaId: number;
  pontoRetirada: string;
  dataAbertura: string;
  dataLimite: string;
  quantidadePedidos: number;
  custoEntrega: number;
  status: StatusLote;
}